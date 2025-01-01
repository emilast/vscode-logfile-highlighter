'use strict';
import { RegExpParts } from "./RegExpParts";
import { TimestampFormatParser, TimestampMatch } from "./TimestampParser";

export class IsoSlimDateTimeFormatParser implements TimestampFormatParser {
        
    private pattern = new RegExp(`(\\d{4}-\\d{2}-\\d{2})${RegExpParts.DateTimeSeparator}(${RegExpParts.TimeSlim})${RegExpParts.Microseconds}${RegExpParts.TimeZoneSlim}`);

    parse(text: string): TimestampMatch | null {
        const match = this.pattern.exec(text);
        if (match) {
            const timezone = `${match[9] || ''}${match[10] ? match[10] + ':' + match[11] : ''}`;
            const normalized = `${match[1]} ${match[4]}:${match[5]}:${match[6] || '00'}${timezone}`.replace(',', '.').trim();
            return {
                match: match,
                normalizedTimestamp: normalized,
                containsDate: true
            } as TimestampMatch;
        }
        return null;
    }
}
