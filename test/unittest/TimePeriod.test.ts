'use strict';

import * as moment from 'moment';
import { TimePeriod } from '../../src/TimePeriod';

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
            expect(result.startTime.time).toBeUndefined(); // Not set when date is missing
            expect(result.endTime.time).toBeUndefined(); // Not set when date is missing
        });

        it('gets the correct duration with microseconds.', () => {
            // Arrange
            const startTime = {iso: '2024-02-03 12:13:14.100', microseconds: 1};
            const endTime = {iso: '2024-02-03 12:13:15.200', microseconds: 10};

            // Act
            const result = new TimePeriod(startTime, endTime);

            // Assert
            expect(result.duration).toEqual(moment.duration({ seconds: 1, milliseconds: 100 }));
            expect(result.durationPartMicroseconds).toBe(9);
        });

        it('gets the correct duration with negative microseconds.', () => {
            // Arrange
            const startTime = {iso: '2024-02-03 12:13:14.100', microseconds: 10};
            const endTime = {iso: '2024-02-03 12:13:14.200', microseconds: 1};

            // Act
            const result = new TimePeriod(startTime, endTime);

            // Assert
            expect(result.duration).toEqual(moment.duration({ seconds: 0, milliseconds: 99 }));
            expect(result.durationPartMicroseconds).toBe(991);
        });
    });
});
