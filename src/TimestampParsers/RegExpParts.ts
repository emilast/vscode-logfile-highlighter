'use strict';
export class RegExpParts {
    /** Separator between date and time parts, either 'T' or a space */
    public static readonly DateTimeSeparator: string = '((?:T|\\b) ?)';
    
    /** Time pattern in format HH:MM:SS[.mmm] */
    public static readonly TimeHourMinutes: string = '\\d{2}:\\d{2}';
    public static readonly TimeHourMinutesSeconds: string = '\\d{2}:\\d{2}:\\d{2}';
    public static readonly TimeHourMinutesSecondsMilliseconds: string = '\\d{2}:\\d{2}:\\d{2}[.,]\\d{3}';

    /** Time pattern in format HHMMSS[.mmm] */
    public static readonly TimeSlim: string = '(\\d{2})(\\d{2})(?:(\\d{2}(?:[.,]\\d{3})?))?';
    
    /** Pattern for microseconds (3 digits optionally followed by one more digit)
     * NB: The 4th digit is outside the grouping and is therefore ignored since microseconds are only accurate to 6 digits. 
     */
    public static readonly Microseconds: string = '(?<microseconds>\\d{3})?\\d?';
    
    /** Optional timezone pattern (Z or ±HH:MM) */
    public static readonly TimeZone: string = '(?: ?(Z|[+-]\\d{2}:\\d{2}))?\\b';

    /** Optional timezone pattern (Z or ±HHMM) */
    public static readonly TimeZoneSlim: string = '(?:(Z)|([+-])(\\d{2})(\\d{2}))?\\b';

    /** Comprehensive time pattern supporting HH:MM, HH:MM::SS, HH:MM::SS.mmm[us], and optional timezone */
    public static readonly Time = `((${RegExpParts.TimeHourMinutesSecondsMilliseconds}${RegExpParts.Microseconds})|(${RegExpParts.TimeHourMinutesSeconds})|(${RegExpParts.TimeHourMinutes}))${RegExpParts.TimeZone}`;
}
