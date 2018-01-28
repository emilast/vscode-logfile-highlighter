'use strict';

import * as vscode from 'vscode';

class TimePeriodCalculator {

    private _statusBarItem: vscode.StatusBarItem;

    public updateTimePeriod() {

        // Create as needed
        if (!this._statusBarItem) {
            this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }

        // Get the current text editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }

        const doc = editor.document;

        // Only update status if an log file
        if (doc.languageId === 'log') {
            const timePeriod = this._getTimePeriod(doc.getText(editor.selection));

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

        const selContent = data;

        // Clock times with optional timezone ("09:13:16", "09:13:16.323", "09:13:16+01:00")
        const clocksPattern = '\\d{2}:\\d{2}(?::\\d{2}(?:[.,]\\d{3,})?)?(?:Z| ?[+-]\\d{2}:\\d{2})?\\b';

        // ISO dates ("2016-08-23")
        const isoDatePattern = '\\b\\d{4}-\\d{2}-\\d{2}(?:T|\\b)';

        // Culture specific dates ("23/08/2016", "23.08.2016")
        const cultureDatesPattern = '\\b\\d{2}[^\\w\\s]\\d{2}[^\\w\\s]\\d{4}\\b';

        const pattern = '((?:' + isoDatePattern + '|' + cultureDatesPattern + '){1}(?:' + clocksPattern + '){1})';

        const timeRegEx = new RegExp(pattern, 'g');

        const matches: string[] = [];
        let match = timeRegEx.exec(selContent);

        while (match) {
            matches.push(match[0]);
            match = timeRegEx.exec(selContent);
        }

        let timePeriod;
        if (matches != null && matches.length >= 2) {
            const firstDate = new Date(matches[0]);
            const secondDate = new Date(matches[matches.length - 1]);

            timePeriod = new Date(secondDate.valueOf() - firstDate.valueOf());
        } else {
            timePeriod = new Date(0);
        }

        return timePeriod;
    }

    public dispose() {
        this._statusBarItem.dispose();
    }
}

export = TimePeriodCalculator;
