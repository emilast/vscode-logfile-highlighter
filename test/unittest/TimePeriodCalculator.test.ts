'use strict';

import * as moment from 'moment';
import { TimePeriodCalculator } from '../../src/TimePeriodCalculator';
import { TimePeriod } from '../../src/TimePeriod';

describe('TimePeriodCalculator', () => {
    let testObject: TimePeriodCalculator;
    beforeEach(() => {
        testObject = new TimePeriodCalculator();
    });

    describe('getTimeStampFromText', () => {
        it('gets the correct timestamp from "YYYY-MM-DD".', () => {
            // Arrange
            const text = '2024-01-23 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.iso).toBe('2024-01-23');
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('2024-01-23');
            expect(result.microseconds).toBe(0);
        });

        it('gets the correct timestamp from "YYYY-MM-DD hh:mm".', () => {
            // Arrange
            const text = '2024-01-23 10:38 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.iso).toBe('2024-01-23 10:38');
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('2024-01-23 10:38');
            expect(result.microseconds).toBe(0);
        });

        it('gets the correct timestamp from "hh:mm:ss.ssssss".', () => {
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

        it('gets the correct timestamp from "YYYY-MM-DD hh:mm:ss.ssssss".', () => {
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

        it('gets the correct timestamp from "DD.MM.YYYY".', () => {
            // Arrange
            const text = '28.02.2020 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.iso).toBe('2020-02-28');
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('28.02.2020');
            expect(result.microseconds).toBe(0);
        });

        it('gets the correct timestamp from "DD.MM.YYYY hh:mm".', () => {
            // Arrange
            const text = '28.02.2020 16:51 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.iso).toBe('2020-02-28 16:51');
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('28.02.2020 16:51');
            expect(result.microseconds).toBe(0);
        });

        it('gets the correct timestamp from "YYYY-MM-DDThh:mm:ss.sssZ".', () => {
            // Arrange
            const text = '2018-01-27T10:38:28.935Z first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.iso).toBe('2018-01-27T10:38:28.935Z');
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('2018-01-27T10:38:28.935Z');
            expect(result.microseconds).toBe(0);
        });

        it('gets the correct timestamp from "DD/MM/YYY hh:mm:ss,sss".', () => {
            // Arrange
            const text = '28/02/2020 16:51:29,001 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.iso).toBe('2020-02-28 16:51:29.001');
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('28/02/2020 16:51:29,001');
            expect(result.microseconds).toBe(0);
        });

        it('gets the correct timestamp from "DD/MM/YYY hh:mm:ss,ssssss".', () => {
            // Arrange
            const text = '28/02/2020 16:51:29,001234 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.iso).toBe('2020-02-28 16:51:29.001234');
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('28/02/2020 16:51:29,001234');
            expect(result.microseconds).toBe(234);
        });

        it('gets the correct matchIndex.', () => {
            // Arrange
            const text = 'abc 2024-01-23 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.iso).toBe('2024-01-23');
            expect(result.matchIndex).toBe(4);
            expect(result.original).toBe('2024-01-23');
            expect(result.microseconds).toBe(0);
        });

        it('returns undefined if no matching timestamp.', () => {
            // Arrange
            const text = 'abc';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result).toBeUndefined();
        });
    });

    describe('getTimePeriod', () => {
        it('gets the correct timePeriod from two dates of the same format.', () => {
            // Arrange
            const firstLine = '2018-01-27 first line';
            const lastLine = '2020-02-28 last line';
            const expected = moment.duration({ days: 1, months: 1, years: 2 });

            // Act
            const result = testObject.getTimePeriod(firstLine, lastLine);

            // Assert
            expect(result.duration.asMilliseconds()).toBe(expected.asMilliseconds());
        });

        it('gets the correct timePeriod from two differently formatted dates.', () => {
            // Arrange
            const firstLine = '2018-01-27 first line';
            const lastLine = '28.02.2020 last line';
            const expected = moment.duration({ days: 1, months: 1, years: 2 });

            // Act
            const result = testObject.getTimePeriod(firstLine, lastLine);

            // Assert
            expect(result.duration.asMilliseconds()).toBe(expected.asMilliseconds());
        });

        it('gets the correct timePeriod from two times (with milliseconds) with dates.', () => {
            // Arrange
            const firstLine = '2018-01-27T10:38:28.935Z first line';
            const lastLine = '2020-02-28T16:51:29.001Z last line';
            const expected = moment.duration({ years: 2, months: 1, days: 1, hours: 6, minutes: 13, seconds: 0, milliseconds: 66 });

            // Act
            const result = testObject.getTimePeriod(firstLine, lastLine);

            // Assert
            expect(result.duration.asMilliseconds()).toBe(expected.asMilliseconds());
        });

        it('gets the correct timePeriod from two times (with milliseconds) without dates.', () => {
            // Arrange
            const firstLine = '10:38:28.935 first line';
            const lastLine = '16:51:29,001 last line';
            const expected = moment.duration({ hours: 6, minutes: 13, seconds: 0, milliseconds: 66 });

            // Act
            const result = testObject.getTimePeriod(firstLine, lastLine);

            // Assert
            expect(result.duration.asMilliseconds()).toBe(expected.asMilliseconds());
            expect(result.durationPartMicroseconds).toBe(0);
        });

        it('gets the correct timePeriod from with microseconds with dates.', () => {
            // Arrange
            const firstLine = '2023-01-02 10:11:12.100000 first line';
            const lastLine = '2023-01-02 10:11:12.100123 last line';;

            // Act
            const result = testObject.getTimePeriod(firstLine, lastLine);

            // Assert
            expect(result.duration.asMilliseconds()).toBe(0);
            expect(result.durationPartMicroseconds).toBe(123);
        });

        it('gets the correct timePeriod from with microseconds without dates.', () => {
            // Arrange
            const firstLine = '10:11:12.100000 first line';
            const lastLine = '10:11:12.100123 last line';;

            // Act
            const result = testObject.getTimePeriod(firstLine, lastLine);

            // Assert
            expect(result.duration.asMilliseconds()).toBe(0);
            expect(result.durationPartMicroseconds).toBe(123);
        });

        it('should only consider the first timestamp statement of a line.', () => {
            // Arrange
            const firstLine = 'foo bar baz 2018-01-27 first line';
            const lastLine = 'hello world 02/28/2020 last line; 2021-03-29 my fourth statement on same line.';
            const expected = moment.duration({ years: 2, months: 1, days: 1 });

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

            // Act
            const result = testObject.convertToDisplayString(
                new TimePeriod(
                    { iso: '2024-02-03 12:13:14', microseconds: 0 },
                    { iso: '2024-02-03 12:13:14', microseconds: 0 }));

            // Assert
            expect(result).toBe(PREFIX + '0μs');
        });

        it('should only consist of "μs".', () => {
            // Arrange

            // Act
            const result = testObject.convertToDisplayString(
                new TimePeriod(
                    { iso: '2024-02-03 12:13:14', microseconds: 10 },
                    { iso: '2024-02-03 12:13:14', microseconds: 30 }));

            // Assert
            expect(result).toBe(PREFIX + '20μs');
        });

        it('should only consist of "ms".', () => {
            // Arrange

            // Act
            const result = testObject.convertToDisplayString(
                new TimePeriod(
                    { iso: '2024-02-03 12:13:14.000', microseconds: 0 },
                    { iso: '2024-02-03 12:13:14.123', microseconds: 0 }));

            // Assert
            expect(result).toBe(PREFIX + '123ms');
        });

        it('should only consist of "s" and "ms".', () => {
            // Arrange

            // Act
            const result = testObject.convertToDisplayString(
                new TimePeriod(
                    { iso: '2024-02-03 12:13:14.000', microseconds: 0 },
                    { iso: '2024-02-03 12:13:20.123', microseconds: 0 }));

            // Assert
            expect(result).toBe(PREFIX + '6s, 123ms');
        });

        it('should only consist of "min", "s" and "ms".', () => {
            // Arrange

            // Act
            const result = testObject.convertToDisplayString(
                new TimePeriod(
                    { iso: '2024-02-03 12:13:14.000', microseconds: 0 },
                    { iso: '2024-02-03 12:16:20.123', microseconds: 0 },));

            // Assert
            expect(result).toBe(PREFIX + '3min, 6s, 123ms');
        });

        it('should only consist of "h", "min", "s" and "ms".', () => {
            // Arrange

            // Act
            const result = testObject.convertToDisplayString(
                new TimePeriod(
                    { iso: '2024-02-03 12:13:14.000', microseconds: 0 },
                    { iso: '2024-02-03 17:13:20.123', microseconds: 0 }));

            // Assert
            expect(result).toBe(PREFIX + '5h, 0min, 6s, 123ms');
        });

        it('should consist of "d", "h", "min", "s" and "ms".', () => {
            // Arrange

            // Act
            const result = testObject.convertToDisplayString(
                new TimePeriod(
                    { iso: '2022-02-03 12:13:14', microseconds: 0 },
                    { iso: '2024-02-18 17:13:20', microseconds: 0 }));

            // Assert
            expect(result).toBe(PREFIX + '745d, 5h, 0min, 6s, 0ms');
        });
    });
});
