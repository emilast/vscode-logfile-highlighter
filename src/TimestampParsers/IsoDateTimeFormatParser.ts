'use strict';
import { RegExpParts } from "./RegExpParts";
import { TimestampFormatParser, TimestampMatch } from "./TimestampParser";

export class IsoDateTimeFormatParser implements TimestampFormatParser {
        
    private pattern = new RegExp(`\\d{4}-\\d{2}-\\d{2}${RegExpParts.DateTimeSeparator}(${RegExpParts.Time})${RegExpParts.Microseconds}${RegExpParts.TimeZone}`);

    parse(text: string): TimestampMatch | null {
        const match = this.pattern.exec(text);
        if (match) {
            return {
                match: match,
                normalizedTimestamp: match[0],
                containsDate: true
            } as TimestampMatch;
        }
        return null;
    }
}
