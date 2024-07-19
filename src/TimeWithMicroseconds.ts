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
