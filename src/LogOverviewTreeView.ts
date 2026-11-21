'use strict';

import * as path from 'path';
import * as vscode from 'vscode';
import { FoldingMode } from './LogFolding';
import { AllLogLevels, LogLevel, logLevelName } from './LogLevelParser';
import { FoldingModeNames, LogOverview, LogSummary } from './LogOverview';

type Node =
    | { kind: 'section'; id: 'summary' | 'levels' | 'texts' | 'folding'; label: string }
    | { kind: 'fact'; label: string; description: string; icon?: string; command?: string; tooltip?: string }
    | { kind: 'level'; level: LogLevel; count: number; shown: boolean }
    | { kind: 'text'; text: string }
    | { kind: 'addText' }
    | { kind: 'folding'; mode: FoldingMode; current: boolean };

const levelIcons: { [level: number]: vscode.ThemeIcon } = {
    [LogLevel.Error]: new vscode.ThemeIcon('error', new vscode.ThemeColor('list.errorForeground')),
    [LogLevel.Warning]: new vscode.ThemeIcon('warning', new vscode.ThemeColor('list.warningForeground')),
    [LogLevel.Info]: new vscode.ThemeIcon('info'),
    [LogLevel.Debug]: new vscode.ThemeIcon('debug'),
    [LogLevel.Trace]: new vscode.ThemeIcon('debug-step-into'),
    [LogLevel.None]: new vscode.ThemeIcon('dash'),
};

/**
 * The Log Overview view in the side bar (#75, #99): a summary of the current log, check boxes to show or hide
 * levels, text filters and the folding mode.
 */
export class LogOverviewTreeView implements vscode.TreeDataProvider<Node>, vscode.Disposable {

    private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>();
    public readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private readonly view: vscode.TreeView<Node>;
    private readonly disposables: vscode.Disposable[] = [];
    private summary: LogSummary | undefined;

    constructor(private readonly overview: LogOverview) {
        this.view = vscode.window.createTreeView('logFileHighlighter.overview', { treeDataProvider: this, showCollapseAll: false });
        this.disposables.push(
            this.view,
            this.view.onDidChangeCheckboxState((e) => this.onCheckboxes(e)),
            this.view.onDidChangeVisibility(() => this.refresh()),
            overview.onDidChange(() => this.refresh()),
        );
        this.refresh();
    }

    public dispose() {
        this.disposables.forEach((d) => d.dispose());
        this._onDidChangeTreeData.dispose();
    }

    private refresh() {
        const document = this.overview.currentLog();
        // Working out the summary of a big log takes a moment, so it's only done while the view is shown
        this.summary = document && this.view.visible ? this.overview.getSummary(document) : undefined;
        this.view.description = document ? path.basename(document.fileName) : undefined;
        const errors = this.summary?.entryCounts[LogLevel.Error] ?? 0;
        this.view.badge = errors > 0 ? { value: errors, tooltip: `${errors} errors in the log` } : undefined;
        this._onDidChangeTreeData.fire();
    }

    public getChildren(node?: Node): Node[] {
        const summary = this.summary;
        if (!summary) {
            return [];
        }
        if (!node) {
            return [
                { kind: 'section', id: 'summary', label: 'Summary' },
                { kind: 'section', id: 'levels', label: 'Show Levels' },
                { kind: 'section', id: 'texts', label: 'Hide Text' },
                { kind: 'section', id: 'folding', label: 'Folding' },
            ];
        }
        if (node.kind !== 'section') {
            return [];
        }
        const counts = summary.entryCounts;
        const state = summary.state;
        switch (node.id) {
            case 'summary': {
                const lines = summary.lineCount.toLocaleString('en-US')
                    + (summary.hiddenLineCount > 0 ? ` (${summary.hiddenLineCount.toLocaleString('en-US')} hidden)` : '');
                const facts: Node[] = [{ kind: 'fact', label: 'Lines', description: lines }];
                if (summary.from) {
                    facts.push({ kind: 'fact', label: 'From', description: summary.from });
                    facts.push({ kind: 'fact', label: 'To', description: summary.to ?? '' });
                }
                if (summary.timeSpan) {
                    facts.push({ kind: 'fact', label: 'Time span', description: summary.timeSpan });
                }
                facts.push({
                    kind: 'fact', label: 'Errors', description: counts[LogLevel.Error].toLocaleString('en-US'), icon: 'error',
                    command: 'logFileHighlighter.goToNextError', tooltip: 'Go to the next error',
                });
                facts.push({
                    kind: 'fact', label: 'Warnings', description: counts[LogLevel.Warning].toLocaleString('en-US'), icon: 'warning',
                    command: 'logFileHighlighter.goToNextWarning', tooltip: 'Go to the next warning',
                });
                return facts;
            }
            case 'levels':
                // Levels the log doesn't have are left out, except the common ones
                return AllLogLevels
                    .filter((level) => counts[level] > 0 || (level >= LogLevel.Debug && level <= LogLevel.Error))
                    .map((level) => ({ kind: 'level', level, count: counts[level], shown: !state.hiddenLevels.has(level) }));
            case 'texts':
                return [...state.hiddenTexts.map((text): Node => ({ kind: 'text', text })), { kind: 'addText' }];
            case 'folding':
                return Object.keys(FoldingModeNames).map((mode): Node => ({
                    kind: 'folding', mode: mode as FoldingMode, current: state.foldingMode === mode,
                }));
        }
    }

    public getTreeItem(node: Node): vscode.TreeItem {
        switch (node.kind) {
            case 'section': {
                const item = new vscode.TreeItem(node.label, vscode.TreeItemCollapsibleState.Expanded);
                item.id = node.id;
                return item;
            }
            case 'fact': {
                const item = new vscode.TreeItem(node.label);
                item.description = node.description;
                item.tooltip = node.tooltip;
                if (node.icon) {
                    item.iconPath = new vscode.ThemeIcon(node.icon,
                        new vscode.ThemeColor(node.icon === 'error' ? 'list.errorForeground' : 'list.warningForeground'));
                }
                if (node.command) {
                    item.command = { command: node.command, title: node.tooltip ?? node.label };
                }
                return item;
            }
            case 'level': {
                const item = new vscode.TreeItem(logLevelName(node.level));
                item.id = `level-${node.level}`;
                item.description = node.count.toLocaleString('en-US');
                item.iconPath = levelIcons[node.level];
                item.checkboxState = node.shown ? vscode.TreeItemCheckboxState.Checked : vscode.TreeItemCheckboxState.Unchecked;
                item.tooltip = node.shown ? `Hide the ${logLevelName(node.level)} entries` : `Show the ${logLevelName(node.level)} entries`;
                return item;
            }
            case 'text': {
                const item = new vscode.TreeItem(`"${node.text}"`);
                item.id = `text-${node.text}`;
                item.iconPath = new vscode.ThemeIcon('eye-closed');
                item.tooltip = `Entries whose first line contains "${node.text}" are hidden`;
                item.contextValue = 'textFilter';
                return item;
            }
            case 'addText': {
                const item = new vscode.TreeItem('Add a text to hide…');
                item.iconPath = new vscode.ThemeIcon('add');
                item.command = { command: 'logFileHighlighter.addTextFilter', title: 'Hide log entries containing text' };
                return item;
            }
            case 'folding': {
                const item = new vscode.TreeItem(FoldingModeNames[node.mode]);
                item.id = `folding-${node.mode}`;
                item.iconPath = new vscode.ThemeIcon(node.current ? 'pass-filled' : 'circle-large-outline');
                item.command = { command: 'logFileHighlighter.setFoldingMode', title: 'Fold the log', arguments: [node.mode] };
                return item;
            }
        }
    }

    private async onCheckboxes(e: vscode.TreeCheckboxChangeEvent<Node>) {
        const document = this.overview.currentLog();
        if (!document) {
            return;
        }
        await this.overview.updateState(document, (state) => {
            for (const [node, checked] of e.items) {
                if (node.kind === 'level') {
                    if (checked === vscode.TreeItemCheckboxState.Checked) {
                        state.hiddenLevels.delete(node.level);
                    } else {
                        state.hiddenLevels.add(node.level);
                    }
                }
            }
        });
    }
}
