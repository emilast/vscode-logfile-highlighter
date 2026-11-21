'use strict';

import { LogAnalysis } from './LogAnalysis';
import { LogLevel } from './LogLevelParser';

/** How the log is folded, besides the hidden lines. */
export enum FoldingMode {
    Off = 'off',
    /** Each entry with more than one line, e.g. a stack trace. */
    Entry = 'entry',
    Minute = 'minute',
    Hour = 'hour',
}

/** What's shown of a log: which levels and texts are hidden, and how it's folded. */
export interface LogViewState {
    hiddenLevels: Set<LogLevel>;
    /** Entries whose first line contains one of these texts are hidden. */
    hiddenTexts: string[];
    foldingMode: FoldingMode;
}

export function defaultViewState(): LogViewState {
    return { hiddenLevels: new Set<LogLevel>(), hiddenTexts: [], foldingMode: FoldingMode.Off };
}

export function isFiltering(state: LogViewState): boolean {
    return state.hiddenLevels.size > 0 || state.hiddenTexts.length > 0;
}

export interface LineRange {
    start: number;
    end: number;
}

export interface LogFolding {
    /** The folding ranges, properly nested, for VS Code's folding range provider. */
    ranges: LineRange[];
    /**
     * The ranges that hide lines. VS Code always shows the first line of a folded range, so each one starts on the
     * visible line before the hidden ones. Hidden lines at the very start of the log stay visible.
     */
    hidingRanges: LineRange[];
    hiddenLineCount: number;
}

/** The parts of a timestamp at the start of a line that a minute or an hour is folded by. */
const minuteKey = /^\W{0,2}(\d{4}-\d{2}-\d{2}|\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{2}-\d{2})?[T\s]*(\d{1,2}):(\d{2})/;

function timeKey(text: string, mode: FoldingMode): string | undefined {
    const match = minuteKey.exec(text);
    if (!match) {
        return undefined;
    }
    return mode === FoldingMode.Hour ? `${match[1] ?? ''} ${match[2]}` : `${match[1] ?? ''} ${match[2]}:${match[3]}`;
}

/**
 * Works out which lines are hidden and the folding ranges that hide them, plus the ranges of the folding mode.
 * VS Code needs ranges that nest without overlapping, so a folding mode range that would overlap a hiding range
 * is left out: the hiding ranges matter more.
 */
export function computeFolding(analysis: LogAnalysis, lineAt: (line: number) => string, state: LogViewState): LogFolding {
    const { lineCount, levels, entryStarts } = analysis;

    // Which lines are hidden, entry by entry
    const hidden = new Uint8Array(lineCount);
    let hideEntry = false;
    let hiddenLineCount = 0;
    for (let line = 0; line < lineCount; line++) {
        if (entryStarts[line]) {
            hideEntry = state.hiddenLevels.has(levels[line]);
            if (!hideEntry && state.hiddenTexts.length > 0) {
                const text = lineAt(line);
                hideEntry = state.hiddenTexts.some((t) => t !== '' && text.includes(t));
            }
        }
        if (hideEntry) {
            hidden[line] = 1;
            hiddenLineCount++;
        }
    }

    // Each run of hidden lines becomes a range from the visible line before it
    const hidingRanges: LineRange[] = [];
    for (let line = 0; line < lineCount; line++) {
        if (!hidden[line]) {
            continue;
        }
        let end = line;
        while (end + 1 < lineCount && hidden[end + 1]) {
            end++;
        }
        const start = line > 0 ? line - 1 : 0;
        if (end > start) {
            hidingRanges.push({ start, end });
        }
        line = end;
    }

    // The ranges of the folding mode, each a block of visible or hidden lines
    const modeRanges: LineRange[] = [];
    if (state.foldingMode === FoldingMode.Entry) {
        for (let line = 0; line < lineCount; line++) {
            if (!entryStarts[line]) {
                continue;
            }
            let end = line;
            while (end + 1 < lineCount && !entryStarts[end + 1]) {
                end++;
            }
            if (end > line) {
                modeRanges.push({ start: line, end });
            }
            line = end;
        }
    } else if (state.foldingMode === FoldingMode.Minute || state.foldingMode === FoldingMode.Hour) {
        let start = -1;
        let key: string | undefined;
        for (let line = 0; line <= lineCount; line++) {
            const lineKey = line < lineCount && entryStarts[line] ? timeKey(lineAt(line), state.foldingMode) : undefined;
            if (line === lineCount || (lineKey !== undefined && lineKey !== key)) {
                if (start >= 0 && line - 1 > start) {
                    modeRanges.push({ start, end: line - 1 });
                }
                start = line;
                key = lineKey;
            }
        }
    }

    return { ranges: mergeRanges(hidingRanges, modeRanges), hidingRanges, hiddenLineCount };
}

/**
 * Adds the mode ranges that nest with the hiding ranges. Both lists are sorted and don't overlap within themselves.
 * VS Code also drops a range that starts on the same line as another one, so those are left out as well.
 */
function mergeRanges(hidingRanges: LineRange[], modeRanges: LineRange[]): LineRange[] {
    const result = hidingRanges.slice();
    let first = 0;
    for (const range of modeRanges) {
        // Skip the hiding ranges that end before this one
        while (first < hidingRanges.length && hidingRanges[first].end < range.start) {
            first++;
        }
        let fits = true;
        for (let i = first; i < hidingRanges.length && hidingRanges[i].start <= range.end; i++) {
            const hiding = hidingRanges[i];
            const nestedInside = hiding.start > range.start && hiding.end <= range.end;
            if (!nestedInside) {
                fits = false;
                break;
            }
        }
        if (fits) {
            result.push(range);
        }
    }
    return result.sort((a, b) => a.start - b.start || b.end - a.end);
}
