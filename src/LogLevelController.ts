'use strict';

import * as vscode from 'vscode';
import LogLevelColorizer = require('./LogLevelColorizer');

class LogLevelController {
    private readonly LOG_ID: string = 'log';

    private _disposable: vscode.Disposable;
    private _colorizer: LogLevelColorizer;

    public constructor( colorizer: LogLevelColorizer) {

        this._colorizer = colorizer;
        const subscriptions: vscode.Disposable[] = [];

        // Subscribe to the events.
        vscode.workspace.onDidChangeConfiguration(() => {
            this.onDidChangeConfiguration();
        }, this, subscriptions);
        vscode.workspace.onDidChangeTextDocument((changedEvent) => {
            this.onDidChangeTextDocument(changedEvent);
        }, this, subscriptions);
        vscode.window.onDidChangeVisibleTextEditors((editors) => {
            this.onDidChangeVisibleTextEditors(editors);
        }, this, subscriptions);

        this._disposable = vscode.Disposable.from(...subscriptions);

        // Initial call.
        this.onDidChangeConfiguration();
    }

    public dispose() {
        this._disposable.dispose();
    }

    private onDidChangeConfiguration(): void {
        this._colorizer.updateConfiguration();
        const logEditors = vscode.window.visibleTextEditors.filter((editor) => {
            return editor.document.languageId === this.LOG_ID;
        });

        if (logEditors.length !== 0) {
            this._colorizer.colorfyEditors(logEditors);
        }
    }

    private onDidChangeTextDocument(changedEvent: vscode.TextDocumentChangeEvent) {
        if (changedEvent.document.languageId === this.LOG_ID) {
            this._colorizer.colorfyDocument(changedEvent);
        }
    }

    private onDidChangeVisibleTextEditors(editors: vscode.TextEditor[]) {
        const logEditors = editors.filter((editor) => {
            return editor.document.languageId === this.LOG_ID;
        });

        if (logEditors.length !== 0) {
            this._colorizer.colorfyEditors(logEditors);
        }
    }
}

export = LogLevelController;
