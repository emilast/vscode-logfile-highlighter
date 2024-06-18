'use strict';

import * as vscode from 'vscode';
import { ProgressIndicator } from './ProgressIndicator';

export class ProgressIndicatorController {

    private _progressIndicator: ProgressIndicator;
    private _disposableSubscriptions: vscode.Disposable;
    private _statusBarItem: vscode.StatusBarItem;

    constructor(progressIndicator: ProgressIndicator) {
        this._progressIndicator = progressIndicator;

        vscode.workspace.onDidChangeConfiguration(() => { this.onDidChangeConfiguration(); }, this);
    }

    private progressIndicatorIsEnabled() {
        const config = vscode.workspace.getConfiguration('logFileHighlighter');
        const enableProgressIndicator = config.get('enableProgressIndicator', true);
        return enableProgressIndicator;
    }

    public dispose() {
        this._statusBarItem.dispose();
        this._disposableSubscriptions.dispose();
    }

    private onDidChangeConfiguration(): void {
        const enableProgressIndicator = this.progressIndicatorIsEnabled();

        if (enableProgressIndicator) {
            this.registerSelectionEventHandlers();
        }
        else {
            // Remove all decorations
            this._progressIndicator.removeAllDecorations();

            // Unregister all event listeners
            this.unregisterSelectionEventHandlers();
        }
    }

    private registerSelectionEventHandlers() {
        this.unregisterSelectionEventHandlers();

        const subscriptions: vscode.Disposable[] = [];
        vscode.window.onDidChangeTextEditorSelection(event => this.decorateLines(event), this, subscriptions);
        this._disposableSubscriptions = vscode.Disposable.from(...subscriptions);
    }

    private unregisterSelectionEventHandlers() {
        if (this._disposableSubscriptions) {
            this._disposableSubscriptions.dispose();
            this._disposableSubscriptions = null;
        }
    }

    private decorateLines(event: vscode.TextEditorSelectionChangeEvent) {
        if (event.textEditor === vscode.window.activeTextEditor) {
            for (const selection of event.selections) {
                this._progressIndicator.decorateLines(event.textEditor, selection.start.line, selection.end.line);
            }
        }
    }
}