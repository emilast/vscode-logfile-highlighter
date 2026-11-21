'use strict';

import { LogLevel, LogLevelParser } from './LogLevelParser';

/**
 * A log split into entries, with the level of each line. An entry is a line with a timestamp or a level, plus the
 * lines after it that have neither, like a stack trace or a multi-line message. The lines of an entry have the
 * entry's level, so hiding DEBUG also hides the rest of a DEBUG message.
 */
export interface LogAnalysis {
    lineCount: number;
    /** The level of each line, from its entry. */
    levels: Uint8Array;
    /** 1 for the first line of an entry, 0 for the lines that continue it. */
    entryStarts: Uint8Array;
    /** The number of entries of each level, indexed by LogLevel. */
    entryCounts: number[];
    /** The first and last lines that start with a timestamp, for the time span of the log. */
    firstTimestampLine: number;
    lastTimestampLine: number;
}

/** Recognizes a timestamp at the start of a line, cheaply: a date (2026-11-21, 21.11.2026, 11/21/2026) or a time (09:14:02). */
const startsWithTimestamp = /^\W{0,2}(\d{4}-\d{2}-\d{2}|\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{1,2}:\d{2}(:\d{2})?|\d{2}-\d{2}\s+\d{1,2}:\d{2})/;

export function lineStartsWithTimestamp(text: string): boolean {
    return startsWithTimestamp.test(text);
}

export function analyzeLog(lineCount: number, lineAt: (line: number) => string, parser: LogLevelParser): LogAnalysis {
    const levels = new Uint8Array(lineCount);
    const entryStarts = new Uint8Array(lineCount);
    const entryCounts = [0, 0, 0, 0, 0, 0];
    let firstTimestampLine = -1;
    let lastTimestampLine = -1;
    let entryLevel = LogLevel.None;

    for (let line = 0; line < lineCount; line++) {
        const text = lineAt(line);
        const hasTimestamp = lineStartsWithTimestamp(text);
        const level = parser.getLevel(text);

        if (hasTimestamp) {
            if (firstTimestampLine < 0) {
                firstTimestampLine = line;
            }
            lastTimestampLine = line;
        }

        // A line with a timestamp or a level starts an entry. So does the first line, and an empty line ends one.
        if (hasTimestamp || level !== LogLevel.None || line === 0 || text.trim() === '') {
            entryStarts[line] = 1;
            entryLevel = level;
            if (text.trim() !== '') {
                entryCounts[level]++;
            }
        }
        levels[line] = entryLevel;
    }

    return { lineCount, levels, entryStarts, entryCounts, firstTimestampLine, lastTimestampLine };
}

/** E.g. "2h, 13min" or "45s", like the time period in the status bar, with the two largest units. */
export function formatDuration(milliseconds: number): string {
    const units: [string, number][] = [['d', 86400000], ['h', 3600000], ['min', 60000], ['s', 1000], ['ms', 1]];
    const parts: string[] = [];
    let rest = Math.max(0, Math.round(milliseconds));
    for (const [name, size] of units) {
        const value = Math.floor(rest / size);
        rest -= value * size;
        if (value > 0 || parts.length > 0) {
            parts.push(`${value}${name}`);
        }
        if (parts.length === 2) {
            break;
        }
    }
    return parts.length > 0 ? parts.filter((p, i) => i === 0 || !p.startsWith('0')).join(', ') : '0ms';
}
