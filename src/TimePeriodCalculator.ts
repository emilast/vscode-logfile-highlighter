'use strict';

import * as moment from 'moment';
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

            if (timePeriod !== undefined) {

                // Update the status bar
                this._statusBarItem.text = this._buildStatusBarText(timePeriod);
                this._statusBarItem.show();

            } else {
                this._statusBarItem.hide();
            }

        } else {
            this._statusBarItem.hide();
        }
    }

    public dispose() {
        this._statusBarItem.dispose();
    }

    private _buildStatusBarText(selectedDuration: moment.Duration): string {
        let text = '';

        if (selectedDuration.asDays() >= 1) {
            text += Math.floor(selectedDuration.asDays()) + 'd';
        }
        if (text !== '') {
            text += ', ' + selectedDuration.hours() + 'h';
        } else if (selectedDuration.hours() !== 0) {
            text += selectedDuration.hours() + 'h';
        }
        if (text !== '') {
            text += ', ' + selectedDuration.minutes() + 'min';
        } else if (selectedDuration.minutes() !== 0) {
            text += selectedDuration.minutes() + 'min';
        }
        if (text !== '') {
            text += ', ' + selectedDuration.seconds() + 's';
        } else if (selectedDuration.seconds() !== 0) {
            text += selectedDuration.seconds() + 's';
        }
        if (text !== '') {
            text += ', ' + selectedDuration.milliseconds() + 'ms';
        } else {
            text += selectedDuration.milliseconds() + 'ms';
        }

        text = 'Selected: ' + text;

        return text;
    }

    private _getTimePeriod(data: string): moment.Duration {

        const selContent = data;

        // Clock times with optional timezone ("09:13:16", "09:13:16.323", "09:13:16+01:00")
        const clocksPattern = '\\d{2}:\\d{2}(?::\\d{2}(?:[.,]\\d{3,})?)?(?:Z| ?[+-]\\d{2}:\\d{2})?\\b';

        // ISO dates ("2016-08-23")
        const isoDatePattern = '\\b\\d{4}-\\d{2}-\\d{2}(?:T|\\b)';

        // Culture specific dates ("23/08/2016", "23.08.2016")
        const cultureDatesPattern = '\\b\\d{2}[^\\w\\s]\\d{2}[^\\w\\s]\\d{4}\\b';

        const pattern = '((?:' + isoDatePattern + '|' + cultureDatesPattern + '){1} ?(?:' + clocksPattern + '){1})';

        const timeRegEx = new RegExp(pattern, 'g');

        const matches: string[] = [];
        let match = timeRegEx.exec(selContent);

        while (match) {
            matches.push(this._convertToIso(match[0]));
            match = timeRegEx.exec(selContent);
        }

        let timePeriod: moment.Duration;
        if (matches.length >= 2) {
            const firstDate = new Date(matches[0]);
            const lastDate = new Date(matches[matches.length - 1]);

            timePeriod = moment.duration(lastDate.valueOf() - firstDate.valueOf());
        } else {
            timePeriod = undefined;
        }

        return timePeriod;
    }

    // Converts a given date string to an iso string.
    private _convertToIso(dateString: string): string {

        // 01.29.2018 or 01/29/2018 => 2018-01-29
        let result = dateString.replace(
            /\b((?:0[1-9])|(?:1[0-2]))[\./-]((?:0[1-9])|(?:[1-2][0-9])|(?:3[0-1]))[\./-](\d{4})/g,
            '$3-$1-$2');

        // 29.01.2018 or 29/01/2018 => 2018-01-29
        result = dateString.replace(
            /\b((?:0[1-9])|(?:[1-2][0-9])|(?:3[0-1]))[\./-]((?:0[1-9])|(?:1[0-2]))[\./-](\d{4})/g,
            '$3-$2-$1');

        // 09:29:02,258 => 09:29:02.258
        result = result.replace(',', '.');

        return result;
    }
}

export = TimePeriodCalculator;
