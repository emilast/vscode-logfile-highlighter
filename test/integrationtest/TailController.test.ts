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

    function isLastLineVisible(textEditor: vscode.TextEditor = editor): boolean {
        const visibleRanges = textEditor.visibleRanges;
        return visibleRanges.length > 0
            && visibleRanges[visibleRanges.length - 1].end.line >= textEditor.document.lineCount - 1;
    }

    /** Whether the controller follows the document in at least one editor. */
    function isFollowing(document: vscode.TextDocument): boolean {
        const tailingEditors: Set<vscode.TextEditor> = (testObject as any)._tailingEditors;
        return Array.from(tailingEditors).some((e) => e.document === document);
    }

    function fileWatchers(): Map<string, vscode.FileSystemWatcher> {
        return (testObject as any)._fileWatchers;
    }

    async function appendLines(textEditor: vscode.TextEditor, count: number) {
        const document = textEditor.document;
        const edit = new vscode.WorkspaceEdit();
        edit.insert(document.uri, new vscode.Position(document.lineCount, 0), logLines(count, document.lineCount));
        await vscode.workspace.applyEdit(edit);
    }

    /** Opens an unsaved log in the given editor group and waits until the controller follows it. */
    async function openFollowedLog(viewColumn: vscode.ViewColumn): Promise<vscode.TextEditor> {
        const document = await vscode.workspace.openTextDocument({ language: 'log', content: logLines(5) });
        const textEditor = await vscode.window.showTextDocument(document, viewColumn);
        await waitFor(() => isLastLineVisible(textEditor) && isFollowing(document), 'tail mode to be active for the log');
        return textEditor;
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
        expect(isFollowing(editor.document)).toBe(true);
        expect((testObject as any)._statusBarItem.text).toBe('Log File Tail Mode');
        expect(Array.from(fileWatchers().keys())).toEqual([editor.document.uri.toString()]);
    });

    it('keeps its file watcher while the end of the file stays visible.', () => {
        // Arrange
        const watcher = fileWatchers().get(editor.document.uri.toString());
        expect(watcher).toBeDefined();

        // Act: what happens on every scroll event
        (testObject as any).onVisibleRangesChanged(editor);
        (testObject as any).onVisibleRangesChanged(editor);

        // Assert
        expect(fileWatchers().get(editor.document.uri.toString())).toBe(watcher);
    });

    it('does not register its event handlers again when the settings change.', async () => {
        // Arrange: each change of a Log File Highlighter setting re-initializes the controller
        const config = vscode.workspace.getConfiguration('logFileHighlighter');
        await config.update('enableProgressIndicator', false);
        await config.update('enableProgressIndicator', undefined);

        const handlerSpy = spyOn(testObject as any, 'onVisibleEditorsChanged').and.callThrough();
        let visibleEditorChanges = 0;
        const listener = vscode.window.onDidChangeVisibleTextEditors(() => visibleEditorChanges++);

        try {
            // Act
            const other = await vscode.workspace.openTextDocument({ language: 'log', content: 'other\n' });
            await vscode.window.showTextDocument(other);
            await waitFor(() => visibleEditorChanges > 0, 'the visible editors to change');

            // Assert: one call per event, not one per registration
            expect(handlerSpy.calls.count()).toBe(visibleEditorChanges);
        } finally {
            listener.dispose();
        }
    });

    it('detects changes to a log file outside the workspace.', async () => {
        // Arrange
        const fileChangedSpy = spyOn(testObject as any, 'onFileChanged').and.callThrough();

        // File watchers are started asynchronously, so give it a moment before changing the file
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Act
        fs.appendFileSync(logFile, logLines(3, 5));

        // Assert
        await waitFor(() => fileChangedSpy.calls.count() > 0, 'the file watcher to report the change');
    });

    it('scrolls to the end when lines are added to the end of the log.', async () => {
        // Arrange: lines are added with an edit rather than by changing the file on disk, which would also
        // test that VS Code reloads the file. Detecting changes on disk is tested above.
        editor = await openFollowedLog(vscode.ViewColumn.Active);

        // Act
        await appendLines(editor, 300);

        // Assert
        expect(editor.document.lineCount).toBeGreaterThan(300);
        await waitFor(() => isLastLineVisible(), 'the editor to scroll to the end of the log');
    });

    it('scrolls a log that is visible but not in the active editor (#688).', async () => {
        // Arrange: the log is in one editor group, and another editor beside it is active
        const logEditor = await openFollowedLog(vscode.ViewColumn.One);
        const otherEditor = await vscode.window.showTextDocument(
            await vscode.workspace.openTextDocument({ language: 'log', content: 'other\n' }), vscode.ViewColumn.Two);
        expect(vscode.window.activeTextEditor).toBe(otherEditor);

        // Act
        await appendLines(logEditor, 300);

        // Assert
        await waitFor(() => isLastLineVisible(logEditor), 'the inactive editor to scroll to the end of the log');
        expect(vscode.window.activeTextEditor).toBe(otherEditor);
    });

    it('scrolls a log in a floating window that is not the active editor (#688).', async () => {
        // Arrange: move the log to a new window. VS Code creates a new editor object for it there.
        const document = (await openFollowedLog(vscode.ViewColumn.Active)).document;
        await vscode.commands.executeCommand('workbench.action.moveEditorToNewWindow');
        const floatingEditor = () => vscode.window.visibleTextEditors.find((e) => e.document === document);
        await waitFor(() => floatingEditor() !== undefined && isFollowing(document), 'the floating editor to be followed');

        // Make another editor active, beside the log in the floating window. Focus can't be moved back to the
        // main window in the tests, since they run without a window manager.
        const otherEditor = await vscode.window.showTextDocument(
            await vscode.workspace.openTextDocument({ language: 'log', content: 'other\n' }), vscode.ViewColumn.Beside);
        await waitFor(() => vscode.window.activeTextEditor === otherEditor, 'the other editor to be active');
        expect(floatingEditor()).toBeDefined();

        // Act
        await appendLines(floatingEditor()!, 300);

        // Assert
        await waitFor(() => isLastLineVisible(floatingEditor()!), 'the floating editor to scroll to the end of the log');
        expect(vscode.window.activeTextEditor).toBe(otherEditor);
    });

    it('follows several logs at the same time.', async () => {
        // Arrange
        const first = await openFollowedLog(vscode.ViewColumn.One);
        const second = await openFollowedLog(vscode.ViewColumn.Two);

        // Act
        await appendLines(first, 300);
        await appendLines(second, 300);

        // Assert
        await waitFor(() => isLastLineVisible(first) && isLastLineVisible(second), 'both editors to scroll to the end');
    });

    it('stops following a log when its editor is scrolled up.', async () => {
        // Arrange: a log that is longer than the editor, scrolled to the top
        editor = await openFollowedLog(vscode.ViewColumn.Active);
        await appendLines(editor, 300);
        await waitFor(() => isLastLineVisible(), 'the editor to scroll to the end of the log');
        editor.revealRange(new vscode.Range(0, 0, 0, 0), vscode.TextEditorRevealType.AtTop);
        await waitFor(() => !isFollowing(editor.document), 'tail mode to stop for the log');

        // Act
        await appendLines(editor, 300);
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Assert
        expect(isLastLineVisible()).toBe(false);
        expect(editor.visibleRanges[0].start.line).toBe(0);
    });

    it('is inactive when the tail mode setting is disabled.', async () => {
        const config = vscode.workspace.getConfiguration('logFileHighlighter');
        await config.update('enableTailMode', false);
        try {
            expect(isFollowing(editor.document)).toBe(false);
            expect(fileWatchers().size).toBe(0);
            expect((testObject as any)._statusBarItem).toBeUndefined();
        } finally {
            await config.update('enableTailMode', undefined);
        }
    });
});
