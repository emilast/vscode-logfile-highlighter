'use strict';

import * as moment from 'moment';
import { TimePeriod, TimeWithMicroseconds } from '../../src/TimePeriod';

describe('TimePeriod', () => {
    describe('duration', () => {
        it('gets the correct duration when full dates are present.', () => {
            // Arrange
            const startTime = {iso: '2024-02-03 12:13:14', microseconds: 0};
            const endTime = {iso: '2024-02-03 12:13:15', microseconds: 0};

            // Act
            const result = new TimePeriod(startTime, endTime);

            // Assert
            expect(result.duration).toEqual(moment.duration({ seconds: 1 }));
            expect(result.durationPartMicroseconds).toBe(0);
        });

        it('gets the correct duration when only times are (no dates).', () => {
            // Arrange
            const startTime = {iso: '12:13:14', microseconds: 0};
            const endTime = {iso: '12:13:15', microseconds: 0};

            // Act
            const result = new TimePeriod(startTime, endTime);

            // Assert
            expect(result.duration).toEqual(moment.duration({ seconds: 1 }));
            expect(result.durationPartMicroseconds).toBe(0);
        });
    });
});
