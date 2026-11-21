'use strict';

import * as vscode from 'vscode';
import { AnsiController } from './AnsiController';
import { AnsiDecorator } from './AnsiDecorator';
import { CustomPatternController } from './CustomPatternController';
import { CustomPatternDecorator } from './CustomPatternDecorator';
import { FilePathLinkProvider } from './FilePathLinkProvider';
import { LogOverview } from './LogOverview';
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

    // create ANSI color code colorizer and -controller. Created after the custom patterns so that
    // its decorations take precedence when both apply to the same text.
    const ansiDecorator = new AnsiDecorator();
    const ansiController = new AnsiController(ansiDecorator);

    // create progress indicator and -controller
    const progressIndicator = new ProgressIndicator(timeCalculator, selectionHelper, timestampParser);
    const progressIndicatorController = new ProgressIndicatorController(progressIndicator);

    // tail log files
    const tailController = new TailController();

    // make file paths clickable
    const filePathLinkProvider = new FilePathLinkProvider();

    // hide lines by level or text, and fold by entry or time
    const logOverview = new LogOverview();

    // register commands
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'logFileHighlighter.removeProgressIndicatorDecorations', () => {
                // Remove decorations
                progressIndicatorController.removeDecorations();
            }));

    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(timeController, customPatternController, ansiController, progressIndicatorController, tailController, filePathLinkProvider, logOverview);
}

// this method is called when your extension is deactivated
export function deactivate() {
    // Nothing to do here
}
