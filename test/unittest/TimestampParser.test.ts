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

        it('gets the correct timestamp from "YYYY-MM-DDThh:mm:ss.sssssssZ" (the 7th sub-second digit is ignored).', () => {
            // Arrange
            const text = '2024-09-10T05:49:20.0417722Z VERBOSE: Importing cmdlet Disconnect-AzAccount.';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.moment.toString()).toEqual(moment('2024-09-10T05:49:20.0417729Z').toString());
            expect(result.duration).toBeUndefined();
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('2024-09-10T05:49:20.0417722Z');
            expect(result.microseconds).toBe(772);
        });

        it('gets the correct timestamp from "YYYY-MM-DDThhmm".', () => {
            // Arrange
            const text = '2024-11-13T0910 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.moment.toISOString()).toEqual(moment('2024-11-13 09:10').toISOString());
            expect(result.duration).toBeUndefined();
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('2024-11-13T0910');
            expect(result.microseconds).toBe(0);
        });

        it('gets the correct timestamp from "YYYY-MM-DDThhmmZ".', () => {
            // Arrange
            const text = '2024-11-13T0910Z first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.moment.toISOString()).toEqual(moment('2024-11-13 09:10:00').toISOString());
            expect(result.duration).toBeUndefined();
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('2024-11-13T0910Z');
            expect(result.microseconds).toBe(0);
        });

        it('gets the correct timestamp from "YYYY-MM-DDThhmm+0200".', () => {
            // Arrange
            const text = '2024-11-13T0910+0200 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.moment.toISOString()).toEqual(moment('2024-11-13 09:10:00+02:00').toISOString());
            expect(result.duration).toBeUndefined();
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('2024-11-13T0910+0200');
            expect(result.microseconds).toBe(0);
        });

        it('gets the correct timestamp from "YYYY-MM-DD hh:mm:ss+02:00".', () => {
            // Arrange
            const text = '2024-11-13 09:10:00+02:00 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.moment.toISOString()).toEqual(moment('2024-11-13 09:10:00+02:00').toISOString());
            expect(result.duration).toBeUndefined();
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('2024-11-13 09:10:00+02:00');
            expect(result.microseconds).toBe(0);
        });


        
        it('gets the correct timestamp from "YYYY-MM-DD hh:mm:ss +02:00".', () => {
            // Arrange
            const text = '2024-11-13 09:10:00 +02:00 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.moment.toISOString()).toEqual(moment('2024-11-13 09:10:00+02:00').toISOString());
            expect(result.duration).toBeUndefined();
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('2024-11-13 09:10:00 +02:00');
            expect(result.microseconds).toBe(0);
        });

        it('gets the correct timestamp from "YYYY-MM-DDThhmmss".', () => {
            // Arrange
            const text = '2024-11-13T091012 first line';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result.moment.toISOString()).toEqual(moment('2024-11-13 09:10:12').toISOString());
            expect(result.duration).toBeUndefined();
            expect(result.matchIndex).toBe(0);
            expect(result.original).toBe('2024-11-13T091012');
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

        it('ignores non-time digit sequences such as "29:212121".', () => {
            // Arrange
            // const text = '29:212121';
            const text = 'at $5.S (file:///c:/Program%20Files/Microsoft%20VS%20Code/resources/app/out/vs/workbench/api/node/extensionHostProcess.js:29:116786)';

            // Act
            const result = testObject.getTimestampFromText(text);

            // Assert
            expect(result).toBeUndefined();
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
