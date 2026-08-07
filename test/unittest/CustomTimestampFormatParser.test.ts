'use strict';

import { CustomTimestampFormatParser, CustomTimestampFormat, ValidatedFormat } from '../../src/TimestampParsers/CustomTimestampFormatParser';

describe('CustomTimestampFormatParser', () => {
    let parser: CustomTimestampFormatParser;

    beforeEach(() => {
        parser = new CustomTimestampFormatParser();
    });

    it('should return null when no formats are set', () => {
        const result = parser.parse('2025-08-22 10:30:00');
        expect(result).toBeNull();
    });

    it('should parse timestamp with matching format', () => {
        const formats: ValidatedFormat[] = [{
            format: {
                pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}',
                format: 'YYYY-MM-DD HH:mm:ss'
            },
            regex: /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/
        }];

        parser.setFormats(formats);
        const result = parser.parse('2025-08-22 10:30:00');

        expect(result).not.toBeNull();
        expect(result?.normalizedTimestamp).toBe('2025-08-22T10:30:00.000Z');
        expect(result?.containsDate).toBe(true);
        expect(result?.match[0]).toBe('2025-08-22 10:30:00');
    });

    it('should return null for non-matching timestamp format', () => {
        const formats: ValidatedFormat[] = [{
            format: {
                pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}',
                format: 'YYYY-MM-DD HH:mm:ss'
            },
            regex: /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/
        }];

        parser.setFormats(formats);
        const result = parser.parse('22/08/2025 10:30:00');
        expect(result).toBeNull();
    });

    it('should parse with multiple formats and match the correct one', () => {
        const formats: ValidatedFormat[] = [
            {
                format: {
                    pattern: '\\d{2}/\\d{2}/\\d{4} \\d{2}:\\d{2}:\\d{2}',
                    format: 'DD/MM/YYYY HH:mm:ss'
                },
                regex: /\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/
            },
            {
                format: {
                    pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}',
                    format: 'YYYY-MM-DD HH:mm:ss'
                },
                regex: /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/
            }
        ];

        parser.setFormats(formats);
        
        const result1 = parser.parse('22/08/2025 10:30:00');
        expect(result1?.normalizedTimestamp).toBe('2025-08-22T10:30:00.000Z');
        
        const result2 = parser.parse('2025-08-22 10:30:00');
        expect(result2?.normalizedTimestamp).toBe('2025-08-22T10:30:00.000Z');
    });

    it('should return null for invalid timestamp', () => {
        const formats: ValidatedFormat[] = [{
            format: {
                pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}',
                format: 'YYYY-MM-DD HH:mm:ss'
            },
            regex: /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/
        }];

        parser.setFormats(formats);
        const result = parser.parse('2025-13-40 25:70:99');
        expect(result).toBeNull();
    });
});
