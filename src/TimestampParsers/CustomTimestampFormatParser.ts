'use strict';
import * as moment from 'moment';
import { TimestampFormatParser, TimestampMatch } from './TimestampParser';

export interface CustomTimestampFormat {
    pattern: string;
    format: string;
}

export interface ValidatedFormat {
    format: CustomTimestampFormat;
    regex: RegExp;
}

export class CustomTimestampFormatParser implements TimestampFormatParser {
    private validatedFormats: ValidatedFormat[] = [];

    setFormats(formats: ValidatedFormat[]): void {
        this.validatedFormats = formats;
    }

    public parse(text: string): TimestampMatch | null {
        for (const { format, regex } of this.validatedFormats) {
            const match = regex.exec(text);
            if (!match) {
                continue;
            }   

            const timestamp = moment(match[0], format.format);
            if (!timestamp.isValid()) {
                continue;
            }
            
            const normalized = timestamp.toISOString();
            return {
                match: match,
                normalizedTimestamp: normalized,
                containsDate: true
            } as TimestampMatch;
        }

        return null;
    }
}
