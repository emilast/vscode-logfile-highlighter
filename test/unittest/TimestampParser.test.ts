'use strict';

import moment = require('moment');
import { TimestampParser } from '../../src/TimestampParsers/TimestampParser';

describe('TimestampParser', () => {
    let testObject: TimestampParser;
    beforeEach(() => {
        testObject = new TimestampParser();
    });

    describe('getTimestampFromText', () => {
        it('gets the correct timestamp from "YYYY-MM-DD".', () => {
            // Arrange
            const text = '2024-01-23 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.moment).toEqual(moment('2024-01-23'));
            expect(result.duration).toBeUndefined();
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('2024-01-23');
            expect(result.microseconds).toBe(0);
        });

        it('gets the correct timestamp from "MM/DD/YYYY".', () => {
            // Arrange
            const text = '01/23/2024 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.moment.toString()).toEqual(moment('2024-01-23').toString());
            expect(result.duration).toBeUndefined();
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('01/23/2024');
            expect(result.microseconds).toBe(0);
        });

        it('gets the correct timestamp from "DD-MM-YYYY" (little endian).', () => {
            // Arrange
            const text = '23-01-2024 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.moment.toString()).toEqual(moment('2024-01-23').toString());
            expect(result.duration).toBeUndefined();
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('23-01-2024');
            expect(result.microseconds).toBe(0);
        });

        it('gets the correct timestamp from "YYYY-MM-DD hh:mm".', () => {
            // Arrange
            const text = '2024-01-23 10:38 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.moment).toEqual(moment('2024-01-23 10:38'));
            expect(result.duration).toBeUndefined();
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('2024-01-23 10:38');
            expect(result.microseconds).toBe(0);
        });

        it('gets the correct timestamp from "DD.MM-YYYY hh:mm" (little endian).', () => {
            // Arrange
            const text = '23-01-2024 10:38 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.moment).toEqual(moment('2024-01-23 10:38'));
            expect(result.duration).toBeUndefined();
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('23-01-2024 10:38');
            expect(result.microseconds).toBe(0);
        });

        it('gets the correct timestamp from "hh:mm:ss.ssssss".', () => {
            // Arrange
            const text = '10:11:12.100123 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.moment).toBeUndefined();
            expect(result.duration).toEqual(moment.duration('10:11:12.100123'));
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
            expect(result.moment).toEqual(moment('2024-01-23 10:11:12.100123'));
            expect(result.duration).toBeUndefined();
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
            expect(result.moment).toEqual(moment('2020-02-28'));
            expect(result.duration).toBeUndefined();
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
            expect(result.moment).toEqual(moment('2020-02-28 16:51'));
            expect(result.duration).toBeUndefined();
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
            expect(result.moment).toEqual(moment('2018-01-27T10:38:28.935Z'));
            expect(result.duration).toBeUndefined();
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('2018-01-27T10:38:28.935Z');
            expect(result.microseconds).toBe(0);
        });

        it('gets the correct timestamp from "MM/DD/YYYY hh:mm:ss,sss".', () => {
            // Arrange
            const text = '02/28/2020 16:51:29,001 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.moment.toString()).toEqual(moment('2020-02-28 16:51:29.001').toString());
            expect(result.duration).toBeUndefined();
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('02/28/2020 16:51:29,001');
            expect(result.microseconds).toBe(0);
        });

        it('gets the correct timestamp from "MM/DD/YYYY hh:mm:ss,ssssss".', () => {
            // Arrange
            const text = '02/28/2020 16:51:29,001234 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.moment.toString()).toEqual(moment('2020-02-28 16:51:29.001234').toString());
            expect(result.duration).toBeUndefined();
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('02/28/2020 16:51:29,001234');
            expect(result.microseconds).toBe(234);
        });

        it('gets the correct timestamp from "YYYY-MM-DDThh:mm:ss.sss+01:00".', () => {
            // Arrange
            const text = '2016-12-09T09:29:02.258+01:00 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.moment.toString()).toEqual(moment('2016-12-09T09:29:02.258+01:00').toString());
            expect(result.duration).toBeUndefined();
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('2016-12-09T09:29:02.258+01:00');
            expect(result.microseconds).toBe(0);
        });

        it('gets the correct timestamp from "YYYY-MM-DDThh:mm:ss.ssssss+01:00".', () => {
            // Arrange
            const text = '2016-12-09T09:29:02.258211+01:00 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.moment.toString()).toEqual(moment('2016-12-09T09:29:02.258+01:00').toString());
            expect(result.duration).toBeUndefined();
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('2016-12-09T09:29:02.258211+01:00');
            expect(result.microseconds).toBe(211);
        });

        it('gets the correct matchIndex.', () => {
            // Arrange
            const text = 'abc 2024-01-23 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.moment).toEqual(moment('2024-01-23'));
            expect(result.duration).toBeUndefined();
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
});
