'use strict';

import * as vscode from 'vscode';
import CustomPatternDecorator = require('./CustomPatternDecorator');
import CustomPatternController = require('./CustomPatternController');
import TimePeriodCalculator = require('./TimePeriodCalculator');
import TimePeriodController = require('./TimePeriodController');

// this method is called when the extension is activated
export function activate(context: vscode.ExtensionContext) {

    // create a new time calculator and controller
    const timeCalculator = new TimePeriodCalculator();
    const timeController = new TimePeriodController(timeCalculator);

    // create log level colorizer and -controller
    const customPatternDecorator = new CustomPatternDecorator();
    const customPatternController = new CustomPatternController(customPatternDecorator);

    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(timeController, customPatternController);
}

// this method is called when your extension is deactivated
export function deactivate() {
    // Nothing to do here
}
