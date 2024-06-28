'use strict';

import * as vscode from 'vscode';
import { TimePeriodCalculator } from './TimePeriodCalculator';
import { SelectionHelper } from './SelectionHelper';
import { Constants } from './Constants';

export class TimePeriodController {

    private _timeCalculator: TimePeriodCalculator;
    private _selectionHelper: SelectionHelper;
    private _disposable: vscode.Disposable;
    private _statusBarItem: vscode.StatusBarItem;

    constructor(timeCalculator: TimePeriodCalculator, selectionHelper: SelectionHelper ) {
        this._timeCalculator = timeCalculator;
        this._selectionHelper = selectionHelper;

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
        if (doc.languageId === Constants.LOG_ID) {

            this._statusBarItem.text = '';

            let texts = this._selectionHelper.getFirstAndLastLines(editor, doc);

            if (texts !== undefined) {
                let timePeriod = this._timeCalculator.getTimePeriod(texts.startLine, texts.endLine);
                if (timePeriod !== undefined) {

                    // Update the status bar
                    this._statusBarItem.text = this._timeCalculator.convertToDisplayString(timePeriod.duration);
                    this._statusBarItem.show();

                } else {
                    this._statusBarItem.hide();
                }
            }

        } else {
            this._statusBarItem.hide();
        }
    }

    private _onEvent() {
        this.updateTimePeriod();
    }
}