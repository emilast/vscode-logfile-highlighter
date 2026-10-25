import * as vscode from 'vscode';
import { AnsiDecorator } from './AnsiDecorator';
import { Constants } from './Constants';

export class AnsiController {

    // Delay before re-decorating a changed document, to avoid re-parsing on every keystroke or appended line.
    private static readonly UpdateDelayMs = 200;

    private _disposable: vscode.Disposable;
    private _decorator: AnsiDecorator;
    private _pendingUpdates: Map<string, ReturnType<typeof setTimeout>>;

    public constructor(decorator: AnsiDecorator) {

        this._decorator = decorator;
        this._pendingUpdates = new Map<string, ReturnType<typeof setTimeout>>();
        const subscriptions: vscode.Disposable[] = [];

        // Subscribe to the events.
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('logFileHighlighter')) {
                this.onDidChangeConfiguration();
            }
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
        for (const timeout of this._pendingUpdates.values()) {
            clearTimeout(timeout);
        }
        this._pendingUpdates.clear();

        this._disposable.dispose();
        this._decorator.dispose();
    }

    private onDidChangeConfiguration(): void {
        this._decorator.updateConfiguration();
        this._decorator.decorateEditors(this.getLogEditors(vscode.window.visibleTextEditors));
    }

    private onDidChangeTextDocument(changedEvent: vscode.TextDocumentChangeEvent) {
        const document = changedEvent.document;
        if (document.languageId !== Constants.LogLanguageId || changedEvent.contentChanges.length === 0) {
            return;
        }

        const key = document.uri.toString();
        const pending = this._pendingUpdates.get(key);
        if (pending !== undefined) {
            clearTimeout(pending);
        }

        this._pendingUpdates.set(key, setTimeout(() => {
            this._pendingUpdates.delete(key);
            const editors = vscode.window.visibleTextEditors.filter((editor) => editor.document === document);
            this._decorator.decorateEditors(editors);
        }, AnsiController.UpdateDelayMs));
    }

    private onDidChangeVisibleTextEditors(editors: readonly vscode.TextEditor[]) {
        this._decorator.decorateEditors(this.getLogEditors(editors));
    }

    private getLogEditors(editors: readonly vscode.TextEditor[]): vscode.TextEditor[] {
        return editors.filter((editor) => {
            return editor.document.languageId === Constants.LogLanguageId;
        });
    }
}
