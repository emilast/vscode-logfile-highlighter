'use strict';
export class RegExpParts {
    /** Separator between date and time parts, either 'T' or a space */
    public static readonly DateTimeSeparator: string = '((?:T|\\b) ?)';
    
    /** Time pattern in format HH:MM:SS[.mmm] */
    public static readonly Time: string = '\\d{2}:\\d{2}(?::\\d{2}(?:[.,]\\d{3})?)?';
    
    /** Pattern for microseconds (3 digits optionally followed by one more digit)
     * NB: The 4th digit is outside the grouping and is therefore ignored since microseconds are only accurate to 6 digits. 
     */
    public static readonly Microseconds: string = '(?<microseconds>\\d{3})?\\d?';
    
    /** Optional timezone pattern (Z or ±HH:MM) */
    public static readonly TimeZone: string = '(?:Z| ?[+-]\\d{2}:\\d{2})?\\b';

}
