'use strict';
import * as moment from 'moment';
import { TimeWithMicroseconds } from './TimeWithMicroseconds';
import { ParsedTimestamp } from './TimestampParser';

export class TimePeriod {
    startTime: TimeWithMicroseconds;
    endTime: TimeWithMicroseconds;
    duration: moment.Duration;

    // The microsecond part of the duration
    durationPartMicroseconds: number;

    constructor(
        startTimeMatch: ParsedTimestamp,
        endTimeMatch: ParsedTimestamp) {

        this.processStartAndEndTimes(startTimeMatch, endTimeMatch);
        this.adjustDurationWithMicroseconds();
    }

    private processStartAndEndTimes(
        startTimeMatch: ParsedTimestamp,
        endTimeMatch: ParsedTimestamp) {

        // Full dates contain a year part, i.e. 4 digits in a row
        var startIsFullDate = !!startTimeMatch.moment;
        var endIsFullDate = !!endTimeMatch.moment;
        
        // If not valid date times, clear startTime and endTime, in order to avoid strange bugs
        if (startIsFullDate) {
            this.startTime = new TimeWithMicroseconds(startTimeMatch.moment, startTimeMatch.microseconds);
        } else {
            this.startTime = new TimeWithMicroseconds(undefined, startTimeMatch.microseconds);
        }

        if (endIsFullDate) {
            this.endTime = new TimeWithMicroseconds(endTimeMatch.moment, endTimeMatch.microseconds);
        } else {
            this.endTime = new TimeWithMicroseconds(undefined, endTimeMatch.microseconds);
        }

        // Calculate the duration
        if (startIsFullDate && endIsFullDate) {
            // used for ISO Dates like '2018-09-29' and '2018-09-29 13:12:11.001'
            this.duration = moment.duration(endTimeMatch.moment.diff(startTimeMatch.moment));
        } else {
            // Handle the case where only times are present (no dates) by treating them as durations
            if (moment.isDuration(startTimeMatch.duration) && moment.isDuration(endTimeMatch.duration)) {
                // Used for non ISO dates like '13:12:11.001'
                this.duration = moment.duration(endTimeMatch.duration.asMilliseconds() - startTimeMatch.duration.asMilliseconds());
            }
        }
    }

    private adjustDurationWithMicroseconds() {
        if (this.endTime.microseconds >= this.startTime.microseconds) {
            this.durationPartMicroseconds = this.endTime.microseconds - this.startTime.microseconds;
        }
        else {
            this.duration = this.duration.subtract(1, 'milliseconds');
            this.durationPartMicroseconds = 1000 + this.endTime.microseconds - this.startTime.microseconds;
        }
    }

    public getDurationAsMicroseconds(): number {
        return this.duration.asMilliseconds() * 1000 + this.durationPartMicroseconds;
    }
}
