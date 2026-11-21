'use strict';

import { analyzeLog, formatDuration } from '../../src/LogAnalysis';
import { computeFolding, defaultViewState, FoldingMode, LogViewState } from '../../src/LogFolding';
import { LogLevel, LogLevelParser } from '../../src/LogLevelParser';

const log = [
    '2026-11-21 09:14:02.118 INFO  Starting',                          // 0
    '2026-11-21 09:14:02.240 DEBUG Loaded settings',                   // 1
    '2026-11-21 09:14:02.251 DEBUG Pool size 10',                      // 2
    '2026-11-21 09:14:03.012 INFO  Listening',                         // 3
    '2026-11-21 09:15:41.503 ERROR Charge failed',                     // 4
    '    at PaymentClient.charge (src/payments/client.ts:88:13)',      // 5
    '    at OrderService.checkout (src/orders/service.ts:142:9)',      // 6
    '2026-11-21 09:15:41.611 DEBUG POST /v1/charges',                  // 7
    '2026-11-21 09:15:41.612 INFO  Order paid',                        // 8
    '2026-11-21 10:02:00.000 WARN  Slow request GET /health',          // 9
    '2026-11-21 10:02:01.000 INFO  GET /health 200',                   // 10
];
const lineAt = (line: number) => log[line];

function fold(state: Partial<LogViewState>) {
    const analysis = analyzeLog(log.length, lineAt, new LogLevelParser());
    return computeFolding(analysis, lineAt, { ...defaultViewState(), ...state });
}

describe('analyzeLog', () => {

    const analysis = analyzeLog(log.length, lineAt, new LogLevelParser());

    it('gives the lines of an entry the level of its first line.', () => {
        expect(Array.from(analysis.levels.slice(4, 8))).toEqual([LogLevel.Error, LogLevel.Error, LogLevel.Error, LogLevel.Debug]);
        expect(Array.from(analysis.entryStarts.slice(4, 8))).toEqual([1, 0, 0, 1]);
    });

    it('counts entries, not lines, of each level.', () => {
        expect(analysis.entryCounts[LogLevel.Error]).toBe(1);
        expect(analysis.entryCounts[LogLevel.Debug]).toBe(3);
        expect(analysis.entryCounts[LogLevel.Info]).toBe(4);
        expect(analysis.entryCounts[LogLevel.Warning]).toBe(1);
    });

    it('finds the first and last lines with a timestamp.', () => {
        expect(analysis.firstTimestampLine).toBe(0);
        expect(analysis.lastTimestampLine).toBe(10);
    });
});

describe('computeFolding', () => {

    it('has no ranges when nothing is hidden or folded.', () => {
        expect(fold({})).toEqual({ ranges: [], hidingRanges: [], hiddenLineCount: 0 });
    });

    it('hides runs of lines of a level, from the visible line before them.', () => {
        const folding = fold({ hiddenLevels: new Set([LogLevel.Debug]) });
        expect(folding.hidingRanges).toEqual([{ start: 0, end: 2 }, { start: 6, end: 7 }]);
        expect(folding.hiddenLineCount).toBe(3);
    });

    it('hides the whole entry, including its continuation lines.', () => {
        const folding = fold({ hiddenLevels: new Set([LogLevel.Error]) });
        expect(folding.hidingRanges).toEqual([{ start: 3, end: 6 }]);
    });

    it('hides entries whose first line contains a text.', () => {
        const folding = fold({ hiddenTexts: ['GET /health'] });
        expect(folding.hidingRanges).toEqual([{ start: 8, end: 10 }]);
    });

    it('folds entries with more than one line.', () => {
        expect(fold({ foldingMode: FoldingMode.Entry }).ranges).toEqual([{ start: 4, end: 6 }]);
    });

    it('leaves out entry ranges that would overlap a hiding range.', () => {
        // The stack trace ends on line 6, where the range that hides the DEBUG line 7 starts
        const folding = fold({ foldingMode: FoldingMode.Entry, hiddenLevels: new Set([LogLevel.Debug]) });
        expect(folding.ranges).toEqual([{ start: 0, end: 2 }, { start: 6, end: 7 }]);
    });

    it('folds by minute and by hour, with hiding ranges nested in them.', () => {
        expect(fold({ foldingMode: FoldingMode.Minute }).ranges).toEqual([
            { start: 0, end: 3 }, { start: 4, end: 8 }, { start: 9, end: 10 },
        ]);
        // The 09 hour (lines 0-8) starts on the same line as the range that hides lines 1-2, so it's left out
        expect(fold({ foldingMode: FoldingMode.Hour, hiddenLevels: new Set([LogLevel.Debug]) }).ranges).toEqual([
            { start: 0, end: 2 }, { start: 6, end: 7 }, { start: 9, end: 10 },
        ]);
    });
});

describe('formatDuration', () => {
    it('shows the two largest units.', () => {
        expect(formatDuration((2 * 60 + 13) * 60000 + 43000)).toBe('2h, 13min');
        expect(formatDuration(45000)).toBe('45s');
        expect(formatDuration(3 * 86400000 + 5 * 3600000)).toBe('3d, 5h');
        expect(formatDuration(2 * 3600000 + 30000)).toBe('2h');
        expect(formatDuration(0)).toBe('0ms');
    });
});
