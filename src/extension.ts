'use strict';

import * as vscode from 'vscode';
import LogLevelColorizer = require('./LogLevelColorizer');
import LogLevelController = require('./LogLevelController');
import TimePeriodCalculator = require('./TimePeriodCalculator');
import TimePeriodController = require('./TimePeriodController');

// this method is called when the extension is activated
export function activate(context: vscode.ExtensionContext) {

    // create a new time calculator and controller
    const timeCalculator = new TimePeriodCalculator();
    const timeController = new TimePeriodController(timeCalculator);

    // create log level colorizer and -controller
    const logColorizer = new LogLevelColorizer();
    const logController = new LogLevelController(logColorizer);

    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(timeController, logController);
}

// this method is called when your extension is deactivated
export function deactivate() {
    // Nothing to do here
}
