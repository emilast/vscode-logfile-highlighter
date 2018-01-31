'use strict';

import * as moment from 'moment';
import TimePeriodCalculator = require('../../src/TimePeriodCalculator');

describe('TimePeriodCalculator', () => {
    let testObject: TimePeriodCalculator;
    beforeEach( () => {
        testObject = new TimePeriodCalculator();
    });

    describe('getTimePeriod', () => {
        it('Get the correct timePeriod from "YYYY-MM-DD hh:mm:ss.sss"', () => {
            // Arrange
            const logContent = '2018-01-27 10:38:28.935 [0234ß\n\b\r0?234%&\n} my first logging\n \
                                2020-02-28 16:51:29.001 my second logging 0 $%34&/)(34=}?23';
            const expected = moment.duration({seconds: 0.066, minutes: 1, hours: 13, days: 1, months: 1, years: 2});

            // Act
            const result = testObject.getTimePeriod(logContent);

            // Assert
            expect(result.milliseconds).toBe(expected.milliseconds);
        });
    });
});
