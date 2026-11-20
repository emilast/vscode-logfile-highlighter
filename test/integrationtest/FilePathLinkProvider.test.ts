'use strict';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { closeAllEditors, waitFor } from './helpers';

// Tests the links of the activated extension, through VS Code's link API.
describe('FilePathLinkProvider', () => {

    let tempFolder: string;
    let target: string;
    let logDocument: vscode.TextDocument;

    beforeAll(async () => {
        tempFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'logfile-highlighter-links-'));
        target = path.join(tempFolder, 'src', 'app.ts');
        fs.mkdirSync(path.dirname(target));
        fs.writeFileSync(target, Array.from({ length: 80 }, (_, i) => `// line ${i + 1}`).join('\n'));

        const logFile = path.join(tempFolder, 'run.log');
        fs.writeFileSync(logFile, [
            `2026-11-20 10:00:00 ERROR Failed at ${target}:42`,
            `2026-11-20 10:00:01 ERROR Failed at ${target}:42:7`,
            '2026-11-20 10:00:02 ERROR Failed at src/app.ts:12',
            '2026-11-20 10:00:03 ERROR Failed at src/app.ts(30,5): error CS1002',
            `2026-11-20 10:00:04 INFO  See file://${target}#L20`,
            '2026-11-20 10:00:05 INFO  Missing src/missing.ts:3',
            '2026-11-20 10:00:06 INFO  Bare name app.ts:3',
        ].join('\n') + '\n');
        logDocument = await vscode.workspace.openTextDocument(vscode.Uri.file(logFile));
    });

    afterAll(async () => {
        await closeAllEditors();
        try {
            fs.rmSync(tempFolder, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
        } catch (error) {
            console.log(`Could not delete the temporary folder ${tempFolder}: ${error.message}`);
        }
    });

    /** The links on each line of the log, as "text -> target". */
    async function linksByLine(): Promise<Map<number, string[]>> {
        const links = await vscode.commands.executeCommand<vscode.DocumentLink[]>('vscode.executeLinkProvider', logDocument.uri);
        const result = new Map<number, string[]>();
        for (const link of links) {
            const line = link.range.start.line + 1;
            const description = `${logDocument.getText(link.range)} -> ${link.target?.toString(true)}`;
            result.set(line, [...(result.get(line) ?? []), description]);
        }
        return result;
    }

    function fileUri(fragment = ''): string {
        return vscode.Uri.file(target).with({ fragment }).toString(true);
    }

    it('links paths to the line and column after them.', async () => {
        const links = await linksByLine();

        expect(links.get(1)).toEqual([`${target}:42 -> ${fileUri('L42')}`]);
        expect(links.get(2)).toEqual([`${target}:42:7 -> ${fileUri('L42,7')}`]);
        expect(links.get(3)).toEqual([`src/app.ts:12 -> ${fileUri('L12')}`]);
        expect(links.get(4)).toEqual([`src/app.ts(30,5) -> ${fileUri('L30,5')}`]);
    });

    it('keeps the link of a file URL, with its line number.', async () => {
        const links = await linksByLine();

        expect(links.get(5)).toEqual([`file://${target}#L20 -> ${fileUri('L20')}`]);
    });

    it('does not link files that do not exist, or file names without a folder.', async () => {
        const links = await linksByLine();

        expect(links.get(6)).toBeUndefined();
        expect(links.get(7)).toBeUndefined();
    });

    it('opens the file at the line and column of the link.', async () => {
        // Arrange
        await closeAllEditors();
        const logEditor = await vscode.window.showTextDocument(logDocument);
        const line = 3; // src/app.ts(30,5)
        logEditor.selection = new vscode.Selection(line, 40, line, 40);
        const isTargetOpen = () => vscode.window.activeTextEditor?.document.uri.fsPath === target;

        // Act: the editor finds its links a moment after it's opened, so try until the link is there
        for (let attempt = 0; attempt < 20 && !isTargetOpen(); attempt++) {
            await vscode.commands.executeCommand('editor.action.openLink');
            await new Promise((resolve) => setTimeout(resolve, 200));
        }

        // Assert
        await waitFor(() => vscode.window.activeTextEditor?.document.uri.fsPath === target
            && vscode.window.activeTextEditor.selection.active.line === 29, 'the file to open at line 30');
        expect(vscode.window.activeTextEditor.selection.active.character).toBe(4);
    });

    it('has no links when the setting is turned off.', async () => {
        const config = vscode.workspace.getConfiguration('logFileHighlighter');
        await config.update('enableFileLinks', false);
        try {
            const links = await linksByLine();

            // Only VS Code's own link of the file URL is left
            expect(Array.from(links.keys())).toEqual([5]);
        } finally {
            await config.update('enableFileLinks', undefined);
        }
    });
});
