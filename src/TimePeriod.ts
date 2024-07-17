'use strict';
import * as moment from 'moment';

export class TimePeriod {
    startTime: TimeWithMicroseconds;
    endTime: TimeWithMicroseconds;
    duration: moment.Duration;

    // The microsecond part of the duration
    durationPartMicroseconds: number;

    constructor(
        startTimeMatch: { iso: string, microseconds: number },
        endTimeMatch: { iso: string, microseconds: number }) {

        this.startTime = new TimeWithMicroseconds(moment(startTimeMatch.iso), startTimeMatch.microseconds);
        this.endTime = new TimeWithMicroseconds(moment(endTimeMatch.iso), endTimeMatch.microseconds);
        this.duration = this.calculateDuration(startTimeMatch, endTimeMatch);

        this.adjustDurationWithMicroseconds();
    }

    private calculateDuration(
        startTime: { iso: string; microseconds: number; },
        endTime: { iso: string; microseconds: number; })
        : moment.Duration {

        let duration: moment.Duration;

        const firstMoment = moment(startTime.iso);
        const lastMoment = moment(endTime.iso);

        if (firstMoment.isValid() && lastMoment.isValid()) {
            // used for ISO Dates like '2018-09-29' and '2018-09-29 13:12:11.001'
            duration = moment.duration(lastMoment.diff(firstMoment));
        } else {
            // Handle the case where only times are present (no dates) by treating them as durations
            const firstDuration = moment.duration(startTime.iso);
            const lastDuration = moment.duration(endTime.iso);

            if (moment.isDuration(firstDuration) && moment.isDuration(lastDuration)) {
                // Used for non ISO dates like '13:12:11.001'
                duration = moment.duration(lastDuration.asMilliseconds() - firstDuration.asMilliseconds());
            }
        }
        return duration;
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

export class TimeWithMicroseconds {
    time: moment.Moment;
    microseconds: number;

    constructor(time: moment.Moment, microseconds: number | undefined) {
        this.time = time;
        this.microseconds = microseconds || 0;
    }

    public getTimeAsEpoch(): number {
        return this.time.valueOf() * 1000 + this.microseconds;
    }
}
