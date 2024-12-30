'use strict';
import { TimestampFormatParser, TimestampMatch } from "./TimestampParser";

/**
 * Example: 02/28/2020
 */
export class USDateFormatParser implements TimestampFormatParser {
    private pattern = new RegExp('(\\d{2})/(\\d{2})/(\\d{4})(?:T|\\b)');

    parse(text: string): TimestampMatch | null {
        const match = this.pattern.exec(text);
        if (match) {
            const normalized = `${match[3]}-${match[1]}-${match[2]}`;
            return {
                match: match,
                normalizedTimestamp: normalized,
                containsDate: true
            } as TimestampMatch;
        }
        return null;
    }
}
