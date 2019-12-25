'use strict';

import * as vscode from 'vscode';
import TimePeriodCalculator = require('./TimePeriodCalculator');

class TimePeriodController {

    private _timeCalculator: TimePeriodCalculator;
    private _disposable: vscode.Disposable;
    private _statusBarItem: vscode.StatusBarItem;

    constructor(timeCalculator: TimePeriodCalculator) {
        this._timeCalculator = timeCalculator;

        // Create as needed
        if (!this._statusBarItem) {
            this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }

        // subscribe to selection change and editor activation events
        const subscriptions: vscode.Disposable[] = [];
        vscode.window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        vscode.window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        // update the counter for the current file
        this.updateTimePeriod();

        // create a combined disposable from both event subscriptions
        this._disposable = vscode.Disposable.from(...subscriptions);
    }

    public dispose() {
        this._statusBarItem.dispose();
        this._disposable.dispose();
    }

    public updateTimePeriod() {

        // Get the current text editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }

        const doc = editor.document;

        // Only update status if an log file
        if (doc.languageId === 'log') {

            this._statusBarItem.text = '';

            // Get the selections first and last non empty line
            const firstLine: vscode.TextLine = doc.lineAt(editor.selection.start.line);
            let lastLine: vscode.TextLine;
            // If last line is not partially selected use last but first line
            if (editor.selection.end.character === 0) {
                lastLine = doc.lineAt(editor.selection.end.line - 1);
            } else {
                lastLine = doc.lineAt(editor.selection.end.line);
            }

            const timePeriod = firstLine.text !== lastLine.text ? this._timeCalculator.getTimePeriod(firstLine.text, lastLine.text) : undefined;

            if (timePeriod !== undefined) {

                // Update the status bar
                this._statusBarItem.text = this._timeCalculator.convertToDisplayString(timePeriod);
                this._statusBarItem.show();

            } else {
                this._statusBarItem.hide();
            }

        } else {
            this._statusBarItem.hide();
        }
    }

    private _onEvent() {
        this.updateTimePeriod();
    }
}

export = TimePeriodController;
