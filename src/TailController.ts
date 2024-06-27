'use strict';

import * as vscode from 'vscode';

export class TailController {

    private _disposable: vscode.Disposable;
    private _statusBarItem: vscode.StatusBarItem;

    private _tailModeActive: boolean = false;

    constructor() {

        // Create as needed
        if (!this._statusBarItem) {
            this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }

        // subscribe to selection change and editor activation events
        const subscriptions: vscode.Disposable[] = [];

        vscode.workspace.onDidChangeTextDocument(event => {
            this.tailLogFile(event.document);
        }, this, subscriptions);

        vscode.window.onDidChangeTextEditorVisibleRanges(event => {
            this.checkEndOfFileVisibilityInActiveEditor();
        }, this, subscriptions);

        vscode.window.onDidChangeActiveTextEditor(event => {
            this.editorChanged(event);
        }, this, subscriptions);

        // create a combined disposable from both event subscriptions
        this._disposable = vscode.Disposable.from(...subscriptions);

        this.checkEndOfFileVisibilityInActiveEditor();
    }

    public dispose() {
        this._statusBarItem.dispose();
        this._disposable.dispose();
    }

    private checkEndOfFileVisibilityInActiveEditor() {
        const textEditor = vscode.window.activeTextEditor;
        const visibleRanges = vscode.window.activeTextEditor.visibleRanges
        
        if (textEditor?.document.languageId === 'log') {
            const lastLine = textEditor.document.lineCount - 1;
            const lastVisibleRange = visibleRanges[0].end.line;

            if (lastVisibleRange >= lastLine) {
                // The end of the file is visible
                this._tailModeActive = true;
                this._statusBarItem.text = 'Log file tail mode';
                this._statusBarItem.show();
                
                return;
            }
        }

        // Else: Not a log file, or the end of the file is not visible => no tail mode
        this._tailModeActive = false;
        this._statusBarItem.hide();
    }

    editorChanged(event: vscode.TextEditor) {
        this.checkEndOfFileVisibilityInActiveEditor();
    }

    private tailLogFile(document: vscode.TextDocument) {
        if (this._tailModeActive) {
            // Get the last line number
            const lastLine = document.lineCount - 1;
            const range = new vscode.Range(lastLine, 0, lastLine, 0);

            // Scroll to the last line
            vscode.window.activeTextEditor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        }
    }
}