'use strict';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { closeAllEditors } from './helpers';

describe('Language detection', () => {

    let tempFolder: string;

    beforeAll(() => {
        tempFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'logfile-highlighter-detection-'));
    });

    afterAll(async () => {
        await closeAllEditors();
        try {
            fs.rmSync(tempFolder, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
        } catch (error) {
            console.log(`Could not delete the temporary folder ${tempFolder}: ${error.message}`);
        }
    });

    /** Writes a file with an extension that no language is associated with, and opens it. */
    async function openFileWithContent(fileName: string, content: string): Promise<vscode.TextDocument> {
        const filePath = path.join(tempFolder, fileName);
        fs.writeFileSync(filePath, content);
        return vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
    }

    it('uses the log language for a file whose first line starts with a date.', async () => {
        const document = await openFileWithContent('app.out', '2018-01-27 10:38:20.442 [8988] INFO  [Bootstrapper]: Hello World\n');

        expect(document.languageId).toBe('log');
    });

    it('does not use the log language for a file whose first line does not start with a date.', async () => {
        const document = await openFileWithContent('notes.out', 'Hello World\n2018-01-27 10:38:20.442 [8988] INFO  [Bootstrapper]: Hello World\n');

        expect(document.languageId).not.toBe('log');
    });
});
