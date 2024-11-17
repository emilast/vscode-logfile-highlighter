'use strict';

export class TimestampParser {
    // Extracts a timestamp from the given text.
    // This method uses multiple regular expressions to identify and extract date and time patterns from the input text.
    // It supports various formats including ISO dates, culture-specific dates, and times with optional milliseconds and timezones.
    // The returned string is a parsable ISO date string.
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

        // Try to match the most specific pattern first (dateTimePattern), then clockPattern, and finally datesPattern)
        // E.g.: The dateTimePattern ('2016-08-23 09:13:16.323') is preferred over the datesPattern ('2017-09-29 and 29/01/2019')
        // TODO: How to avoid the clockPattern to match a date if the colon is optional?
        // Rewrite this function to use full regexes instead of parts?
        const rankedPattern = [dateTimePattern, clockPattern, datesPattern];

        for (const item of rankedPattern) {
            // Get the first match for both lines
            const timeRegEx = new RegExp(item);
            const match = timeRegEx.exec(text);

            if (match) {
                const microsecondsMatch = match.groups?.microseconds;
                let microseconds = 0;

                if (microsecondsMatch) {
                    microseconds = parseInt(microsecondsMatch);
                }
                return {
                    original: match[0],
                    matchIndex: match.index,
                    iso: this._convertToIso(match[0]),
                    microseconds: microseconds
                } as ParsedTimestamp;
            }
        }

        return undefined;
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
     * The matched string converted to an ISO date string, interpretable by momentjs.
     */
    iso: string;

    /**
     * The microseconds part of the timestamp.
     * @remarks
     * It's separated from the rest of the timestamp since it cannot be natively handled by Javascript
     */
    microseconds: number;
}