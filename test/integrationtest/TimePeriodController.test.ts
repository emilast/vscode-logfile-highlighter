'use strict';

import * as vscode from 'vscode';
import { Selection } from 'vscode';
import { SelectionHelper } from '../../src/SelectionHelper';
import { TimePeriodCalculator } from '../../src/TimePeriodCalculator';
import { TimePeriodController } from '../../src/TimePeriodController';
import { TimestampParser } from '../../src/TimestampParsers/TimestampParser';
import { closeAllEditors, openTestLog, openUntitledLog, waitFor } from './helpers';

describe('TimePeriodController', () => {

    let testObject: TimePeriodController;

    function statusBarText(): string {
        return (testObject as any)._statusBarItem.text;
    }

    // Editors are closed before each test rather than after it, so that the screenshot of a failed
    // test (see screenshotReporter.ts) shows the editors as they were when it failed.
    beforeEach(async () => {
        await closeAllEditors();
        testObject = new TimePeriodController(new TimePeriodCalculator(new TimestampParser()), new SelectionHelper());
    });

    afterEach(async () => {
        testObject.dispose();
    });

    it('shows the duration of the selected log lines.', async () => {
        // Arrange: 2018-01-27 10:38:20.442 to 2018-01-27 10:38:25.459
        const editor = await openTestLog('firstLog.log');

        // Act
        editor.selection = new Selection(0, 0, 2, 10);
        testObject.updateTimePeriod();

        // Assert
        expect(statusBarText()).toBe('Selected: 5s, 17ms');
    });

    it('updates the duration when the selection changes.', async () => {
        // Arrange
        const editor = await openTestLog('firstLog.log');

        // Act
        editor.selection = new Selection(0, 0, 1, 10);

        // Assert
        await waitFor(() => statusBarText() === 'Selected: 1ms', 'the status bar to show the selected duration');
    });

    it('shows no duration when the selected lines have no timestamps.', async () => {
        // Arrange
        const editor = await openUntitledLog('first line\nsecond line\n');

        // Act
        editor.selection = new Selection(0, 0, 1, 5);
        testObject.updateTimePeriod();

        // Assert
        expect(statusBarText()).toBe('');
    });

    it('shows no duration, and does not throw, when only one of the lines has a date (#744).', async () => {
        // Arrange
        const editor = await openUntitledLog('2025-08-15 12:24:16.047123 first line\n    took 00:00:05\n');

        // Act
        editor.selection = new Selection(0, 0, 1, 5);

        // Assert
        expect(() => testObject.updateTimePeriod()).not.toThrow();
        expect(statusBarText()).toBe('');
    });
});
