'use strict';

import * as vscode from 'vscode';
import { ProgressIndicator } from './ProgressIndicator';

export class ProgressIndicatorController {

    private _progressIndicator: ProgressIndicator;
    private _disposableSubscriptions: vscode.Disposable;
    private _statusBarItem: vscode.StatusBarItem;

    constructor(progressIndicator: ProgressIndicator) {
        this._progressIndicator = progressIndicator;

        this.init();

        vscode.workspace.onDidChangeConfiguration(() => { this.onDidChangeConfiguration(); }, this);
    }

    public removeDecorations() {
        this._progressIndicator.removeAllDecorations();
    }
    
    private getConfiguration(): { enableProgressIndicator: boolean, progressIndicatorUnderlineColor: string } {
        const config = vscode.workspace.getConfiguration('logFileHighlighter');

        const enableProgressIndicator = config.get('enableProgressIndicator', true);
        const progressIndicatorUnderlineColor = config.get('progressIndicatorUnderlineColor', '#00ff1f8f');

        return {
            enableProgressIndicator,
            progressIndicatorUnderlineColor
        };
    }

    public dispose() {
        this._statusBarItem.dispose();
        this._disposableSubscriptions.dispose();
    }

    private onDidChangeConfiguration(): void {
        this.init();
    }

    private init() {
        const config = this.getConfiguration();

        if (config.enableProgressIndicator) {
            this.registerSelectionEventHandlers();
            this._progressIndicator.removeAllDecorations(); // Do this before the call to setUnderlineColor since the decoration object will be recreated
            this._progressIndicator.setUnderlineColor(config.progressIndicatorUnderlineColor);
        }
        else {
            // Remove all decorations in case they're disabled now or have changed settings
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