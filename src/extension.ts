'use strict';

import * as vscode from 'vscode';
import { CustomPatternController } from './CustomPatternController';
import { CustomPatternDecorator } from './CustomPatternDecorator';
import { ProgressIndicator } from './ProgressIndicator';
import { ProgressIndicatorController } from './ProgressIndicatorController';
import { SelectionHelper } from './SelectionHelper';
import { TimePeriodCalculator } from './TimePeriodCalculator';
import { TimePeriodController } from './TimePeriodController';
import { TailController } from './TailController';
import { TimestampParser } from './TimestampParsers/TimestampParser';

// this method is called when the extension is activated
export function activate(context: vscode.ExtensionContext) {

    const selectionHelper = new SelectionHelper();

    var timestampParser = new TimestampParser()

    // create a new time calculator and controller
    const timeCalculator = new TimePeriodCalculator(timestampParser);
    const timeController = new TimePeriodController(timeCalculator, selectionHelper);

    // create log level colorizer and -controller
    const customPatternDecorator = new CustomPatternDecorator();
    const customPatternController = new CustomPatternController(customPatternDecorator);

    // create progress indicator and -controller
    const progressIndicator = new ProgressIndicator(timeCalculator, selectionHelper, timestampParser);
    const progressIndicatorController = new ProgressIndicatorController(progressIndicator);

    // tail log files
    const tailController = new TailController();

    // register commands
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'logFileHighlighter.removeProgressIndicatorDecorations', () => {
                // Remove decorations
                progressIndicatorController.removeDecorations();
            }));

    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(timeController, customPatternController, progressIndicatorController, tailController);
}

// this method is called when your extension is deactivated
export function deactivate() {
    // Nothing to do here
}
