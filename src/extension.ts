import * as vscode from 'vscode';
import { AnsiController } from './AnsiController';
import { AnsiDecorator } from './AnsiDecorator';
import { CustomPatternController } from './CustomPatternController';
import { CustomPatternDecorator } from './CustomPatternDecorator';
import { ProgressIndicator } from './ProgressIndicator';
import { ProgressIndicatorController } from './ProgressIndicatorController';
import { SelectionHelper } from './SelectionHelper';
import { TailController } from './TailController';
import { TimePeriodCalculator } from './TimePeriodCalculator';
import { TimePeriodController } from './TimePeriodController';
import { TimestampParser } from './TimestampParsers/TimestampParser';

// this method is called when the extension is activated
export function activate(context: vscode.ExtensionContext) {

    const selectionHelper = new SelectionHelper();

    const timestampParser = new TimestampParser();

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

    // register commands
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'logFileHighlighter.removeProgressIndicatorDecorations', () => {
                // Remove decorations
                progressIndicatorController.removeDecorations();
            }));

    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(timeController, customPatternController, ansiController, progressIndicatorController, tailController);
}

// this method is called when your extension is deactivated
export function deactivate() {
    // Nothing to do here
}
