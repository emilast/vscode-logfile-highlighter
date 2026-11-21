'use strict';

import * as vscode from 'vscode';
import { Constants } from './Constants';
import { FoldingMode } from './LogFolding';
import { AllLogLevels, LogLevel, logLevelName } from './LogLevelParser';
import { LogOverview } from './LogOverview';

type FilterItem = vscode.QuickPickItem & ({ level: LogLevel } | { text: string } | { folding: true } | { newText: string });

/** The time in a timestamp, e.g. "09:14:02" in "2026-11-21 09:14:02.118". */
function timeOf(timestamp: string | undefined): string | undefined {
    return timestamp?.match(/\d{1,2}:\d{2}(:\d{2})?/)?.[0] ?? timestamp;
}

/**
 * A summary line at the top of each log (#75, #99), as CodeLenses: the lines, time span, errors and warnings, the
 * levels shown and the folding. Clicking the levels opens a quick pick to show or hide levels and texts.
 */
export class LogSummaryCodeLens implements vscode.CodeLensProvider, vscode.Disposable {

    private readonly _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
    private readonly disposables: vscode.Disposable[] = [];

    constructor(private readonly overview: LogOverview) {
        this.disposables.push(
            vscode.languages.registerCodeLensProvider({ language: Constants.LogLanguageId }, this),
            vscode.commands.registerCommand('logFileHighlighter.showLogFilters', () => this.showFilters()),
            overview.onDidChange(() => this._onDidChangeCodeLenses.fire()),
            vscode.workspace.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('logFileHighlighter.showLogSummary')) {
                    this._onDidChangeCodeLenses.fire();
                }
            }),
        );
    }

    public dispose() {
        this.disposables.forEach((d) => d.dispose());
        this._onDidChangeCodeLenses.dispose();
    }

    public provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        if (!vscode.workspace.getConfiguration('logFileHighlighter').get<boolean>('showLogSummary', true) || document.lineCount === 0) {
            return [];
        }
        const summary = this.overview.getSummary(document);
        const counts = summary.entryCounts;
        const state = summary.state;
        const range = new vscode.Range(0, 0, 0, 0);
        const lens = (title: string, command = '', tooltip?: string) => new vscode.CodeLens(range, { title, command, tooltip });

        const lines = `${summary.lineCount.toLocaleString('en-US')} lines`
            + (summary.hiddenLineCount > 0 ? ` (${summary.hiddenLineCount.toLocaleString('en-US')} hidden)` : '');
        const lenses = [lens(lines, summary.hiddenLineCount > 0 ? 'logFileHighlighter.showAllLines' : '',
            summary.hiddenLineCount > 0 ? 'Show all lines' : undefined)];
        if (summary.timeSpan) {
            lenses.push(lens(`${summary.timeSpan} (${timeOf(summary.from)} – ${timeOf(summary.to)})`, '', `From ${summary.from} to ${summary.to}`));
        }
        const plural = (n: number, word: string) => `${n.toLocaleString('en-US')} ${word}${n === 1 ? '' : 's'}`;
        lenses.push(lens(`$(error) ${plural(counts[LogLevel.Error], 'error')}`, 'logFileHighlighter.goToNextError', 'Go to the next error'));
        lenses.push(lens(`$(warning) ${plural(counts[LogLevel.Warning], 'warning')}`, 'logFileHighlighter.goToNextWarning', 'Go to the next warning'));

        const hidden = AllLogLevels.filter((l) => state.hiddenLevels.has(l) && counts[l] > 0).map(logLevelName);
        const texts = state.hiddenTexts.length;
        const filter = hidden.length === 0 && texts === 0 ? 'Showing all levels'
            : [hidden.length > 0 ? `${hidden.join(', ')} hidden` : '', texts > 0 ? plural(texts, 'text') + ' hidden' : '']
                .filter((s) => s).join(', ');
        lenses.push(lens(`$(filter) ${filter}`, 'logFileHighlighter.showLogFilters', 'Show or hide log levels and texts'));
        lenses.push(lens(`$(fold) Fold: ${state.foldingMode === FoldingMode.Off ? 'off' : 'by ' + state.foldingMode}`,
            'logFileHighlighter.setFoldingMode', 'Change how the log is folded'));
        return lenses;
    }

    /** A quick pick with a check box per level, hidden text and the folding of entries. Typing adds a text to hide. */
    private async showFilters(): Promise<void> {
        const document = this.overview.currentLog();
        if (!document) {
            return;
        }
        const state = this.overview.getState(document);
        const counts = this.overview.getInfo(document).analysis.entryCounts;

        const levelItems: FilterItem[] = AllLogLevels
            .filter((level) => counts[level] > 0 || (level >= LogLevel.Debug && level <= LogLevel.Error))
            .map((level) => ({ label: logLevelName(level), description: counts[level].toLocaleString('en-US'), level }));
        const textItems: FilterItem[] = state.hiddenTexts.map((text) => ({ label: `Hide "${text}"`, text }));
        const foldingLabel = state.foldingMode === FoldingMode.Minute || state.foldingMode === FoldingMode.Hour
            ? `Fold by ${state.foldingMode}` : 'Fold multi-line entries, like stack traces';
        const foldingItem: FilterItem = { label: foldingLabel, folding: true };
        const separator = (label: string): FilterItem => ({ label, kind: vscode.QuickPickItemKind.Separator } as FilterItem);
        const fixedItems = [
            separator('Log levels'), ...levelItems,
            ...(textItems.length > 0 ? [separator('Hidden text'), ...textItems] : []),
            separator('Folding'), foldingItem,
        ];

        const pick = vscode.window.createQuickPick<FilterItem>();
        pick.title = 'Show in the log';
        pick.placeholder = 'Uncheck what to hide, or type a text to hide the entries that contain it';
        pick.canSelectMany = true;
        pick.matchOnDescription = false;
        pick.items = fixedItems;
        pick.selectedItems = [
            ...levelItems.filter((i) => 'level' in i && !state.hiddenLevels.has(i.level)),
            ...textItems,
            ...(state.foldingMode !== FoldingMode.Off ? [foldingItem] : []),
        ];

        // Typing a text that's no item offers to hide it
        let newItem: FilterItem | undefined;
        pick.onDidChangeValue((value) => {
            const selected = pick.selectedItems.filter((i) => i !== newItem);
            newItem = value.trim() ? { label: `Hide "${value}"`, description: 'new', alwaysShow: true, newText: value } : undefined;
            pick.items = newItem ? [newItem, ...fixedItems] : fixedItems;
            pick.selectedItems = newItem ? [newItem, ...selected] : selected;
        });

        const accepted = await new Promise<readonly FilterItem[] | undefined>((resolve) => {
            pick.onDidAccept(() => { resolve(pick.selectedItems); pick.hide(); });
            pick.onDidHide(() => resolve(undefined));
            pick.show();
        });
        pick.dispose();
        if (!accepted) {
            return;
        }

        await this.overview.updateState(document, (s) => {
            s.hiddenLevels = new Set(AllLogLevels.filter((l) => !accepted.some((i) => 'level' in i && i.level === l)));
            s.hiddenTexts = [
                ...accepted.filter((i): i is FilterItem & { text: string } => 'text' in i).map((i) => i.text),
                ...accepted.filter((i): i is FilterItem & { newText: string } => 'newText' in i).map((i) => i.newText),
            ];
            const foldingOn = accepted.includes(foldingItem);
            if (!foldingOn) {
                s.foldingMode = FoldingMode.Off;
            } else if (s.foldingMode === FoldingMode.Off) {
                s.foldingMode = FoldingMode.Entry;
            }
        });
    }
}
