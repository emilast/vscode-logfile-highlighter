'use strict';

import * as moment from 'moment';
import TimePeriodCalculator = require('../../src/TimePeriodCalculator');

describe('TimePeriodCalculator', () => {
    let testObject: TimePeriodCalculator;
    beforeEach( () => {
        testObject = new TimePeriodCalculator();
    });

    describe('getTimePeriod', () => {

        it('gets the correct timePeriod from "YYYY-MM-DD" and "DD.MM.YYYY".', () => {
            // Arrange
            const logContent = '2018-01-27 [0234ß\n\b\r0?234%&\n} my first logging\n\
                                28.01.2020 my second logging 0 $%34&/)(34=}?23\n\
                                28.02.2020 my third logging 0 $%34&/)(34=}?23';
            const expected = moment.duration({days: 1, months: 1, years: 2});

            // Act
            const result = testObject.getTimePeriod(logContent);

            // Assert
            expect(result.asMilliseconds()).toBe(expected.asMilliseconds());
        });

        it('gets the correct timePeriod from "hh:mm:ss.sss" and "hh:mm:ss.sss".', () => {
            // Arrange
            const logContent = '10:38:28.935 [0234ß\n\b\r0?234%&\n} my first logging\n\
                                12:50:29,901 my second logging 0 $%34&/)(34=}?23\n\
                                16:51:29,001 my third logging 0 $%34&/)(34=}?23';
            const expected = moment.duration({seconds: 0.066, minutes: 13, hours: 6});

            // Act
            const result = testObject.getTimePeriod(logContent);

            // Assert
            expect(result.asMilliseconds()).toBe(expected.asMilliseconds());
        });

        it('gets the correct timePeriod from "YYYY-MM-DDThh:mm:ss.sssZ" and "DD/MM/YYYThh:mm:ss,sssZ".', () => {
            // Arrange
            const logContent = '2018-01-27T10:38:28.935Z [0234ß\n\b\r0?234%&\n} my first logging\n\
                                07.28.2019T16:51:29,001Z my second logging 0 $%34&/)(34=}?23\n\
                                2020-02-28T16:51:29.001Z my third logging 0 $%34&/)(34=}?23';
            const expected = moment.duration({seconds: 0.066, minutes: 13, hours: 6, days: 1, months: 1, years: 2});

            // Act
            const result = testObject.getTimePeriod(logContent);

            // Assert
            expect(result.asMilliseconds()).toBe(expected.asMilliseconds());
        });

        it('gets the correct timePeriod from "YYYY-MM-DD hh:mm:ss.sss" and "DD/MM/YYY hh:mm:ss,sss".', () => {
            // Arrange
            const logContent = '2018-01-27 10:38:28.935 [0234ß\n\b\r0?234%&\n} my first logging\n\
                                07.28.2019 16:51:29,001 my second logging 0 $%34&/)(34=}?23\n\
                                28/02/2020 16:51:29,001 my third logging 0 $%34&/)(34=}?23';
            const expected = moment.duration({seconds: 0.066, minutes: 13, hours: 6, days: 1, months: 1, years: 2});

            // Act
            const result = testObject.getTimePeriod(logContent);

            // Assert
            expect(result.asMilliseconds()).toBe(expected.asMilliseconds());
        });

        it('gets the correct timePeriod from "YYYY-MM-DD hh:mm" and MM/DD/YYYY hh:mm".', () => {
            // Arrange
            const logContent = '2018-01-27 10:38 [0234ß\n\b\r0?234%&\n} my first logging\n\
                                07.28.2019 16:51:29,001 my second logging 0 $%34&/)(34=}?23\n\
                                02/28/2020 16:51 my second logging 0 $%34&/)(34=}?23';
            const expected = moment.duration({minutes: 13, hours: 6, days: 1, months: 1, years: 2});

            // Act
            const result = testObject.getTimePeriod(logContent);

            // Assert
            expect(result.asMilliseconds()).toBe(expected.asMilliseconds());
        });
    });

    describe('convertToDisplayString', () => {
        const PREFIX = 'Selected: ';
        it('should only consist of "0 ms".', () => {
            // Arrange
            const input = moment.duration({seconds: 0});
            const expected = PREFIX + input.asMilliseconds() + 'ms';

            // Act
            const result = testObject.convertToDisplayString(input);

            expect(result).toBe(expected);
        });

        it('should only consist of "ms".', () => {
            // Arrange
            const input = moment.duration({seconds: 0.123});
            const expected = PREFIX + input.asMilliseconds() + 'ms';

            // Act
            const result = testObject.convertToDisplayString(input);

            expect(result).toBe(expected);
        });

        it('should only consist of "s" and "ms".', () => {
            // Arrange
            const input = moment.duration({seconds: 6.123});
            const expected = PREFIX + input.seconds() + 's, '
                                    + input.milliseconds() + 'ms';

            // Act
            const result = testObject.convertToDisplayString(input);

            expect(result).toBe(expected);
        });

        it('should only consist of "min", "s" and "ms".', () => {
            // Arrange
            const input = moment.duration({seconds: 6.123, minutes: 3});
            const expected = PREFIX + input.minutes() + 'min, '
                                    + input.seconds() + 's, '
                                    + input.milliseconds() + 'ms';

            // Act
            const result = testObject.convertToDisplayString(input);

            expect(result).toBe(expected);
        });

        it('should only consist of "h", "min", "s" and "ms".', () => {
            // Arrange
            const input = moment.duration({seconds: 6.123, minutes: 0, hours: 5});
            const expected = PREFIX + input.hours() + 'h, '
                                    + input.minutes() + 'min, '
                                    + input.seconds() + 's, '
                                    + input.milliseconds() + 'ms';

            // Act
            const result = testObject.convertToDisplayString(input);

            expect(result).toBe(expected);
        });

        it('should consist of "d", "h", "min", "s" and "ms".', () => {
            // Arrange
            const input = moment.duration({seconds: 6.123, minutes: 0, hours: 5, days: 15, years: 2});
            const expected = PREFIX + Math.floor(input.asDays()) + 'd, '
                                    + input.hours() + 'h, '
                                    + input.minutes() + 'min, '
                                    + input.seconds() + 's, '
                                    + input.milliseconds() + 'ms';

            // Act
            const result = testObject.convertToDisplayString(input);

            expect(result).toBe(expected);
        });
    });
});
