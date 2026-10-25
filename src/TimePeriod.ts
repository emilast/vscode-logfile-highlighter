import * as moment from 'moment';
import { ParsedTimestamp } from './TimestampParsers/TimestampParser';
import { TimeWithMicroseconds } from './TimeWithMicroseconds';

export class TimePeriod {
    public startTime!: TimeWithMicroseconds;
    public endTime!: TimeWithMicroseconds;

    // Undefined when the start and end timestamps are of different kinds (one with a date, one without)
    public duration: moment.Duration | undefined;

    // The microsecond part of the duration
    public durationPartMicroseconds = 0;

    constructor(
        startTimeMatch: ParsedTimestamp,
        endTimeMatch: ParsedTimestamp) {

        this.processStartAndEndTimes(startTimeMatch, endTimeMatch);
        this.adjustDurationWithMicroseconds();
    }

    private processStartAndEndTimes(
        startTimeMatch: ParsedTimestamp,
        endTimeMatch: ParsedTimestamp) {

        // If not valid date times, clear startTime and endTime, in order to avoid strange bugs
        if (startTimeMatch.moment) {
            this.startTime = new TimeWithMicroseconds(startTimeMatch.moment, startTimeMatch.microseconds);
        } else {
            this.startTime = new TimeWithMicroseconds(undefined, startTimeMatch.microseconds, startTimeMatch.duration);
        }

        if (endTimeMatch.moment) {
            this.endTime = new TimeWithMicroseconds(endTimeMatch.moment, endTimeMatch.microseconds);
        } else {
            this.endTime = new TimeWithMicroseconds(undefined, endTimeMatch.microseconds, endTimeMatch.duration);
        }

        // Calculate the duration
        if (startTimeMatch.moment && endTimeMatch.moment) {
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
        } else {
            this.duration = this.duration?.subtract(1, 'milliseconds');
            this.durationPartMicroseconds = 1000 + this.endTime.microseconds - this.startTime.microseconds;
        }
    }

    public getDurationAsMicroseconds(): number {
        if (!this.duration) {
            return 0;
        }

        return this.duration.asMilliseconds() * 1000 + this.durationPartMicroseconds;
    }
}
