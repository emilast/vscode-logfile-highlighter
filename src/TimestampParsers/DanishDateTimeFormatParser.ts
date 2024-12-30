'use strict';
import { TimestampFormatParser, TimestampMatch } from "./TimestampParser";

export class DanishDateTimeFormatParser implements TimestampFormatParser {
    private pattern = new RegExp('(\\d{2})\\.(\\d{2})\\.(\\d{4})(?:T|\\b) ?(\\d{2}:\\d{2}(?::\\d{2}(?:[.,]\\d{3}(?<microseconds>\\d{3}))?)?)(?:Z| ?[+-]\\d{2}:\\d{2})?\\b');

    parse(text: string): TimestampMatch | null {
        const match = this.pattern.exec(text);
        if (match) {
            const normalized = `${match[3]}-${match[2]}-${match[1]} ${match[4] || ''}`.trim();
            return {
                match: match,
                normalizedTimestamp: normalized,
                containsDate: true
            } as TimestampMatch;
        }
        return null;
    }
}
