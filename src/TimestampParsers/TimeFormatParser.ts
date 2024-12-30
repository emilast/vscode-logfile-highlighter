'use strict';
import { TimestampFormatParser, TimestampMatch } from "./TimestampParser";

export class TimeFormatParser implements TimestampFormatParser {
    private pattern = new RegExp('\\d{2}:\\d{2}(?::\\d{2}(?:[.,]\\d{3}(?<microseconds>\\d{3})?)?)?(?:Z| ?[+-]\\d{2}:\\d{2})?\\b');

    parse(text: string): TimestampMatch | null {
        const match = this.pattern.exec(text);
        if (match) {
            return {
                match: match,
                normalizedTimestamp: match[0].replace(',', '.'),
                containsDate: false
            } as TimestampMatch;
        }
        return null;
    }
}
