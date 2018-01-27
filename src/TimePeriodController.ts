'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import TimePeriodCalculator = require('./TimePeriodCalculator');

class TimePeriodController {

    private _timeCalculator: TimePeriodCalculator;
    private _disposable: vscode.Disposable;

    constructor(timeCalculator: TimePeriodCalculator) {
        this._timeCalculator = timeCalculator;

        // subscribe to selection change and editor activation events
        let subscriptions: vscode.Disposable[] = [];
        vscode.window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        vscode.window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        // update the counter for the current file
        this._timeCalculator.updateTimePeriod();

        // create a combined disposable from both event subscriptions
        this._disposable = vscode.Disposable.from(...subscriptions);
    }

    dispose() {
        this._disposable.dispose();
    }

    private _onEvent() {
        this._timeCalculator.updateTimePeriod();
    }
}

export = TimePeriodController;