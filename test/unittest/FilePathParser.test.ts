'use strict';

import { findFilePaths, isAbsolutePath } from '../../src/FilePathParser';

describe('FilePathParser', () => {

    /** The matched text, path, line and column of each path in the text. */
    function find(text: string) {
        return findFilePaths(text).map((m) => ({
            text: text.substr(m.index, m.length), path: m.path, line: m.line, column: m.column
        }));
    }

    describe('findFilePaths', () => {
        it('finds a Windows path with a line number (#502).', () => {
            expect(find('ERROR Failed at D:\\path\\to\\file\\file_name.ext:42')).toEqual([
                { text: 'D:\\path\\to\\file\\file_name.ext:42', path: 'D:\\path\\to\\file\\file_name.ext', line: 42, column: undefined }
            ]);
        });

        it('finds a Linux path with a line and a column.', () => {
            expect(find('Failed at /home/me/app/src/server.ts:42:7.')).toEqual([
                { text: '/home/me/app/src/server.ts:42:7', path: '/home/me/app/src/server.ts', line: 42, column: 7 }
            ]);
        });

        it('finds a network path with a line and a column in parentheses.', () => {
            expect(find('\\\\server\\share\\Orders\\Program.cs(12,3): error CS1002')).toEqual([
                { text: '\\\\server\\share\\Orders\\Program.cs(12,3)', path: '\\\\server\\share\\Orders\\Program.cs', line: 12, column: 3 }
            ]);
        });

        it('finds a path with a line in parentheses.', () => {
            expect(find('src/Program.cs(12): warning')).toEqual([
                { text: 'src/Program.cs(12)', path: 'src/Program.cs', line: 12, column: undefined }
            ]);
        });

        it('finds the path in a .NET stack trace.', () => {
            expect(find('   at Orders.PaymentService.Charge() in C:\\src\\Orders\\PaymentService.cs:line 87')).toEqual([
                { text: 'C:\\src\\Orders\\PaymentService.cs:line 87', path: 'C:\\src\\Orders\\PaymentService.cs', line: 87, column: undefined }
            ]);
        });

        it('finds the path in a Python stack trace.', () => {
            expect(find('  File "/app/orders/payments.py", line 42, in charge')).toEqual([
                { text: '/app/orders/payments.py", line 42', path: '/app/orders/payments.py', line: 42, column: undefined }
            ]);
        });

        it('finds relative paths without a line number.', () => {
            expect(find('see src/app.ts and ./run.sh or ../lib/x.py')).toEqual([
                { text: 'src/app.ts', path: 'src/app.ts', line: undefined, column: undefined },
                { text: './run.sh', path: './run.sh', line: undefined, column: undefined },
                { text: '../lib/x.py', path: '../lib/x.py', line: undefined, column: undefined },
            ]);
        });

        it('finds paths on several lines, with their positions in the whole text.', () => {
            const text = 'first src/a.ts:1\nsecond src/b.ts:2\n';

            const result = findFilePaths(text);

            expect(result.map((m) => m.index)).toEqual([6, 24]);
            expect(result.map((m) => m.line)).toEqual([1, 2]);
        });

        it('ignores paths that are part of a URL.', () => {
            expect(find('See file:///tmp/src/app.ts#L20 and https://example.com/docs/page.html now')).toEqual([]);
        });

        it('ignores file names without a folder.', () => {
            expect(find('Program.cs:42 failed')).toEqual([]);
        });

        it('ignores text that only looks a bit like a path.', () => {
            expect(find('GET /orders/7f3c2a9e returned 200 in 12.5 ms, version 4.0.2, at 10:24:19.842')).toEqual([]);
        });

        it('does not include a period at the end of a sentence.', () => {
            expect(find('Wrote a/b.txt.')).toEqual([
                { text: 'a/b.txt', path: 'a/b.txt', line: undefined, column: undefined }
            ]);
        });

        it('does not start a path in the middle of a word.', () => {
            expect(find('XD:\\folder\\a.ts')).toEqual([]);
        });

        it('ignores a line number of 0.', () => {
            expect(find('src/app.ts:0')[0].line).toBeUndefined();
        });
    });

    describe('isAbsolutePath', () => {
        it('recognizes absolute Windows, network and Linux paths.', () => {
            expect(isAbsolutePath('C:\\src\\a.cs')).toBe(true);
            expect(isAbsolutePath('c:/src/a.cs')).toBe(true);
            expect(isAbsolutePath('\\\\server\\share\\a.cs')).toBe(true);
            expect(isAbsolutePath('/home/me/a.ts')).toBe(true);
        });

        it('recognizes relative paths.', () => {
            expect(isAbsolutePath('src/a.ts')).toBe(false);
            expect(isAbsolutePath('./a.ts')).toBe(false);
            expect(isAbsolutePath('..\\a.cs')).toBe(false);
        });
    });
});
