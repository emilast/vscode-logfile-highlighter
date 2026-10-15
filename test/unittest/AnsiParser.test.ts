'use strict';

import { convert256Color, parseAnsi } from '../../src/AnsiParser';

describe('AnsiParser', () => {
    describe('parseAnsi', () => {
        it('returns nothing for text without escape codes.', () => {
            // Act
            const result = parseAnsi('2024-09-10 INFO plain text\nanother line');

            // Assert
            expect(result.styled).toEqual([]);
            expect(result.escapes).toEqual([]);
        });

        it('styles text between a color code and a reset.', () => {
            // Arrange
            const text = '2024-09-10T05:49:11.0369141Z \x1b[33;1mVERBOSE: Exporting function.\x1b[0m';

            // Act
            const result = parseAnsi(text);

            // Assert
            expect(result.escapes).toEqual([
                { line: 0, start: 29, end: 36 },
                { line: 0, start: 64, end: 68 }
            ]);
            expect(result.styled.length).toBe(1);
            expect(result.styled[0].line).toBe(0);
            expect(result.styled[0].start).toBe(36);
            expect(result.styled[0].end).toBe(64);
            expect(result.styled[0].style.foreground).toBe(3);
            expect(result.styled[0].style.bold).toBe(true);
        });

        it('handles bright foreground and background colors.', () => {
            // Act
            const result = parseAnsi('\x1b[91;104mtext');

            // Assert
            expect(result.styled[0].style.foreground).toBe(9);
            expect(result.styled[0].style.background).toBe(12);
        });

        it('treats an empty SGR sequence as reset.', () => {
            // Act
            const result = parseAnsi('\x1b[31mred\x1b[mplain');

            // Assert
            expect(result.styled.length).toBe(1);
            expect(result.styled[0].end).toBe(8);
        });

        it('creates a new segment when the style changes.', () => {
            // Act
            const result = parseAnsi('\x1b[31mred\x1b[1mbold red\x1b[39mbold');

            // Assert
            expect(result.styled.map((s) => [s.start, s.end])).toEqual([[5, 8], [12, 20], [25, 29]]);
            expect(result.styled[0].style).toEqual(jasmine.objectContaining({ foreground: 1, bold: false }));
            expect(result.styled[1].style).toEqual(jasmine.objectContaining({ foreground: 1, bold: true }));
            expect(result.styled[2].style).toEqual(jasmine.objectContaining({ foreground: undefined, bold: true }));
            expect(result.styled[0].styleKey).not.toBe(result.styled[1].styleKey);
        });

        it('turns off individual attributes.', () => {
            // Act
            const result = parseAnsi('\x1b[1;2;3;4;7;9ma\x1b[22;23;24;27;29mb');

            // Assert
            expect(result.styled[0].style).toEqual(jasmine.objectContaining(
                { bold: true, dim: true, italic: true, underline: true, inverse: true, strikethrough: true }));
            expect(result.styled.length).toBe(1);
        });

        it('carries the style over to following lines.', () => {
            // Act
            const result = parseAnsi('\x1b[32mfirst\r\nsecond\nthird\x1b[0m\nfourth');

            // Assert
            expect(result.styled.map((s) => [s.line, s.start, s.end])).toEqual([[0, 5, 10], [1, 0, 6], [2, 0, 5]]);
        });

        it('handles 256 color codes.', () => {
            // Act
            const result = parseAnsi('\x1b[38;5;208;48;5;4mtext');

            // Assert
            expect(result.styled[0].style.foreground).toBe('#ff8700');
            expect(result.styled[0].style.background).toBe(4);
        });

        it('handles truecolor codes, separated by semicolons or colons.', () => {
            // Act
            const result = parseAnsi('\x1b[38;2;255;0;128;1ma\x1b[48:2::1:2:3mb');

            // Assert
            expect(result.styled[0].style.foreground).toBe('#ff0080');
            expect(result.styled[0].style.bold).toBe(true);
            expect(result.styled[1].style.background).toBe('#010203');
        });

        it('reports non-SGR sequences as escapes without changing the style.', () => {
            // Act
            const result = parseAnsi('\x1b[31mred\x1b[2Kstill red');

            // Assert
            expect(result.escapes.length).toBe(2);
            expect(result.styled.map((s) => [s.start, s.end])).toEqual([[5, 8], [12, 21]]);
            expect(result.styled[1].style.foreground).toBe(1);
        });

        it('ignores unterminated sequences.', () => {
            // Act
            const result = parseAnsi('text \x1b[31');

            // Assert
            expect(result.escapes).toEqual([]);
            expect(result.styled).toEqual([]);
        });
    });

    describe('convert256Color', () => {
        it('keeps the basic colors as indexes.', () => {
            expect(convert256Color(0)).toBe(0);
            expect(convert256Color(15)).toBe(15);
        });

        it('converts the color cube.', () => {
            expect(convert256Color(16)).toBe('#000000');
            expect(convert256Color(196)).toBe('#ff0000');
            expect(convert256Color(231)).toBe('#ffffff');
        });

        it('converts the grayscale ramp.', () => {
            expect(convert256Color(232)).toBe('#080808');
            expect(convert256Color(255)).toBe('#eeeeee');
        });
    });
});
