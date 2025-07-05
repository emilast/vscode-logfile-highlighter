'use strict';

import { RegExpParts } from "./RegExpParts";
import { TimestampFormatParser, TimestampMatch } from "./TimestampParser";

/**
 * Example: 02/28/2020 13:54
 */
export class USDateTimeFormatParser implements TimestampFormatParser {
    private pattern = new RegExp(`(\\d{2})/(\\d{2})/(\\d{4})(${RegExpParts.DateTimeSeparator}(${RegExpParts.Time}))`);

    parse(text: string): TimestampMatch | null {
        const match = this.pattern.exec(text);
        if (match) {
            const normalized = `${match[3]}-${match[1]}-${match[2]} ${match[6] || ''}`.replace(',', '.').trim();
            return {
                match: match,
                normalizedTimestamp: normalized,
                containsDate: true
            } as TimestampMatch;
        }
        return null;
    }
}
