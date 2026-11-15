'use strict';

import * as vscode from 'vscode';

/** Opens and shows one of the log files in the test workspace (test/integrationtest/testLogs). */
export async function openTestLog(fileName: string): Promise<vscode.TextEditor> {
    const uris = await vscode.workspace.findFiles(fileName);
    if (uris.length === 0) {
        throw new Error(`Test log ${fileName} wasn't found. Is the testLogs folder opened?`);
    }
    const document = await vscode.workspace.openTextDocument(uris[0]);
    return vscode.window.showTextDocument(document);
}

/** Opens and shows an unsaved log document with the given content. */
export async function openUntitledLog(content: string): Promise<vscode.TextEditor> {
    const document = await vscode.workspace.openTextDocument({ language: 'log', content });
    return vscode.window.showTextDocument(document);
}

/** Waits until the condition is true, or fails after the timeout. */
export async function waitFor(condition: () => boolean, description: string, timeoutMs = 4000): Promise<void> {
    const start = Date.now();
    while (!condition()) {
        if (Date.now() - start > timeoutMs) {
            throw new Error('Timed out waiting for: ' + description);
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
}

export async function closeAllEditors(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
}
