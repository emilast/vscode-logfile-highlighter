'use strict';

/**
 * The severity of a log line, whatever way the log writes it: `ERROR`, `[E]`, `E/Tag:`, `fail:`,
 * `"level":"error"`, `"level":50`, `SEVERE` and so on all become {@link LogLevel.Error}.
 */
export enum LogLevel {
    None = 0,
    Trace = 1,
    Debug = 2,
    Info = 3,
    Warning = 4,
    Error = 5,
}

/** The levels from the most to the least severe, e.g. for menus. */
export const AllLogLevels: LogLevel[] = [LogLevel.Error, LogLevel.Warning, LogLevel.Info, LogLevel.Debug, LogLevel.Trace, LogLevel.None];

/** The names shown for each level. */
export function logLevelName(level: LogLevel): string {
    switch (level) {
        case LogLevel.Error: return 'ERROR';
        case LogLevel.Warning: return 'WARN';
        case LogLevel.Info: return 'INFO';
        case LogLevel.Debug: return 'DEBUG';
        case LogLevel.Trace: return 'TRACE';
        default: return 'No level';
    }
}

/** The level for a name in a setting, such as "error" or "warning". */
export function parseLogLevelName(name: string): LogLevel | undefined {
    return levelOfWord(name);
}

/** A user-defined rule from the logFileHighlighter.logLevels setting. */
export interface LogLevelRule {
    /** A regular expression. Where it matches on a line, the line has the rule's level. */
    pattern: string;
    /** error, warning, info, debug or trace. */
    level: string;
}

interface Rule {
    regex: RegExp;
    /** The level, or undefined when the level is read from the word in the capture group. */
    level?: LogLevel;
    /** The capture group with the level word; its position is where the level is on the line. */
    group: number;
}

/** Words that name a level, in the forms they're written in logs, in lower case. */
const levelWords: { [word: string]: LogLevel } = {
    // Error, including the levels above it
    error: LogLevel.Error, err: LogLevel.Error, eror: LogLevel.Error, er: LogLevel.Error, e: LogLevel.Error,
    fatal: LogLevel.Error, fatl: LogLevel.Error, ftl: LogLevel.Error, fa: LogLevel.Error, f: LogLevel.Error,
    critical: LogLevel.Error, crit: LogLevel.Error, crt: LogLevel.Error, alert: LogLevel.Error,
    emergency: LogLevel.Error, emerg: LogLevel.Error, severe: LogLevel.Error, fail: LogLevel.Error, failure: LogLevel.Error,
    // Warning
    warning: LogLevel.Warning, warn: LogLevel.Warning, wrn: LogLevel.Warning, wn: LogLevel.Warning, w: LogLevel.Warning,
    // Info
    information: LogLevel.Info, info: LogLevel.Info, inf: LogLevel.Info, in: LogLevel.Info, i: LogLevel.Info,
    notice: LogLevel.Info, hint: LogLevel.Info,
    // Debug
    debug: LogLevel.Debug, dbug: LogLevel.Debug, dbg: LogLevel.Debug, de: LogLevel.Debug, d: LogLevel.Debug, fine: LogLevel.Debug,
    // Trace
    trace: LogLevel.Trace, trce: LogLevel.Trace, trc: LogLevel.Trace, verbose: LogLevel.Trace, verb: LogLevel.Trace,
    vrb: LogLevel.Trace, vb: LogLevel.Trace, v: LogLevel.Trace, finer: LogLevel.Trace, finest: LogLevel.Trace,
};

function levelOfWord(word: string): LogLevel | undefined {
    return Object.prototype.hasOwnProperty.call(levelWords, word.toLowerCase()) ? levelWords[word.toLowerCase()] : undefined;
}

/** The numeric levels of pino and bunyan JSON logs. */
function levelOfNumber(value: number): LogLevel | undefined {
    if (value >= 50) { return LogLevel.Error; }
    if (value >= 40) { return LogLevel.Warning; }
    if (value >= 30) { return LogLevel.Info; }
    if (value >= 20) { return LogLevel.Debug; }
    if (value >= 10) { return LogLevel.Trace; }
    return undefined;
}

// The same words that syntaxes/log.tmLanguage highlights, so that what's counted and filtered matches the colors,
// plus structured logs and a few more formats.
const defaultRules: Rule[] = [
    // Words in capitals or with a capital first letter: ERROR, Error, WARN, Info, FATAL, SEVERE, FINEST...
    { regex: /\b(ALERT|CRITICAL|EMERGENCY|ERROR|FAILURE|FAIL|Fatal|FATAL|Error|EE|SEVERE)\b/, level: LogLevel.Error, group: 1 },
    { regex: /\b(WARNING|WARN|Warn|WW)\b/, level: LogLevel.Warning, group: 1 },
    { regex: /\b(HINT|INFO|INFORMATION|Info|NOTICE|II)\b/, level: LogLevel.Info, group: 1 },
    { regex: /\b(DEBUG|Debug|FINE)\b/, level: LogLevel.Debug, group: 1 },
    { regex: /\b([Tt]race|TRACE|VERBOSE|Verbose|FINER|FINEST)\b/, level: LogLevel.Trace, group: 1 },
    // Any case with a colon: error:, warning:, info:, debug:
    { regex: /\b(error|warning|info|information|debug)\:/i, group: 1 },
    // In brackets: [ERR], [wrn], [I], [Fatal]...
    { regex: /\[(error|eror|err|er|e|fatal|fatl|ftl|fa|f|warning|warn|wrn|wn|w|information|info|inf|in|i|debug|dbug|dbg|de|d|verbose|verb|vrb|vb|v|trace|trce|trc)\]/i, group: 1 },
    // Abbreviations in capitals, as in Serilog's "[09:14:02 ERR] ...": ERR, WRN, INF, DBG, VRB, FTL...
    { regex: /\b(ERR|EROR|FTL|FATL|CRIT|CRT|WRN|INF|DBG|DBUG|VRB|TRC|TRCE)\b/, group: 1 },
    // A single letter after the timestamp, as in Android logcat: "11-21 09:14:02.118  4812  4830 E OrderService: ..."
    { regex: /^[\s\d.:,\-\/\[\]()|T+Z]*\b([VDIWEF])\b/, group: 1 },
    // .NET console logging: "fail: Microsoft.AspNetCore...", "warn: ...", "dbug: ..."
    { regex: /^\s*(crit|fail|warn|info|dbug|trce):/, group: 1 },
    // JSON and logfmt: "level":"error", level=warn, "severity": "INFO", "@l":"Warning" (Serilog)
    { regex: /["']?(?:level|severity|lvl|loglevel|log\.level|@l)["']?\s*[:=]\s*["']?([A-Za-z]+)\b/i, group: 1 },
];

// pino and bunyan: "level":50
const numericLevelRule = /["']?level["']?\s*:\s*(\d{2})\b/;

/**
 * Finds the level of log lines. The level nearest the start of the line wins, since that's where log formats put
 * it, so that e.g. "INFO Retrying after error: timeout" is an info line. Rules from the logFileHighlighter.logLevels
 * setting are tried first, so they can handle formats the built-in rules don't know.
 */
export class LogLevelParser {

    private customRules: Rule[] = [];

    constructor(customRules: LogLevelRule[] = []) {
        for (const rule of customRules) {
            const level = levelOfWord(rule.level ?? '');
            if (level === undefined || !rule.pattern) {
                continue;
            }
            try {
                this.customRules.push({ regex: new RegExp(rule.pattern), level, group: 0 });
            } catch {
                // An invalid regular expression in the settings is skipped
            }
        }
    }

    public getLevel(line: string): LogLevel {
        if (this.customRules.length > 0) {
            const custom = this.earliest(this.customRules, line);
            if (custom !== LogLevel.None) {
                return custom;
            }
        }
        const level = this.earliest(defaultRules, line);
        if (level !== LogLevel.None) {
            return level;
        }
        const numeric = numericLevelRule.exec(line);
        return numeric ? levelOfNumber(parseInt(numeric[1], 10)) ?? LogLevel.None : LogLevel.None;
    }

    private earliest(rules: Rule[], line: string): LogLevel {
        let bestIndex = Number.MAX_SAFE_INTEGER;
        let bestLevel = LogLevel.None;
        for (const rule of rules) {
            const match = rule.regex.exec(line);
            if (!match) {
                continue;
            }
            const word = match[rule.group];
            const index = match.index + match[0].indexOf(word);
            if (index >= bestIndex) {
                continue;
            }
            const level = rule.level ?? levelOfWord(word);
            if (level !== undefined) {
                bestIndex = index;
                bestLevel = level;
            }
        }
        return bestLevel;
    }
}
