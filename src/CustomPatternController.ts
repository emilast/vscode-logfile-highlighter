'use strict';

import * as vscode from 'vscode';
import { CustomPatternDecorator } from './CustomPatternDecorator';

export class CustomPatternController {
    private readonly LOG_ID: string = 'log';

    private _disposable: vscode.Disposable;
    private _decorator: CustomPatternDecorator;

    public constructor( decorator: CustomPatternDecorator) {

        this._decorator = decorator;
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
        this._decorator.dispose();
    }

    private onDidChangeConfiguration(): void {
        this._decorator.updateConfiguration();
        const logEditors = vscode.window.visibleTextEditors.filter((editor) => {
            return editor.document.languageId === this.LOG_ID;
        });

        if (logEditors.length !== 0) {
            this._decorator.decorateEditors(logEditors);
        }
    }

    private onDidChangeTextDocument(changedEvent: vscode.TextDocumentChangeEvent) {
        if (changedEvent.document.languageId === this.LOG_ID) {
            this._decorator.decorateDocument(changedEvent);
        }
    }

    private onDidChangeVisibleTextEditors(editors: readonly vscode.TextEditor[]) {
        const logEditors = editors.filter((editor) => {
            return editor.document.languageId === this.LOG_ID;
        });

        if (logEditors.length !== 0) {
            this._decorator.decorateEditors(logEditors);
        }
    }
}
