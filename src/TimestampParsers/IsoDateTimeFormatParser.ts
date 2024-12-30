'use strict';
import { TimestampFormatParser, TimestampMatch } from "./TimestampParser";

export class IsoDateTimeFormatParser implements TimestampFormatParser {
    // TODO remove optional time part
    private pattern = new RegExp('\\d{4}-\\d{2}-\\d{2}(?:T|\\b) ?\\d{2}:\\d{2}(?::\\d{2}(?:[.,]\\d{3}(?<microseconds>\\d{3})?)?)?(?:Z| ?[+-]\\d{2}:\\d{2})?\\b');

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
