'use strict';

import { LogLevel, LogLevelParser } from '../../src/LogLevelParser';

describe('LogLevelParser', () => {

    const parser = new LogLevelParser();
    const level = (line: string) => parser.getLevel(line);

    it('finds levels written as words.', () => {
        expect(level('2026-11-21 09:14:02.118 ERROR [payments] Charge failed')).toBe(LogLevel.Error);
        expect(level('2026-11-21 09:14:02.118 WARN  [http] Slow request')).toBe(LogLevel.Warning);
        expect(level('2026-11-21 09:14:02.118 INFO  [main] Starting')).toBe(LogLevel.Info);
        expect(level('2026-11-21 09:14:02.118 DEBUG [db] Pool size 10')).toBe(LogLevel.Debug);
        expect(level('2026-11-21 09:14:02.118 TRACE [db] Query plan')).toBe(LogLevel.Trace);
    });

    it('counts the levels above error as errors, and warning as warning.', () => {
        expect(level('2026-11-21 09:14:02 FATAL Out of memory')).toBe(LogLevel.Error);
        expect(level('2026-11-21 09:14:02 CRITICAL Disk full')).toBe(LogLevel.Error);
        expect(level('Nov 21 09:14:02 SEVERE: Connection lost')).toBe(LogLevel.Error);
        expect(level('2026-11-21 09:14:02 WARNING: low disk space')).toBe(LogLevel.Warning);
    });

    it('finds java.util.logging levels (#99).', () => {
        expect(level('2026-11-21 09:14:02 FINE Cache hit')).toBe(LogLevel.Debug);
        expect(level('2026-11-21 09:14:02 FINEST Entering method')).toBe(LogLevel.Trace);
    });

    it('finds abbreviated levels in brackets, in any case.', () => {
        expect(level('[09:14:02 ERR] Charge failed')).toBe(LogLevel.Error);
        expect(level('[09:14:02] [wrn] Slow request')).toBe(LogLevel.Warning);
        expect(level('2026-11-21 09:14:02 [INF] Started')).toBe(LogLevel.Info);
        expect(level('2026-11-21 09:14:02 [DBG] Pool size 10')).toBe(LogLevel.Debug);
        expect(level('2026-11-21 09:14:02 [VRB] Query plan')).toBe(LogLevel.Trace);
        expect(level('2026-11-21 09:14:02 [FTL] Out of memory')).toBe(LogLevel.Error);
    });

    it('finds single letter levels after the timestamp, as in Android logcat.', () => {
        expect(level('11-21 09:14:02.118  4812  4830 E OrderService: Charge failed')).toBe(LogLevel.Error);
        expect(level('11-21 09:14:02.118  4812  4830 W OrderService: Slow request')).toBe(LogLevel.Warning);
        expect(level('11-21 09:14:02.118  4812  4830 D OrderService: Pool size 10')).toBe(LogLevel.Debug);
    });

    it('finds the levels of .NET console logging.', () => {
        expect(level('fail: Microsoft.AspNetCore.Server.Kestrel[13]')).toBe(LogLevel.Error);
        expect(level('warn: Microsoft.AspNetCore.HttpsPolicy[3]')).toBe(LogLevel.Warning);
        expect(level('dbug: Microsoft.Extensions.Hosting[1]')).toBe(LogLevel.Debug);
    });

    it('finds the levels of JSON and logfmt logs.', () => {
        expect(level('{"time":"2026-11-21T09:14:02Z","level":"error","msg":"Charge failed"}')).toBe(LogLevel.Error);
        expect(level('{"@t":"2026-11-21T09:14:02Z","@l":"Warning","@m":"Slow request"}')).toBe(LogLevel.Warning);
        expect(level('time=2026-11-21T09:14:02Z level=info msg="Started"')).toBe(LogLevel.Info);
        expect(level('{"severity":"DEBUG","message":"Pool size 10"}')).toBe(LogLevel.Debug);
    });

    it('finds the numeric levels of pino and bunyan.', () => {
        expect(level('{"level":50,"time":1795255442118,"msg":"Charge failed"}')).toBe(LogLevel.Error);
        expect(level('{"level":40,"time":1795255442118,"msg":"Slow request"}')).toBe(LogLevel.Warning);
        expect(level('{"level":30,"time":1795255442118,"msg":"Started"}')).toBe(LogLevel.Info);
        expect(level('{"level":20,"time":1795255442118,"msg":"Pool size 10"}')).toBe(LogLevel.Debug);
    });

    it('uses the level nearest the start of the line.', () => {
        expect(level('2026-11-21 09:14:02 INFO Retrying after Error: timeout')).toBe(LogLevel.Info);
        expect(level('2026-11-21 09:14:02 ERROR Retry INFO was lost')).toBe(LogLevel.Error);
    });

    it('finds no level in lines without one.', () => {
        expect(level('    at PaymentClient.charge (src/payments/client.ts:88:13)')).toBe(LogLevel.None);
        expect(level('2026-11-21 09:14:02 Charge failed with 0 errors')).toBe(LogLevel.None);
        expect(level('')).toBe(LogLevel.None);
    });

    it('tries rules from the settings first.', () => {
        const custom = new LogLevelParser([
            { pattern: '\\bSEV=1\\b', level: 'error' },
            { pattern: '\\bSEV=3\\b', level: 'info' },
            { pattern: '[', level: 'error' }, // Invalid, so skipped
            { pattern: 'x', level: 'unknown' }, // Unknown level, so skipped
        ]);
        expect(custom.getLevel('09:14:02 SEV=1 Charge failed')).toBe(LogLevel.Error);
        expect(custom.getLevel('09:14:02 SEV=3 Started, after an ERROR')).toBe(LogLevel.Info);
        expect(custom.getLevel('09:14:02 WARN Slow request')).toBe(LogLevel.Warning);
    });
});
