'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import TimePeriodCalculator = require('./TimePeriodCalculator');
import TimePeriodController = require('./TimePeriodController');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // create a new word counter
let timeCalculator = new TimePeriodCalculator();
let controller = new TimePeriodController(timeCalculator);

// Add to a list of disposables which are disposed when this extension is deactivated.
context.subscriptions.push(controller);
context.subscriptions.push(timeCalculator);
}

// this method is called when your extension is deactivated
export function deactivate() {
}