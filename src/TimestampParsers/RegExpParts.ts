'use strict';
export class RegExpParts {
    public static readonly DateTimeSeparator: string = '((?:T|\\b) ?)';
    public static readonly Time: string = '\\d{2}:\\d{2}(?::\\d{2}(?:[.,]\\d{3})?)?';
    public static readonly Microseconds: string = '(?<microseconds>\\d{3})?';
    public static readonly TimeZone: string = '(?:Z| ?[+-]\\d{2}:\\d{2})?\\b';
}
