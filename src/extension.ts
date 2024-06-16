'use strict';

import * as vscode from 'vscode';
import CustomPatternController = require('./CustomPatternController');
import CustomPatternDecorator = require('./CustomPatternDecorator');
import TimePeriodCalculator = require('./TimePeriodCalculator');
import TimePeriodController = require('./TimePeriodController');
import GreenUnderline =  require('./ProgressIndicator');
import { SelectionHelper } from './SelectionHelper';

// this method is called when the extension is activated
export function activate(context: vscode.ExtensionContext) {

    // create a new time calculator and controller
    const selectionHelper = new SelectionHelper();
    const timeCalculator = new TimePeriodCalculator();
    const timeController = new TimePeriodController(timeCalculator, selectionHelper);

    // create log level colorizer and -controller
    const customPatternDecorator = new CustomPatternDecorator();
    const customPatternController = new CustomPatternController(customPatternDecorator);

    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(timeController, customPatternController);

    const greenUnderline = new GreenUnderline(timeCalculator, selectionHelper);
    vscode.window.onDidChangeTextEditorSelection(event => {
        // Current line
        // if (event.textEditor === vscode.window.activeTextEditor) {
        //     greenUnderline.underlineLine(event.textEditor, event.selections[0].active.line);
        // }

        // All selected lines
        if (event.textEditor === vscode.window.activeTextEditor) {
            for (const selection of event.selections) {
                greenUnderline.underlineLine(event.textEditor, selection.start.line, selection.end.line);
            }
        }
    });

    
}

// this method is called when your extension is deactivated
export function deactivate() {
    // Nothing to do here
}
