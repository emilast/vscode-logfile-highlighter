'use strict';

import * as vscode from 'vscode';
import { Constants } from './Constants';
import { analyzeLog, formatDuration, LogAnalysis } from './LogAnalysis';
import { computeFolding, defaultViewState, FoldingMode, isFiltering, LogFolding, LogViewState } from './LogFolding';
import { AllLogLevels, LogLevel, logLevelName, LogLevelParser, LogLevelRule } from './LogLevelParser';
import { TimePeriodCalculator } from './TimePeriodCalculator';
import { TimestampParser } from './TimestampParsers/TimestampParser';

/** Summary information about a log, for the views that show it. */
export interface LogSummary {
    document: vscode.TextDocument;
    lineCount: number;
    hiddenLineCount: number;
    /** The number of entries of each level, indexed by LogLevel. */
    entryCounts: number[];
    /** The first and last timestamps, as written in the log. */
    from?: string;
    to?: string;
    /** E.g. "2h, 13min", or undefined if the log has no timestamps that can be compared. */
    timeSpan?: string;
    state: LogViewState;
}

interface DocumentInfo {
    version: number;
    analysis: LogAnalysis;
    folding: LogFolding;
}

export const FoldingModeNames: { [mode: string]: string } = {
    [FoldingMode.Off]: 'Off',
    [FoldingMode.Entry]: 'By entry (multi-line messages)',
    [FoldingMode.Minute]: 'By minute',
    [FoldingMode.Hour]: 'By hour',
};

/**
 * Hides log lines by level or text, and folds logs by entry or time (#75, #99), for the views that control it.
 * VS Code has no API to hide lines, so hidden lines are folded: each run of hidden lines is a folding range that
 * starts on the visible line before it.
 */
export class LogOverview implements vscode.FoldingRangeProvider, vscode.Disposable {

    private readonly _onDidChange = new vscode.EventEmitter<vscode.TextDocument | undefined>();
    /** Fired when the state, the summary or the active log changes. */
    public readonly onDidChange = this._onDidChange.event;

    private readonly _onDidChangeFoldingRanges = new vscode.EventEmitter<void>();
    public readonly onDidChangeFoldingRanges = this._onDidChangeFoldingRanges.event;

    private readonly states = new Map<string, LogViewState>();
    private readonly infos = new Map<string, DocumentInfo>();
    /** Bumped when the folding ranges change, to wait until VS Code has asked for the new ones. */
    private rangesVersion = 0;
    private providedVersion = new Map<string, number>();
    private parser: LogLevelParser;
    private readonly timeCalculator = new TimePeriodCalculator(new TimestampParser());
    private readonly timestampParser = new TimestampParser();
    private readonly disposables: vscode.Disposable[] = [];
    private changeTimer: NodeJS.Timeout | undefined;
    /** The log that the views show and the commands work on: the active one, or the last active one. */
    private lastLog: vscode.TextDocument | undefined;

    constructor() {
        this.parser = this.createParser();
        this.disposables.push(
            vscode.languages.registerFoldingRangeProvider({ language: Constants.LogLanguageId }, this),
            vscode.workspace.onDidChangeTextDocument((e) => this.onDocumentChanged(e.document)),
            vscode.workspace.onDidCloseTextDocument((d) => {
                this.infos.delete(d.uri.toString());
                this.states.delete(d.uri.toString());
                if (d === this.lastLog) {
                    this.lastLog = undefined;
                    this._onDidChange.fire(undefined);
                }
            }),
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (editor?.document.languageId === Constants.LogLanguageId && editor.document !== this.lastLog) {
                    this.lastLog = editor.document;
                    this._onDidChange.fire(editor.document);
                }
            }),
            vscode.workspace.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('logFileHighlighter.logLevels')) {
                    this.parser = this.createParser();
                    this.infos.clear();
                    this.changed(undefined);
                }
            }),
            vscode.commands.registerCommand('logFileHighlighter.toggleLogLevel', (level?: LogLevel) => this.toggleLevelCommand(level)),
            vscode.commands.registerCommand('logFileHighlighter.addTextFilter', (text?: string) => this.addTextFilterCommand(text)),
            vscode.commands.registerCommand('logFileHighlighter.removeTextFilter', (text?: string) => this.removeTextFilterCommand(text)),
            vscode.commands.registerCommand('logFileHighlighter.setFoldingMode', (mode?: FoldingMode) => this.setFoldingModeCommand(mode)),
            vscode.commands.registerCommand('logFileHighlighter.showAllLines', () => this.showAllLinesCommand()),
            vscode.commands.registerCommand('logFileHighlighter.goToNextError', () => this.goToNext(LogLevel.Error)),
            vscode.commands.registerCommand('logFileHighlighter.goToNextWarning', () => this.goToNext(LogLevel.Warning)),
            vscode.commands.registerCommand('logFileHighlighter.goToLine', (uri: vscode.Uri, line: number) => this.goToLine(uri, line)),
        );
    }

    public dispose() {
        clearTimeout(this.changeTimer);
        this.disposables.forEach((d) => d.dispose());
        this._onDidChange.dispose();
        this._onDidChangeFoldingRanges.dispose();
    }

    private createParser(): LogLevelParser {
        const rules = vscode.workspace.getConfiguration('logFileHighlighter').get<LogLevelRule[]>('logLevels', []);
        return new LogLevelParser(Array.isArray(rules) ? rules : []);
    }

    /** The log that the views show and the commands work on: the active log, or the last active one if it's still open. */
    public currentLog(): vscode.TextDocument | undefined {
        const editor = vscode.window.activeTextEditor;
        if (editor?.document.languageId === Constants.LogLanguageId) {
            this.lastLog = editor.document;
        }
        return this.lastLog && !this.lastLog.isClosed ? this.lastLog : undefined;
    }

    public getState(document: vscode.TextDocument): LogViewState {
        const key = document.uri.toString();
        let state = this.states.get(key);
        if (!state) {
            state = defaultViewState();
            this.states.set(key, state);
        }
        return state;
    }

    /** The analysis and folding of a document, worked out again only when it or the state has changed. */
    public getInfo(document: vscode.TextDocument): DocumentInfo {
        const key = document.uri.toString();
        let info = this.infos.get(key);
        if (!info || info.version !== document.version) {
            const lineAt = (line: number) => document.lineAt(line).text;
            const analysis = analyzeLog(document.lineCount, lineAt, this.parser);
            info = { version: document.version, analysis, folding: computeFolding(analysis, lineAt, this.getState(document)) };
            this.infos.set(key, info);
        }
        return info;
    }

    public getSummary(document: vscode.TextDocument): LogSummary {
        const { analysis, folding } = this.getInfo(document);
        const summary: LogSummary = {
            document,
            lineCount: analysis.lineCount,
            hiddenLineCount: folding.hiddenLineCount,
            entryCounts: analysis.entryCounts,
            state: this.getState(document),
        };
        if (analysis.firstTimestampLine >= 0) {
            const first = document.lineAt(analysis.firstTimestampLine).text;
            const last = document.lineAt(analysis.lastTimestampLine).text;
            summary.from = this.timestampParser.getTimestampFromText(first)?.original;
            summary.to = this.timestampParser.getTimestampFromText(last)?.original;
            const period = this.timeCalculator.getTimePeriod(first, last);
            if (period?.duration) {
                summary.timeSpan = formatDuration(period.duration.asMilliseconds());
            }
        }
        return summary;
    }

    public provideFoldingRanges(document: vscode.TextDocument): vscode.FoldingRange[] {
        this.providedVersion.set(document.uri.toString(), this.rangesVersion);
        return this.getInfo(document).folding.ranges.map((r) => new vscode.FoldingRange(r.start, r.end));
    }

    /** Changes the state of a log, then folds its visible editors to match. */
    public async updateState(document: vscode.TextDocument, update: (state: LogViewState) => void): Promise<void> {
        update(this.getState(document));
        this.infos.delete(document.uri.toString());
        this.changed(document);
        await this.applyFolding(document, true);
    }

    private changed(document: vscode.TextDocument | undefined) {
        this.rangesVersion++;
        this._onDidChangeFoldingRanges.fire();
        this._onDidChange.fire(document);
    }

    private onDocumentChanged(document: vscode.TextDocument) {
        if (document.languageId !== Constants.LogLanguageId) {
            return;
        }
        // Logs can grow fast in tail mode, so the summary and the hidden lines are updated at most a few times a second
        clearTimeout(this.changeTimer);
        this.changeTimer = setTimeout(() => {
            this.changed(document);
            if (isFiltering(this.getState(document))) {
                this.applyFolding(document, false);
            }
        }, 300);
    }

    /**
     * Folds the hiding ranges in the editors of the document. VS Code's fold commands work on the active editor,
     * so each editor is made active first. Unless only lines were added, everything is unfolded first, so lines that
     * are no longer hidden are shown.
     */
    private async applyFolding(document: vscode.TextDocument, unfoldFirst: boolean): Promise<void> {
        await this.waitForFoldingRanges(document);
        const previous = vscode.window.activeTextEditor;
        const editors = vscode.window.visibleTextEditors.filter((e) => e.document === document);
        const starts = this.getInfo(document).folding.hidingRanges.map((r) => r.start);
        for (const editor of editors) {
            if (vscode.window.activeTextEditor !== editor) {
                await vscode.window.showTextDocument(editor.document, { viewColumn: editor.viewColumn, preserveFocus: false });
            }
            if (unfoldFirst) {
                await vscode.commands.executeCommand('editor.unfoldAll');
            }
            if (starts.length > 0) {
                await vscode.commands.executeCommand('editor.fold', { levels: 1, direction: 'down', selectionLines: starts });
            }
        }
        if (previous && previous !== vscode.window.activeTextEditor && editors.length > 1) {
            await vscode.window.showTextDocument(previous.document, { viewColumn: previous.viewColumn });
        }
    }

    /** Waits until VS Code has asked for the latest folding ranges of the document, or a second has passed. */
    private async waitForFoldingRanges(document: vscode.TextDocument): Promise<void> {
        const key = document.uri.toString();
        const start = Date.now();
        while ((this.providedVersion.get(key) ?? -1) < this.rangesVersion && Date.now() - start < 1000) {
            await new Promise((resolve) => setTimeout(resolve, 20));
        }
        // VS Code applies the ranges just after it gets them
        await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Commands. Each works on the active log editor.

    private async toggleLevelCommand(level?: LogLevel) {
        const document = this.currentLog();
        if (!document) {
            return;
        }
        if (level === undefined) {
            await this.pickLevels(document);
            return;
        }
        await this.updateState(document, (s) => {
            if (s.hiddenLevels.has(level)) {
                s.hiddenLevels.delete(level);
            } else {
                s.hiddenLevels.add(level);
            }
        });
    }

    /** Lets the user pick the levels to show. */
    public async pickLevels(document: vscode.TextDocument): Promise<void> {
        const state = this.getState(document);
        const counts = this.getInfo(document).analysis.entryCounts;
        const items = AllLogLevels.map((level) => ({
            label: logLevelName(level),
            description: counts[level].toLocaleString('en-US'),
            picked: !state.hiddenLevels.has(level),
            level,
        }));
        const picked = await vscode.window.showQuickPick(items, { canPickMany: true, title: 'Show log levels' });
        if (picked) {
            await this.updateState(document, (s) => {
                s.hiddenLevels = new Set(AllLogLevels.filter((l) => !picked.some((p) => p.level === l)));
            });
        }
    }

    private async addTextFilterCommand(text?: string) {
        const document = this.currentLog();
        if (!document) {
            return;
        }
        if (text === undefined) {
            text = await vscode.window.showInputBox({
                title: 'Hide log entries that contain',
                prompt: 'Entries whose first line contains this text are hidden. The text is matched exactly, with case.',
            });
        }
        if (text) {
            await this.updateState(document, (s) => {
                if (!s.hiddenTexts.includes(text)) {
                    s.hiddenTexts.push(text);
                }
            });
        }
    }

    /** Takes the text, or a view item with the text, e.g. from a remove button in a view. */
    private async removeTextFilterCommand(textOrItem?: string | { text: string }) {
        const document = this.currentLog();
        const text = typeof textOrItem === 'string' ? textOrItem : textOrItem?.text;
        if (document && text !== undefined) {
            await this.updateState(document, (s) => {
                s.hiddenTexts = s.hiddenTexts.filter((t) => t !== text);
            });
        }
    }

    private async setFoldingModeCommand(mode?: FoldingMode) {
        const document = this.currentLog();
        if (!document) {
            return;
        }
        if (mode === undefined) {
            const current = this.getState(document).foldingMode;
            const items = Object.keys(FoldingModeNames).map((m) => ({
                label: FoldingModeNames[m], description: m === current ? 'current' : undefined, mode: m as FoldingMode,
            }));
            mode = (await vscode.window.showQuickPick(items, { title: 'Fold the log' }))?.mode;
        }
        if (mode !== undefined) {
            await this.updateState(document, (s) => { s.foldingMode = mode; });
        }
    }

    private async showAllLinesCommand() {
        const document = this.currentLog();
        if (document) {
            await this.updateState(document, (s) => {
                s.hiddenLevels.clear();
                s.hiddenTexts = [];
            });
        }
    }

    /** Moves the cursor to the next entry of the level after the cursor, from the top again after the last one. */
    public async goToNext(level: LogLevel): Promise<void> {
        const document = this.currentLog();
        if (!document) {
            return;
        }
        const editor = vscode.window.visibleTextEditors.find((e) => e.document === document);
        const { analysis } = this.getInfo(document);
        const current = editor ? editor.selection.active.line : -1;
        for (let i = 1; i <= analysis.lineCount; i++) {
            const line = (current + i) % analysis.lineCount;
            if (analysis.entryStarts[line] && analysis.levels[line] === level) {
                await this.goToLine(document.uri, line);
                return;
            }
        }
        vscode.window.setStatusBarMessage(`No ${logLevelName(level)} entries in this log`, 3000);
    }

    public async goToLine(uri: vscode.Uri, line: number): Promise<void> {
        const editor = vscode.window.visibleTextEditors.find((e) => e.document.uri.toString() === uri.toString());
        const shown = await vscode.window.showTextDocument(editor?.document ?? await vscode.workspace.openTextDocument(uri),
            { viewColumn: editor?.viewColumn });
        const position = new vscode.Position(line, 0);
        shown.selection = new vscode.Selection(position, position);
        shown.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
    }
}
