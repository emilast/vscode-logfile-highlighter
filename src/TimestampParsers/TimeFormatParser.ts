'use strict';
import { RegExpParts } from "./RegExpParts";
import { TimestampFormatParser, TimestampMatch } from "./TimestampParser";

export class TimeFormatParser implements TimestampFormatParser {
    private pattern = new RegExp(`\\b(${RegExpParts.Time})\\b`);

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
