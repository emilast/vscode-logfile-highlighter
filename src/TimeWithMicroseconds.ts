export class TimeWithMicroseconds {
    public time: moment.Moment | undefined;
    public microseconds: number;

    /** Time of day, used when the timestamp has no date part (e.g. `10:21:33.456`). */
    public timeOfDay: moment.Duration | undefined;

    constructor(time: moment.Moment | undefined, microseconds: number | undefined, timeOfDay?: moment.Duration) {
        this.time = time;
        this.microseconds = microseconds || 0;
        this.timeOfDay = timeOfDay;
    }

    /**
     * Returns the time in microseconds. For timestamps with a date this is the time since the
     * Unix epoch; for time-only timestamps it is the time since midnight. The two kinds are only
     * comparable with each other, not across kinds.
     */
    public getTimeAsEpoch(): number {
        if (this.time) {
            return this.time.valueOf() * 1000 + this.microseconds;
        }
        if (this.timeOfDay) {
            return this.timeOfDay.asMilliseconds() * 1000 + this.microseconds;
        }
        return 0;
    }
}
