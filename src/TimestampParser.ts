'use strict';

import moment = require("moment");

export class TimestampParser {
    // Extracts a timestamp from the given text.
    // This method uses multiple regular expressions to identify and extract date and time patterns from the input text.
    // It supports various formats including ISO dates, culture-specific dates, and times with optional milliseconds and timezones.
    public getTimestampFromText(text: string): ParsedTimestamp {
        // Pattern to match time in HH:MM or HHMM format, with optional seconds, milliseconds, and timezone 
        const clockPattern = '\\d{2}:\\d{2}(?::\\d{2}(?:[.,]\\d{3}(?<microseconds>\\d{3})?)?)?(?:Z| ?[+-]\\d{2}:\\d{2})?\\b';

        // ISO dates ("2016-08-23")
        const isoDatePattern = '\\d{4}-\\d{2}-\\d{2}(?:T|\\b)';

        // Culture specific dates ("23/08/2016", "23.08.2016")
        const cultureDatesPattern = '\\d{2}[^\\w\\s]\\d{2}[^\\w\\s]\\d{4}\\b';

        // Match '2016-08-23 09:13:16.323' as well as '29.01.2018 09:13:34,001'
        const dateTimePattern = '((?:' + isoDatePattern + '|' + cultureDatesPattern + '){1} ?' +
            '(?:' + clockPattern + '){1})';

        // Match 2017-09-29 as well as 29/01/2019
        const datesPattern = '(' + isoDatePattern + '|' + cultureDatesPattern + '){1}';


        // Full ISO date and time pattern: '2016-08-23 09:13:16.323' as well as '29.01.2018 09:13:34,001'
        // Get the first match for both lines
        const timeRegEx1 = new RegExp(dateTimePattern);
        const match1 = timeRegEx1.exec(text);
        if (match1) {
            return this._createTimestampFromMatch(match1, true);
        }

        // Full date pattern: '2017-09-29' as well as '29/01/2019'
        const timeRegEx = new RegExp(datesPattern);
        const match = timeRegEx.exec(text);
        if (match) {
            return this._createTimestampFromMatch(match, true);
        }

        // Time pattern: '09:13:16.323' as well as '09:13:34,001'
        const timeRegEx2 = new RegExp(clockPattern);
        const match2 = timeRegEx2.exec(text);
        if (match2) {
            return this._createTimestampFromMatch(match2, false);
        }

        // TODO: Remove "rankedPattern" list and rewrite with well-defined date formats and context-specific handling
        // (e.g. reordering day/month/year) before sending to moment.js to avoid errors like
        // "Deprecation warning: value provided is not in a recognized RFC2822 or ISO format.".
        // This will also make it possible to insert separators if they are missing.

        // Try to match the most specific pattern first (dateTimePattern), then clockPattern, and finally datesPattern)
        // E.g.: The dateTimePattern ('2016-08-23 09:13:16.323') is preferred over the datesPattern ('2017-09-29 and 29/01/2019')
        // TODO: How to avoid the clockPattern to match a date if the colon is optional?
        // Rewrite this function to use full regexes instead of parts?
        // const rankedPattern = [dateTimePattern, clockPattern, datesPattern];

        // for (const item of rankedPattern) {
        //     // Get the first match for both lines
        //     const timeRegEx = new RegExp(item);
        //     const match = timeRegEx.exec(text);

        //     if (match) {
        //         return this._createTimestampFromMatch(match);
        //     }
        // }

        return undefined;
    }

    private _createTimestampFromMatch(match: RegExpExecArray, containsDate: boolean)
    {
        const microsecondsMatch = match.groups?.microseconds;
        let microseconds = 0;

        if (microsecondsMatch) {
            microseconds = parseInt(microsecondsMatch);
        }
        const matchedString = match[0];

        const normalizedTimestamp = this._convertToIso(matchedString);
        // console.log('containsDate', containsDate , matchedString, normalizedTimestamp);

        return {
            original: match[0],
            matchIndex: match.index,
            moment: containsDate ? moment(normalizedTimestamp) : undefined,
            duration: !containsDate ? moment.duration(normalizedTimestamp) : undefined,
            microseconds: microseconds
        } as ParsedTimestamp;
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


export class ParsedTimestamp {
    /**
     * The original string that was matched.
     */
    original: string;
    
    /**
     * The index of the match in the input string.
     */
    matchIndex: number;

    /**
     * The parsed timestamp, if it was a full date. If not, then the 'duration' property is set instead.
     */
    moment?: moment.Moment;

    /**
     * The parsed duration, if the timestamp did not contain a date. If it did, then the 'moment' property is set instead.
     */
    duration?: moment.Duration;

    /**
     * The microseconds part of the timestamp.
     * @remarks
     * It's separated from the rest of the timestamp since it cannot be natively handled by Javascript
     */
    microseconds: number;
}