'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

class TimePeriodCalculator {

    private _statusBarItem: vscode.StatusBarItem;

    public updateTimePeriod() {

        // Create as needed
        if (!this._statusBarItem) {
            this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }

        // Get the current text editor
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }

        let doc = editor.document;

        // Only update status if an log file
        if (doc.languageId === "log") {
            let timePeriod = this._getTimePeriod(doc.getText(editor.selection));

            if (timePeriod.getMilliseconds() !== 0) {
                let text = timePeriod.getMilliseconds() + 'ms';

                if (timePeriod.getSeconds() !== 0) {
                    text = timePeriod.getSeconds() + 's, ' + text;

                    if (timePeriod.getMinutes() !== 0) {
                        text = timePeriod.getMinutes() + 'min, ' + text;

                        if (timePeriod.getHours() !== 0) {
                            text = timePeriod.getHours() + 'h, ' + text;
                        }
                    }
                }

                text = 'Selected: ' + text;

                // Update the status bar
                this._statusBarItem.text = text;
                this._statusBarItem.show();
            } else {
                this._statusBarItem.hide();
            }
            
        } else {
            this._statusBarItem.hide();
        }
    }

    public _getTimePeriod(data: string): Date {

        let selContent = data;

        // Clock times with optional timezone ("09:13:16", "09:13:16.323", "09:13:16+01:00")
        let clocksPattern = '\\d{2}:\\d{2}(?::\\d{2}(?:[.,]\\d{3,})?)?(?:Z| ?[+-]\\d{2}:\\d{2})?\\b';
        
        // ISO dates ("2016-08-23")
        let isoDatePattern = '\\b\\d{4}-\\d{2}-\\d{2}(?:T|\\b)';

        // Culture specific dates ("23/08/2016", "23.08.2016")
        let cultureDatesPattern = '\\b\\d{2}[^\\w\\s]\\d{2}[^\\w\\s]\\d{4}\\b';

        let pattern = '((?:' + isoDatePattern + '|' + cultureDatesPattern + '){1}(?:' + clocksPattern + '){1})';

        let timeRegEx = new RegExp(pattern, 'g');
        
        let matches:string[] = [];
        let match;
        
        while (match = timeRegEx.exec(selContent)) {
            matches.push(match[0]);
        }

        let timePeriod;
        if (matches != null && matches.length >= 2) {
            let firstDate = new Date(matches[0])
            let secondDate = new Date(matches[matches.length-1]);

            timePeriod = new Date(secondDate.valueOf() - firstDate.valueOf());
        } else {
            timePeriod = new Date(0);
        }
        
        return timePeriod;
    }

    dispose() {
        this._statusBarItem.dispose();
    }
}

export = TimePeriodCalculator;