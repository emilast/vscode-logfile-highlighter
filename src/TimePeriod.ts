'use strict';
import * as moment from 'moment';

export class TimePeriod {
    startTime: TimeWithMicroseconds;
    endTime: TimeWithMicroseconds;
    duration: moment.Duration;
    
    // The microsecond part of the duration
    durationPartMicroseconds: number;

    constructor(startTime: TimeWithMicroseconds, endTime: TimeWithMicroseconds,
        duration: moment.Duration) {
        this.startTime = startTime;
        this.endTime = endTime;

        if (endTime.microseconds >= startTime.microseconds) {
            this.duration = duration;
            this.durationPartMicroseconds = endTime.microseconds - startTime.microseconds;
        }
        else {
            this.duration = duration.subtract(1, 'milliseconds');
            this.durationPartMicroseconds = 1000 + endTime.microseconds - startTime.microseconds;
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
