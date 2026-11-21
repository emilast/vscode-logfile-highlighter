'use strict';

import { LogAnalysis } from './LogAnalysis';
import { LogLevel } from './LogLevelParser';

export interface HistogramBucket {
    /** The start of the bucket, in milliseconds (since 1970, or since midnight for logs with times only). */
    start: number;
    /** The number of entries of each level, indexed by LogLevel. */
    counts: number[];
    /** The first and last lines of the entries in the bucket. */
    firstLine: number;
    lastLine: number;
}

export interface Histogram {
    buckets: HistogramBucket[];
    /** The length of each bucket in milliseconds. */
    bucketSize: number;
    /** Whether the times have dates, so labels should show them when the log spans several days. */
    hasDates: boolean;
}

const dateTime = /(\d{4})-(\d{2})-(\d{2})[T\s]+(\d{1,2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,3}))?)?/;
const timeOnly = /(\d{1,2}):(\d{2}):(\d{2})(?:[.,](\d{1,3}))?/;

/**
 * The time of a log line in milliseconds, from an ISO-like date and time, or a time only. Cheaper than the
 * TimestampParser, which matters for the many lines of a big log.
 */
export function timeOfLine(text: string): { time: number; hasDate: boolean } | undefined {
    const head = text.length > 80 ? text.substr(0, 80) : text;
    let m = dateTime.exec(head);
    if (m) {
        const time = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0), +((m[7] ?? '0') + '00').substr(0, 3));
        return isNaN(time) ? undefined : { time, hasDate: true };
    }
    m = timeOnly.exec(head);
    if (m) {
        return { time: ((+m[1] * 60 + +m[2]) * 60 + +m[3]) * 1000 + +((m[4] ?? '0') + '00').substr(0, 3), hasDate: false };
    }
    return undefined;
}

/** Bucket sizes that give readable labels, from a second to a day. */
const bucketSizes = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 10800, 21600, 43200, 86400].map((s) => s * 1000);

/**
 * Counts the entries of each level over time, in at most maxBuckets buckets of a readable size. Entries without a
 * time are counted with the entry before them. Each entry goes in the bucket of its time, even if the times in the
 * log go backwards, so a bucket's first and last lines are where its entries start and end in the file.
 */
export function computeHistogram(analysis: LogAnalysis, lineAt: (line: number) => string, maxBuckets = 60): Histogram | undefined {
    const times: number[] = [];
    const lines: number[] = [];
    let hasDates = false;
    for (let line = 0; line < analysis.lineCount; line++) {
        if (!analysis.entryStarts[line]) {
            continue;
        }
        const t = timeOfLine(lineAt(line));
        if (t) {
            times.push(t.time);
            lines.push(line);
            hasDates = hasDates || t.hasDate;
        }
    }
    if (times.length < 2) {
        return undefined;
    }

    let min = times[0];
    let max = times[0];
    for (const t of times) {
        min = Math.min(min, t);
        max = Math.max(max, t);
    }
    const span = Math.max(max - min, 1);
    const bucketSize = bucketSizes.find((s) => span / s < maxBuckets) ?? Math.ceil(span / maxBuckets / 86400000) * 86400000;
    const first = Math.floor(min / bucketSize) * bucketSize;
    const count = Math.floor((max - first) / bucketSize) + 1;
    const buckets: HistogramBucket[] = [];
    for (let i = 0; i < count; i++) {
        buckets.push({ start: first + i * bucketSize, counts: [0, 0, 0, 0, 0, 0], firstLine: -1, lastLine: -1 });
    }

    // Each entry with a time goes in its bucket, with the entries without a time after it
    for (let i = 0; i < times.length; i++) {
        const bucket = buckets[Math.floor((times[i] - first) / bucketSize)];
        const end = i + 1 < lines.length ? lines[i + 1] : analysis.lineCount;
        for (let line = lines[i]; line < end; line++) {
            if (analysis.entryStarts[line]) {
                bucket.counts[analysis.levels[line] as LogLevel]++;
            }
        }
        if (bucket.firstLine < 0) {
            bucket.firstLine = lines[i];
        }
        bucket.lastLine = end - 1;
    }
    return { buckets, bucketSize, hasDates };
}
