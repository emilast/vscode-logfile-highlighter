'use strict';

import * as moment from 'moment';

class TimePeriodCalculator {

    // Converts a given moment.Duration to a string that can be displayed.
    public convertToDisplayString(selectedDuration: moment.Duration): string {
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

    public getTimePeriod(data: string): moment.Duration {

        const selContent = data;

        // Clock times with optional timezone ("09:13:16", "09:13:16.323", "09:13:16+01:00")
        const clockPattern = '\\d{2}:\\d{2}(?::\\d{2}(?:[.,]\\d{3,})?)?(?:Z| ?[+-]\\d{2}:\\d{2})?\\b';

        // ISO dates ("2016-08-23")
        const isoDatePattern = '\\b\\d{4}-\\d{2}-\\d{2}(?:T|\\b)';

        // Culture specific dates ("23/08/2016", "23.08.2016")
        const cultureDatesPattern = '\\b\\d{2}[^\\w\\s]\\d{2}[^\\w\\s]\\d{4}\\b';

        // Match '2016-08-23 09:13:16.323' as well as '29.01.2018 09:13:34,001'
        const dateTimePattern = '((?:' + isoDatePattern + '|' + cultureDatesPattern + '){1} ?' +
            '(?:' + clockPattern + '){1})';

        // Match 2017-09-29 as well as 29/01/2019
        const datesPattern = '(' + isoDatePattern + '|' + cultureDatesPattern + '){1}';

        // E.g.: The dateTimePattern ('2016-08-23 09:13:16.323') is preferred
        // over the datesPattern ('2017-09-29 and 29/01/2019')
        const rankedPattern = [dateTimePattern, clockPattern, datesPattern];
        const matches: string[] = [];

        for (const item of rankedPattern) {
            const timeRegEx = new RegExp(item, 'g');

            let match = timeRegEx.exec(selContent);

            while (match) {
                matches.push(this._convertToIso(match[0]));
                match = timeRegEx.exec(selContent);
            }

            if (matches.length >= 2) {
                break;
            }
        }

        let timePeriod: moment.Duration;
        timePeriod = undefined;

        if (matches.length >= 2 && matches[0].length === matches[matches.length - 1].length) {
            const firstMoment = moment(matches[0]);
            const lastMoment = moment(matches[matches.length - 1]);

            if (firstMoment.isValid() && lastMoment.isValid()) {

                // used for ISO Dates like '2018-09-29' and '2018-09-29 13:12:11.001'
                timePeriod = moment.duration(lastMoment.diff(firstMoment));
            } else {

                const firstDuration = moment.duration(matches[0]);
                const lastDuration = moment.duration(matches[matches.length - 1]);

                if (moment.isDuration(firstDuration) && moment.isDuration(lastDuration)) {

                    // Used for non ISO dates like '13:12:11.001'
                    timePeriod = moment.duration(lastDuration.asMilliseconds() - firstDuration.asMilliseconds());
                }
            }
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
