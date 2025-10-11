'use strict';
import { RegExpParts } from "./RegExpParts";
import { TimestampFormatParser, TimestampMatch } from "./TimestampParser";

/** Examples:
 *  2020-01-28 14:45
 *  2020-01-28T14:45:30.123Z
 *  2020-01-28 14:45:30.123+02:00
 *  2020-01-28T14:45:30+02:00
 */
export class IsoDateTimeFormatParser implements TimestampFormatParser {
        
    private pattern = new RegExp(`(\\d{4}-\\d{2}-\\d{2}${RegExpParts.DateTimeSeparator})${RegExpParts.Time}`);

    parse(text: string): TimestampMatch | null {
        const match = this.pattern.exec(text);

        if (match) {
            // Construct the normalized timestamp in a consistent format from
            // match[1] which is the date part (YYYY-MM-DD and the separator)
            // match[3] which is the time part (HH:MM[:SS[.mmm]])
            // match[8] which is the timezone part (Z or ±HH:MM)
            // The goal is to create a timestamp string that can be parsed by momentjs, so
            // any whitespace between the time and timezone must be removed.
            var normalizedTimestamp = match[1] + match[3] + (match[8] ? match[8] : '');
            return {
                match: match,
                normalizedTimestamp: normalizedTimestamp,
                containsDate: true
            } as TimestampMatch;
        }
        return null;
    }
}
