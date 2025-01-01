'use strict';
import { RegExpParts } from "./RegExpParts";
import { TimestampFormatParser, TimestampMatch } from "./TimestampParser";

export class DanishDateTimeFormatParser implements TimestampFormatParser {
    private pattern = new RegExp(`(\\d{2})\\.(\\d{2})\\.(\\d{4})${RegExpParts.DateTimeSeparator}(${RegExpParts.Time})${RegExpParts.Microseconds}${RegExpParts.TimeZone}`);

    parse(text: string): TimestampMatch | null {
        const match = this.pattern.exec(text);
        if (match) {
            const normalized = `${match[3]}-${match[2]}-${match[1]} ${match[5] || ''}`.trim();
            return {
                match: match,
                normalizedTimestamp: normalized,
                containsDate: true
            } as TimestampMatch;
        }
        return null;
    }
}
