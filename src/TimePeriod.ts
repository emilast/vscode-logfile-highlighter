'use strict';
import * as moment from 'moment';
import { TimeWithMicroseconds } from './TimeWithMicroseconds';

export class TimePeriod {
    startTime: TimeWithMicroseconds;
    endTime: TimeWithMicroseconds;
    duration: moment.Duration;

    // The microsecond part of the duration
    durationPartMicroseconds: number;

    constructor(
        startTimeMatch: { iso: string, microseconds: number },
        endTimeMatch: { iso: string, microseconds: number }) {

        this.processStartAndEndTimes(startTimeMatch, endTimeMatch);
        this.adjustDurationWithMicroseconds();
    }

    private processStartAndEndTimes(
        startTimeMatch: { iso: string; microseconds: number; },
        endTimeMatch: { iso: string; microseconds: number; }) {

        // Full dates contain a year part, i.e. 4 digits in a row
        var startIsFullDate = /\b\d{4}\b/.test(startTimeMatch.iso);
        var endIsFullDate = /\b\d{4}\b/.test(endTimeMatch.iso);
        
        // If not valid date times, clear startTime and endTime, in order to avoid strange bugs
        if (startIsFullDate) {
            this.startTime = new TimeWithMicroseconds(moment(startTimeMatch.iso), startTimeMatch.microseconds);
        } else {
            this.startTime = new TimeWithMicroseconds(undefined, startTimeMatch.microseconds);
        }

        if (endIsFullDate) {
            this.endTime = new TimeWithMicroseconds(moment(endTimeMatch.iso), endTimeMatch.microseconds);
        } else {
            this.endTime = new TimeWithMicroseconds(undefined, endTimeMatch.microseconds);
        }

        // Calculate the duration
        if (startIsFullDate && endIsFullDate) {
            const firstMoment = moment(startTimeMatch.iso);
            const lastMoment = moment(endTimeMatch.iso);

            // used for ISO Dates like '2018-09-29' and '2018-09-29 13:12:11.001'
            this.duration = moment.duration(lastMoment.diff(firstMoment));
        } else {
            // Handle the case where only times are present (no dates) by treating them as durations
            const firstDuration = moment.duration(startTimeMatch.iso);
            const lastDuration = moment.duration(endTimeMatch.iso);

            if (moment.isDuration(firstDuration) && moment.isDuration(lastDuration)) {
                // Used for non ISO dates like '13:12:11.001'
                this.duration = moment.duration(lastDuration.asMilliseconds() - firstDuration.asMilliseconds());
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
