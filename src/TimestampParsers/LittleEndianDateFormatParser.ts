'use strict';
import { TimestampFormatParser, TimestampMatch } from "./TimestampParser";

/**
 * Example: 28-01-2020
 */
export class LittleEndianDateFormatParser implements TimestampFormatParser {
    private pattern = new RegExp('(\\d{2})-(\\d{2})-(\\d{4})\\b');

    parse(text: string): TimestampMatch | null {
        const match = this.pattern.exec(text);
        if (match) {
            const normalized = `${match[3]}-${match[2]}-${match[1]}`;
            return {
                match: match,
                normalizedTimestamp: normalized,
                containsDate: true
            } as TimestampMatch;
        }
        return null;
    }
}
