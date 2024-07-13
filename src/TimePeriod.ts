'use strict';
import * as moment from 'moment';

export class TimePeriod {
    startTime: TimeWithMicroseconds;
    endTime: TimeWithMicroseconds;
    duration: moment.Duration;
    durationMicroseconds: number;

    constructor(startTime: TimeWithMicroseconds, endTime: TimeWithMicroseconds,
        duration: moment.Duration) {
        this.startTime = startTime;
        this.endTime = endTime;

        if (endTime.microseconds >= startTime.microseconds) {
            this.duration = duration;
            this.durationMicroseconds = endTime.microseconds - startTime.microseconds;
        }
        else {
            this.duration = duration.subtract(1, 'milliseconds');
            this.durationMicroseconds = 1000 + endTime.microseconds - startTime.microseconds;
        }
    }
}

export class TimeWithMicroseconds {
    time: moment.Moment;
    microseconds: number;

    constructor(time: moment.Moment, microseconds: number | undefined) {
        this.time = time;
        this.microseconds = microseconds || 0;
    }
}
