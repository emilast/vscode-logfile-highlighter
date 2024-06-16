'use strict';

import * as vscode from 'vscode';
import { ProgressIndicator } from './ProgressIndicator';

export class ProgressIndicatorController {

    private _progressIndicator: ProgressIndicator;
    private _disposable: vscode.Disposable;
    private _statusBarItem: vscode.StatusBarItem;

    constructor(progressIndicator: ProgressIndicator) {
        this._progressIndicator = progressIndicator;

        // subscribe to selection change and editor activation events
        const subscriptions: vscode.Disposable[] = [];

        // Setup
        const config = vscode.workspace.getConfiguration('logFileHighlighter');
        const enableProgressIndicator = config.get('enableProgressIndicator', true);

        if (enableProgressIndicator) {
            vscode.window.onDidChangeTextEditorSelection(event => this.decorateLines(event), this, subscriptions);
        }

        // create a combined disposable from both event subscriptions
        this._disposable = vscode.Disposable.from(...subscriptions);
    }

    public dispose() {
        this._statusBarItem.dispose();
        this._disposable.dispose();
    }

    private decorateLines(event: vscode.TextEditorSelectionChangeEvent) {
        if (event.textEditor === vscode.window.activeTextEditor) {
            for (const selection of event.selections) {
                this._progressIndicator.decorateLines(event.textEditor, selection.start.line, selection.end.line);
            }
        }
    }
}