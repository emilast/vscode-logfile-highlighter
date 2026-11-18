'use strict';

import * as fs from 'fs';
import * as path from 'path';

/** The `firstLine` pattern that VS Code uses to detect log files by their content. */
function firstLinePattern(): RegExp {
    // The tests run from out/test/unittest, so the package.json is three levels up.
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'package.json'), 'utf8'));
    const language = packageJson.contributes.languages.find((l: { id: string }) => l.id === 'log');
    return new RegExp(language.firstLine);
}

describe('The firstLine pattern of the log language', () => {
    const pattern = firstLinePattern();

    it('matches lines that start with a date.', () => {
        expect(pattern.test('2018-01-27 10:38:20.442 [8988] INFO  [Bootstrapper]: Hello World')).toBe(true);
        expect(pattern.test('2018-01-27T10:38:23.553Z - info: Hello World')).toBe(true);
        expect(pattern.test('2018-01-27')).toBe(true);
        expect(pattern.test('[2018-01-27 10:38:20] ERROR Something failed')).toBe(true);
        expect(pattern.test('27/01/2018 10:38:20 Hello')).toBe(true);
        expect(pattern.test('27.01.2018 10:38:20 Hello')).toBe(true);
        expect(pattern.test('01-27-2018 10:38:20 Hello')).toBe(true);
    });

    it('does not match lines that do not start with a date.', () => {
        expect(pattern.test('')).toBe(false);
        expect(pattern.test('Hello World')).toBe(false);
        expect(pattern.test('INFO 2018-01-27 10:38:20 Hello')).toBe(false);
        expect(pattern.test(' 2018-01-27 10:38:20 Hello')).toBe(false);
        expect(pattern.test('10:38:20 Hello')).toBe(false);
        expect(pattern.test('20180127 Hello')).toBe(false);
        expect(pattern.test('2018-01-270 Hello')).toBe(false);
        expect(pattern.test('1.2.3 Hello')).toBe(false);
    });
});
