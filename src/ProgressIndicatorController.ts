'use strict';

import * as vscode from 'vscode';
import { ProgressIndicator } from './ProgressIndicator';

export class ProgressIndicatorController {

    private _progressIndicator: ProgressIndicator;
    private _disposableSubscriptions: vscode.Disposable | undefined;
    private _statusBarItem: vscode.StatusBarItem | undefined;
    private _configurationListener: vscode.Disposable | undefined;

    constructor(progressIndicator: ProgressIndicator) {
        this._progressIndicator = progressIndicator;

        this.init();

        this._configurationListener = vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('logFileHighlighter')) {
                this.onDidChangeConfiguration();
            }
        }, this);
    }

    public removeDecorations() {
        this._progressIndicator.removeAllDecorations();
        this.clearEditorSelections();
    }

    private clearEditorSelections() {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            // Get the current active cursor position
            const currentPosition = editor.selection.active;
            // Clear selections by setting the selection to the current cursor position
            editor.selection = new vscode.Selection(currentPosition, currentPosition);
        }
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
        if (this._configurationListener) {
            this._configurationListener.dispose();
            this._configurationListener = undefined;
        }
        if (this._statusBarItem) {
            this._statusBarItem.dispose();
            this._statusBarItem = undefined;
        }
        this.unregisterSelectionEventHandlers();
        this._progressIndicator.dispose();
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
            this._disposableSubscriptions = undefined;
        }
    }

    /// Decorates the lines in the specified range of the given text editor.
    private decorateLines(event: vscode.TextEditorSelectionChangeEvent) {
        try {
            // Validate event and editor before processing
            if (!event.textEditor || !event.textEditor.document) {
                return;
            }
            if (event.textEditor === vscode.window.activeTextEditor) {
                for (const selection of event.selections) {
                    this._progressIndicator.decorateLines(event.textEditor, selection.start.line, selection.end.line);
                }
            }
        } catch (error) {
            // Only log the error, since this runs on every selection change and a message
            // box would be shown over and over again.
            console.error('Log File Highlighter: Error while decorating lines:', error);
        }
    }
}