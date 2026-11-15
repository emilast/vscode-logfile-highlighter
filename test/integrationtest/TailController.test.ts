'use strict';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { TailController } from '../../src/TailController';
import { closeAllEditors, openUntitledLog, waitFor } from './helpers';

describe('TailController', () => {

    let testObject: TailController;
    let tempFolder: string;
    let logFile: string;
    let editor: vscode.TextEditor;

    // On Windows, a folder can't be deleted while a file in it is open or watched, so the temporary
    // folders are deleted after all tests, once the editors are closed.
    const tempFolders: string[] = [];

    afterAll(async () => {
        await closeAllEditors();
        for (const folder of tempFolders) {
            try {
                fs.rmSync(folder, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
            } catch (error) {
                console.log(`Could not delete the temporary folder ${folder}: ${error.message}`);
            }
        }
    });

    function logLines(count: number, from = 0): string {
        let text = '';
        for (let i = from; i < from + count; i++) {
            text += `2018-01-27 10:38:20.${String(i % 1000).padStart(3, '0')} [8988] INFO  [Tail]: Line ${i}\n`;
        }
        return text;
    }

    function isLastLineVisible(): boolean {
        const visibleRanges = editor.visibleRanges;
        return visibleRanges.length > 0
            && visibleRanges[visibleRanges.length - 1].end.line >= editor.document.lineCount - 1;
    }

    // Editors are closed before each test rather than after it, so that the screenshot of a failed
    // test (see screenshotReporter.ts) shows the editors as they were when it failed.
    beforeEach(async () => {
        await closeAllEditors();

        // The file is outside the workspace, and has glob characters in its name, which the file watcher must handle
        tempFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'lfh-tail-'));
        tempFolders.push(tempFolder);
        logFile = path.join(tempFolder, 'tail[1].log');
        fs.writeFileSync(logFile, logLines(5));

        const document = await vscode.workspace.openTextDocument(vscode.Uri.file(logFile));
        editor = await vscode.window.showTextDocument(document);
        await waitFor(() => isLastLineVisible(), 'the end of the file to be visible');

        testObject = new TailController();
    });

    afterEach(async () => {
        testObject.dispose();
    });

    it('activates tail mode when the end of a log file is visible.', () => {
        expect((testObject as any)._tailModeActive).toBe(true);
        expect((testObject as any)._statusBarItem.text).toBe('Log File Tail Mode');
        expect((testObject as any)._watchedUri).toBe(editor.document.uri.toString());
    });

    it('keeps its file watcher while the end of the file stays visible.', () => {
        // Arrange
        const watcher = (testObject as any)._fileSystemWatcher;
        expect(watcher).toBeDefined();

        // Act: what happens on every scroll event
        (testObject as any).checkEndOfFileVisibilityInActiveEditor();
        (testObject as any).checkEndOfFileVisibilityInActiveEditor();

        // Assert
        expect((testObject as any)._fileSystemWatcher).toBe(watcher);
    });

    it('does not register its event handlers again when the settings change.', async () => {
        // Arrange: each change of a Log File Highlighter setting re-initializes the controller
        const config = vscode.workspace.getConfiguration('logFileHighlighter');
        await config.update('enableProgressIndicator', false);
        await config.update('enableProgressIndicator', undefined);

        const editorChangedSpy = spyOn(testObject, 'editorChanged').and.callThrough();
        let activeEditorChanges = 0;
        const listener = vscode.window.onDidChangeActiveTextEditor(() => activeEditorChanges++);

        try {
            // Act
            const other = await vscode.workspace.openTextDocument({ language: 'log', content: 'other\n' });
            await vscode.window.showTextDocument(other);
            await waitFor(() => activeEditorChanges > 0, 'the active editor to change');

            // Assert: one call per event, not one per registration
            expect(editorChangedSpy.calls.count()).toBe(activeEditorChanges);
        } finally {
            listener.dispose();
        }
    });

    it('detects changes to a log file outside the workspace.', async () => {
        // Arrange
        const tailLogFileSpy = spyOn(testObject as any, 'tailLogFile').and.callThrough();

        // File watchers are started asynchronously, so give it a moment before changing the file
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Act
        fs.appendFileSync(logFile, logLines(3, 5));

        // Assert
        await waitFor(() => tailLogFileSpy.calls.count() > 0, 'the file watcher to report the change');
    });

    it('scrolls to the end when lines are added to the end of the log.', async () => {
        // Arrange: lines are added with an edit rather than by changing the file on disk, which would also
        // test that VS Code reloads the file. Detecting changes on disk is tested above.
        editor = await openUntitledLog(logLines(5));
        await waitFor(() => isLastLineVisible() && (testObject as any)._tailModeActive === true,
            'tail mode to be active for the log');

        // Act
        const edit = new vscode.WorkspaceEdit();
        edit.insert(editor.document.uri, new vscode.Position(editor.document.lineCount, 0), logLines(300, 5));
        await vscode.workspace.applyEdit(edit);

        // Assert
        expect(editor.document.lineCount).toBeGreaterThan(300);
        await waitFor(() => isLastLineVisible(), 'the editor to scroll to the end of the log');
    });

    it('is inactive when the tail mode setting is disabled.', async () => {
        const config = vscode.workspace.getConfiguration('logFileHighlighter');
        await config.update('enableTailMode', false);
        try {
            expect((testObject as any)._tailModeActive).toBe(false);
            expect((testObject as any)._fileSystemWatcher).toBeUndefined();
        } finally {
            await config.update('enableTailMode', undefined);
        }
    });
});
