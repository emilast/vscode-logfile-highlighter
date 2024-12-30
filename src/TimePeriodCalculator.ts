'use strict';

import { TimePeriod } from './TimePeriod';
import { TimestampParser } from './TimestampParsers/TimestampParser';

export class TimePeriodCalculator {
    private _timestampParser: TimestampParser;
    constructor(timestampParser: TimestampParser) {
        this._timestampParser = timestampParser;
    }

    // Converts a given moment.Duration to a string that can be displayed.
    public convertToDisplayString(selectedDuration: TimePeriod): string {
        let text = '';

        if (selectedDuration.duration.asDays() >= 1) {
            text += Math.floor(selectedDuration.duration.asDays()) + 'd';
        }
        if (text !== '') {
            text += ', ' + selectedDuration.duration.hours() + 'h';
        } else if (selectedDuration.duration.hours() !== 0) {
            text += selectedDuration.duration.hours() + 'h';
        }
        if (text !== '') {
            text += ', ' + selectedDuration.duration.minutes() + 'min';
        } else if (selectedDuration.duration.minutes() !== 0) {
            text += selectedDuration.duration.minutes() + 'min';
        }
        if (text !== '') {
            text += ', ' + selectedDuration.duration.seconds() + 's';
        } else if (selectedDuration.duration.seconds() !== 0) {
            text += selectedDuration.duration.seconds() + 's';
        }
        if (text !== '') {
            text += ', ' + selectedDuration.duration.milliseconds() + 'ms';
        } else if (selectedDuration.duration.milliseconds() !== 0) {
            text += selectedDuration.duration.milliseconds() + 'ms';
        }
        if (text !== '') {
            // In most cases the microseconds are 0, so we don't need to display them
            if (selectedDuration.durationPartMicroseconds !== 0) {
                text += ', ' + selectedDuration.durationPartMicroseconds + 'μs';
            }
        } else {
            text += selectedDuration.durationPartMicroseconds + 'μs';
        }
        text = 'Selected: ' + text;

        return text;
    }

    public getTimePeriod(firstLine: string, lastLine: string): TimePeriod {
        let firstLineMatch = this._timestampParser.getTimestampFromText(firstLine);
        let lastLineMatch = this._timestampParser.getTimestampFromText(lastLine);

        if (firstLineMatch && lastLineMatch) {
            return new TimePeriod(firstLineMatch, lastLineMatch);
        }

        return undefined;
    }

}
