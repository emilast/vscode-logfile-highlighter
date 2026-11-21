'use strict';

import * as vscode from 'vscode';
import { LogLevel } from '../../src/LogLevelParser';
import { activateExtension, closeAllEditors, openUntitledLog, waitFor } from './helpers';

// Tests hiding and folding log lines through the extension's commands.
describe('LogOverview', () => {

    const log = [
        '2026-11-21 09:14:02.118 INFO  Starting',
        '2026-11-21 09:14:02.240 DEBUG Loaded settings',
        '2026-11-21 09:14:02.251 DEBUG Pool size 10',
        '2026-11-21 09:14:03.012 INFO  Listening',
        '2026-11-21 09:15:41.503 ERROR Charge failed',
        '    at PaymentClient.charge (src/payments/client.ts:88:13)',
        '2026-11-21 09:15:41.611 DEBUG POST /v1/charges',
        '2026-11-21 09:15:41.612 INFO  Order paid',
    ].join('\n');

    beforeAll(async () => {
        await activateExtension();
    });

    beforeEach(async () => {
        await closeAllEditors();
    });

    /** Whether a line is shown, i.e. not inside a folded range. */
    function isVisible(editor: vscode.TextEditor, line: number): boolean {
        return editor.visibleRanges.some((r) => r.start.line <= line && line <= r.end.line);
    }

    it('hides the lines of a level by folding them, and shows them again.', async () => {
        const editor = await openUntitledLog(log);

        await vscode.commands.executeCommand('logFileHighlighter.toggleLogLevel', LogLevel.Debug);
        await waitFor(() => !isVisible(editor, 1) && !isVisible(editor, 2) && !isVisible(editor, 6), 'the DEBUG lines to be hidden');
        expect([0, 3, 4, 5, 7].every((line) => isVisible(editor, line))).toBe(true);

        await vscode.commands.executeCommand('logFileHighlighter.toggleLogLevel', LogLevel.Debug);
        await waitFor(() => [0, 1, 2, 3, 4, 5, 6, 7].every((line) => isVisible(editor, line)), 'all lines to be shown');
    });

    it('hides entries that contain a text, with their continuation lines.', async () => {
        const editor = await openUntitledLog(log);

        await vscode.commands.executeCommand('logFileHighlighter.addTextFilter', 'Charge failed');
        await waitFor(() => !isVisible(editor, 4) && !isVisible(editor, 5), 'the entry to be hidden');
        expect(isVisible(editor, 3) && isVisible(editor, 6)).toBe(true);

        await vscode.commands.executeCommand('logFileHighlighter.showAllLines');
        await waitFor(() => isVisible(editor, 4) && isVisible(editor, 5), 'the entry to be shown');
    });

    it('provides a folding range for each entry with more than one line.', async () => {
        const editor = await openUntitledLog(log);

        await vscode.commands.executeCommand('logFileHighlighter.setFoldingMode', 'entry');
        const ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>('vscode.executeFoldingRangeProvider', editor.document.uri);

        expect(ranges.map((r) => [r.start, r.end])).toContain([4, 5]);
    });

    it('goes to the next error after the cursor.', async () => {
        const editor = await openUntitledLog(log);
        editor.selection = new vscode.Selection(0, 0, 0, 0);

        await vscode.commands.executeCommand('logFileHighlighter.goToNextError');

        expect(vscode.window.activeTextEditor.selection.active.line).toBe(4);
    });
});
