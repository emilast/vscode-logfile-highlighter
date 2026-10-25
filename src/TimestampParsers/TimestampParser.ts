import moment = require('moment');
import { DanishDateFormatParser } from './DanishDateFormatParser';
import { DanishDateTimeFormatParser } from './DanishDateTimeFormatParser';
import { IsoDateFormatParser } from './IsoDateFormatParser';
import { IsoDateTimeFormatParser } from './IsoDateTimeFormatParser';
import { IsoSlimDateTimeFormatParser } from './IsoSlimDateTimeFormatParser';
import { LittleEndianDateFormatParser } from './LittleEndianDateFormatParser';
import { LittleEndianDateTimeFormatParser } from './LittleEndianDateTimeFormatParser';
import { TimeFormatParser } from './TimeFormatParser';
import { USDateFormatParser } from './USDateFormatParser';
import { USDateTimeFormatParser } from './USDateTimeFormatParser';

export class TimestampParser {
    private parsers: TimestampFormatParser[];

    constructor() {
        this.parsers = [
            new IsoDateTimeFormatParser(),
            new IsoSlimDateTimeFormatParser(),
            new USDateTimeFormatParser(),
            new DanishDateTimeFormatParser(),
            new LittleEndianDateTimeFormatParser(),
            new IsoDateFormatParser(),
            new USDateFormatParser(),
            new DanishDateFormatParser(),
            new LittleEndianDateFormatParser(),
            new TimeFormatParser()
        ];
    }

    public getTimestampFromText(text: string): ParsedTimestamp | undefined {
        for (const parser of this.parsers) {
            const match = parser.parse(text);
            if (match) {
                return this._createTimestampFromMatch(match);
            }
        }
        return undefined;
    }

    private _createTimestampFromMatch(match: TimestampMatch): ParsedTimestamp {
        // console.log('TimestampParser', match);
        const microsecondsMatch = match.match.groups?.microseconds;
        let microseconds = 0;

        if (microsecondsMatch) {
            microseconds = parseInt(microsecondsMatch, 10);
        }
        const matchedString = match.match[0];
        const normalizedTimestamp = match.normalizedTimestamp;

        return {
            original: matchedString,
            matchIndex: match.match.index,
            moment: match.containsDate ? moment(normalizedTimestamp, moment.ISO_8601) : undefined,
            duration: !match.containsDate ? moment.duration(normalizedTimestamp) : undefined,
            microseconds
        } as ParsedTimestamp;
    }
}

export interface TimestampFormatParser {
    parse(text: string): TimestampMatch | null;
}

/**
 * Represents a match of a timestamp within a log file.
 */
export interface TimestampMatch {
    /**
     * The regular expression match result.
     */
    match: RegExpExecArray;

    /**
     * The timestamp representation that can be parsed by moment.js.
     */
    normalizedTimestamp: string;

    /**
     * Indicates whether the timestamp contains a date.
     */
    containsDate: boolean;
}

export interface ParsedTimestamp {
    original: string;
    matchIndex: number;
    moment?: moment.Moment;
    duration?: moment.Duration;
    microseconds: number;
}
