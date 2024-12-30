'use strict';

import moment = require("moment");
import { TimeFormatParser } from "./TimeFormatParser";
import { DanishDateFormatParser } from "./DanishDateFormatParser";
import { IsoDateFormatParser } from "./IsoDateFormatParser";
import { USDateFormatParser } from "./USDateFormatParser";
import { DanishDateTimeFormatParser } from "./DanishDateTimeFormatParser";
import { IsoDateTimeFormatParser } from "./IsoDateTimeFormatParser";
import { USDateTimeFormatParser } from "./USDateTimeFormatParser";

export class TimestampParser {
    private parsers: TimestampFormatParser[];

    constructor() {
        this.parsers = [
            new IsoDateTimeFormatParser(),
            new USDateTimeFormatParser(),
            new DanishDateTimeFormatParser(),
            new IsoDateFormatParser(),
            new USDateFormatParser(),
            new DanishDateFormatParser(),
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
        const microsecondsMatch = match.match.groups?.microseconds;
        let microseconds = 0;

        if (microsecondsMatch) {
            microseconds = parseInt(microsecondsMatch);
        }
        const matchedString = match.match[0];
        const normalizedTimestamp = match.normalizedTimestamp;

        return {
            original: matchedString,
            matchIndex: match.match.index,
            moment: match.containsDate ? moment(normalizedTimestamp) : undefined,
            duration: !match.containsDate ? moment.duration(normalizedTimestamp) : undefined,
            microseconds: microseconds
        } as ParsedTimestamp;
    }
}

export interface TimestampFormatParser {
    parse(text: string): TimestampMatch | null;
}

/**
 * Represents a match of a timestamp within a log file.
 */
export class TimestampMatch {
    /**
     * The regular expression match result.
     */
    public match: RegExpExecArray;

    /**
     * The timestamp representation that can be parsed by moment.js.
     */
    public normalizedTimestamp: string;

    /**
     * Indicates whether the timestamp contains a date.
     */
    public containsDate: boolean;
}

export class ParsedTimestamp {
    original: string;
    matchIndex: number;
    moment?: moment.Moment;
    duration?: moment.Duration;
    microseconds: number;
}