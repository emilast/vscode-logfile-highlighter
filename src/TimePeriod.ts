'use strict';
import * as moment from 'moment';

export class TimePeriod {
    startTime: moment.Moment;
    endTime: moment.Moment;
    duration: moment.Duration;

    constructor(startTime: moment.Moment, endTime: moment.Moment, duration: moment.Duration) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.duration = duration;
    }
}
