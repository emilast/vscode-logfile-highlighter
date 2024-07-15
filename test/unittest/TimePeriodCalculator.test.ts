'use strict';

import * as moment from 'moment';
import { TimePeriodCalculator } from '../../src/TimePeriodCalculator';
import { TimePeriod, TimeWithMicroseconds } from '../../src/TimePeriod';

describe('TimePeriodCalculator', () => {
    let testObject: TimePeriodCalculator;
    beforeEach(() => {
        testObject = new TimePeriodCalculator();
    });

    describe('getTimeStampFromText', () => {
        it('gets the correct timePeriod from "hh:mm:ss.ssssss".', () => {
            // Arrange
            const text = '10:11:12.100123 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.iso).toBe('10:11:12.100123');
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('10:11:12.100123');
            expect(result.microseconds).toBe(123);
        });

        it('gets the correct timePeriod from "YYYY-MM-DD hh:mm:ss.ssssss".', () => {
            // Arrange
            const text = '2024-01-23 10:11:12.100123 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.iso).toBe('2024-01-23 10:11:12.100123');
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('2024-01-23 10:11:12.100123');
            expect(result.microseconds).toBe(123);
        });
    });

    describe('getTimePeriod', () => {

        it('gets the correct timePeriod from "YYYY-MM-DD" and "DD.MM.YYYY".', () => {
            // Arrange
            const firstLine = '2018-01-27 first line';
            const lastLine = '28.02.2020 last line';
            const expected = moment.duration({ days: 1, months: 1, years: 2 });

            // Act
            const result = testObject.getTimePeriod(firstLine, lastLine);

            // Assert
            expect(result.duration.asMilliseconds()).toBe(expected.asMilliseconds());
        });

        it('gets the correct timePeriod from "hh:mm:ss.sss" and "hh:mm:ss.sss".', () => {
            // Arrange
            const firstLine = '10:38:28.935 first line';
            const lastLine = '16:51:29,001 last line';
            const expected = moment.duration({ seconds: 0.066, minutes: 13, hours: 6 });

            // Act
            const result = testObject.getTimePeriod(firstLine, lastLine);

            // Assert
            expect(result.duration.asMilliseconds()).toBe(expected.asMilliseconds());
        });

        it('gets the correct timePeriod from "YYYY-MM-DD hh:mm:ss.ssssss".', () => {
            // Arrange
            const firstLine = '2023-01-02 10:11:12.100000 first line';
            const lastLine = '2023-01-02 10:11:12.100123 last line';;

            // Act
            const result = testObject.getTimePeriod(firstLine, lastLine);

            // Assert
            expect(result.duration.asMilliseconds()).toBe(0);
            expect(result.durationPartMicroseconds).toBe(123);
        });

        it('gets the correct timePeriod from "hh:mm:ss.ssssss".', () => {
            // Arrange
            const firstLine = '10:11:12.100000 first line';
            const lastLine = '10:11:12.100123 last line';;

            // Act
            const result = testObject.getTimePeriod(firstLine, lastLine);

            // Assert
            expect(result.duration.asMilliseconds()).toBe(0);
            expect(result.durationPartMicroseconds).toBe(123);
        });

        it('gets the correct timePeriod from "YYYY-MM-DDThh:mm:ss.sssZ" and "DD/MM/YYYThh:mm:ss,sssZ".', () => {
            // Arrange
            const firstLine = '2018-01-27T10:38:28.935Z first line';
            const lastLine = '2020-02-28T16:51:29.001Z last line';
            const expected = moment.duration({ seconds: 0.066, minutes: 13, hours: 6, days: 1, months: 1, years: 2 });

            // Act
            const result = testObject.getTimePeriod(firstLine, lastLine);

            // Assert
            expect(result.duration.asMilliseconds()).toBe(expected.asMilliseconds());
        });

        it('gets the correct timePeriod from "YYYY-MM-DD hh:mm:ss.sss" and "DD/MM/YYY hh:mm:ss,sss".', () => {
            // Arrange
            const firstLine = '2018-01-27 10:38:28.935 first line';
            const lastLine = '28/02/2020 16:51:29,001 last line';
            const expected = moment.duration({ seconds: 0.066, minutes: 13, hours: 6, days: 1, months: 1, years: 2 });

            // Act
            const result = testObject.getTimePeriod(firstLine, lastLine);

            // Assert
            expect(result.duration.asMilliseconds()).toBe(expected.asMilliseconds());
        });

        it('gets the correct timePeriod from "YYYY-MM-DD hh:mm" and MM/DD/YYYY hh:mm".', () => {
            // Arrange
            const firstLine = '2018-01-27 10:38 first line';
            const lastLine = '02/28/2020 16:51 last line';;
            const expected = moment.duration({ minutes: 13, hours: 6, days: 1, months: 1, years: 2 });

            // Act
            const result = testObject.getTimePeriod(firstLine, lastLine);

            // Assert
            expect(result.duration.asMilliseconds()).toBe(expected.asMilliseconds());
        });

        it('should only consider log statements with the same format (length).', () => {
            // Arrange
            const firstLine = '2018-01-27 first line';
            const lastLine = '02/28/2020 last line';
            const expected = moment.duration({ days: 1, months: 1, years: 2 });

            // Act
            const result = testObject.getTimePeriod(firstLine, lastLine);

            // Assert
            expect(result.duration.asMilliseconds()).toBe(expected.asMilliseconds());
        });

        it('should only consider the first timestamp statement of a line.', () => {
            // Arrange
            const firstLine = 'foo bar baz 2018-01-27 first line';
            const lastLine = 'hello world 02/28/2020 last line; 2021-03-29 my fourth statement on same line.';
            const expected = moment.duration({ days: 1, months: 1, years: 2 });

            // Act
            const result = testObject.getTimePeriod(firstLine, lastLine);

            // Assert
            expect(result.duration.asMilliseconds()).toBe(expected.asMilliseconds());
        });
    });

    describe('convertToDisplayString', () => {
        const PREFIX = 'Selected: ';
        it('should only consist of "0μs".', () => {
            // Arrange
            const input = moment.duration({ seconds: 0 });
            const expected = PREFIX + input.asMilliseconds() + 'ms';

            // Act
            const result = testObject.convertToDisplayString(
                new TimePeriod(
                    new TimeWithMicroseconds(moment('2024-02-03 12:13:14'), 0),
                    new TimeWithMicroseconds(moment('2024-02-03 12:13:14'), 0),
                    input));

            // Assert
            expect(result).toBe(PREFIX + '0μs');
        });

        it('should only consist of "ms".', () => {
            // Arrange
            const input = moment.duration({ seconds: 0.123 });
            const expected = PREFIX + input.asMilliseconds() + 'ms';

            // Act
            const result = testObject.convertToDisplayString(
                new TimePeriod(
                    new TimeWithMicroseconds(moment('2024-02-03 12:13:14'), 0),
                    new TimeWithMicroseconds(moment('2024-02-03 12:13:14'), 0),
                    input));

            // Assert
            expect(result).toBe(expected);
        });

        it('should only consist of "s" and "ms".', () => {
            // Arrange
            const input = moment.duration({ seconds: 6.123 });
            const expected = PREFIX + input.seconds() + 's, '
                + input.milliseconds() + 'ms';

            // Act
            const result = testObject.convertToDisplayString(
                new TimePeriod(
                    new TimeWithMicroseconds(moment('2024-02-03 12:13:14'), 0),
                    new TimeWithMicroseconds(moment('2024-02-03 12:13:14'), 0),
                    input));

            // Assert
            expect(result).toBe(expected);
        });

        it('should only consist of "min", "s" and "ms".', () => {
            // Arrange
            const input = moment.duration({ seconds: 6.123, minutes: 3 });
            const expected = PREFIX + input.minutes() + 'min, '
                + input.seconds() + 's, '
                + input.milliseconds() + 'ms';

            // Act
            const result = testObject.convertToDisplayString(
                new TimePeriod(
                    new TimeWithMicroseconds(moment('2024-02-03 12:13:14'), 0),
                    new TimeWithMicroseconds(moment('2024-02-03 12:13:14'), 0),
                    input));

            // Assert
            expect(result).toBe(expected);
        });

        it('should only consist of "h", "min", "s" and "ms".', () => {
            // Arrange
            const input = moment.duration({ seconds: 6.123, minutes: 0, hours: 5 });
            const expected = PREFIX + input.hours() + 'h, '
                + input.minutes() + 'min, '
                + input.seconds() + 's, '
                + input.milliseconds() + 'ms';

            // Act
            const result = testObject.convertToDisplayString(
                new TimePeriod(
                    new TimeWithMicroseconds(moment('2024-02-03 12:13:14'), 0),
                    new TimeWithMicroseconds(moment('2024-02-03 12:13:14'), 0),
                    input));

            // Assert
            expect(result).toBe(expected);
        });

        it('should consist of "d", "h", "min", "s" and "ms".', () => {
            // Arrange
            const input = moment.duration({ seconds: 6.123, minutes: 0, hours: 5, days: 15, years: 2 });
            const expected = PREFIX + Math.floor(input.asDays()) + 'd, '
                + input.hours() + 'h, '
                + input.minutes() + 'min, '
                + input.seconds() + 's, '
                + input.milliseconds() + 'ms';

            // Act
            const result = testObject.convertToDisplayString(
                new TimePeriod(
                    new TimeWithMicroseconds(moment('2024-02-03 12:13:14'), 0),
                    new TimeWithMicroseconds(moment('2024-02-03 12:13:14'), 0),
                    input));

            // Assert
            expect(result).toBe(expected);
        });
    });
});
