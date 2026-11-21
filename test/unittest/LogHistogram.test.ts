'use strict';

import { analyzeLog } from '../../src/LogAnalysis';
import { computeHistogram, timeOfLine } from '../../src/LogHistogram';
import { LogLevel, LogLevelParser } from '../../src/LogLevelParser';

describe('LogHistogram', () => {

    describe('timeOfLine', () => {
        it('reads dates and times, with milliseconds.', () => {
            expect(timeOfLine('2026-11-21 09:14:02.118 INFO Starting')).toEqual({ time: Date.UTC(2026, 10, 21, 9, 14, 2, 118), hasDate: true });
            expect(timeOfLine('[2026-11-21T09:14:02,5Z] Starting')).toEqual({ time: Date.UTC(2026, 10, 21, 9, 14, 2, 500), hasDate: true });
        });

        it('reads times without dates, as the time since midnight.', () => {
            expect(timeOfLine('09:14:02.118 INFO Starting')).toEqual({ time: ((9 * 60 + 14) * 60 + 2) * 1000 + 118, hasDate: false });
        });

        it('finds no time in lines without one.', () => {
            expect(timeOfLine('    at PaymentClient.charge (src/payments/client.ts:88:13)')).toBeUndefined();
        });
    });

    describe('computeHistogram', () => {
        const log = [
            '2026-11-21 09:00:10 INFO  Starting',
            '2026-11-21 09:00:50 ERROR Charge failed',
            '    at PaymentClient.charge (src/payments/client.ts:88:13)',
            '2026-11-21 09:03:00 WARN  Slow request',
            '2026-11-21 09:05:30 DEBUG Done',
        ];
        const lineAt = (line: number) => log[line];
        const analysis = analyzeLog(log.length, lineAt, new LogLevelParser());

        it('counts the entries of each level in buckets of a readable size.', () => {
            const histogram = computeHistogram(analysis, lineAt, 10);

            // 5 min 20 s in at most 10 buckets: 1 minute each
            expect(histogram.bucketSize).toBe(60000);
            expect(histogram.buckets.length).toBe(6);
            expect(histogram.buckets[0].counts[LogLevel.Info]).toBe(1);
            expect(histogram.buckets[0].counts[LogLevel.Error]).toBe(1);
            expect(histogram.buckets[3].counts[LogLevel.Warning]).toBe(1);
            expect(histogram.buckets[5].counts[LogLevel.Debug]).toBe(1);
            expect(histogram.buckets[1].counts.every((c) => c === 0)).toBe(true);
        });

        it('has the first and last lines of each bucket, including the lines without a time.', () => {
            const histogram = computeHistogram(analysis, lineAt, 10);

            expect([histogram.buckets[0].firstLine, histogram.buckets[0].lastLine]).toEqual([0, 2]);
            expect([histogram.buckets[1].firstLine, histogram.buckets[1].lastLine]).toEqual([-1, -1]);
        });

        it('has no histogram for logs without times.', () => {
            const plain = ['INFO Starting', 'ERROR Failed'];
            expect(computeHistogram(analyzeLog(2, (l) => plain[l], new LogLevelParser()), (l) => plain[l])).toBeUndefined();
        });
    });
});
