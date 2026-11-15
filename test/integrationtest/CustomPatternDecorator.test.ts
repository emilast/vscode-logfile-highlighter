'use strict';

import * as vscode from 'vscode';
import { CustomPatternDecorator } from '../../src/CustomPatternDecorator';
import { openTestLog } from './helpers';

/** A text editor that records the decorations set on it, around a real document. */
function createRecordingEditor(document: vscode.TextDocument) {
    const calls: Array<{ type: vscode.TextEditorDecorationType, ranges: vscode.Range[] }> = [];
    const editor = {
        document,
        setDecorations: (type: vscode.TextEditorDecorationType, ranges: vscode.Range[]) => {
            calls.push({ type, ranges });
        }
    } as unknown as vscode.TextEditor;
    return { editor, calls };
}

/** Returns the ranges of all occurrences of the text in the document, one per line at most. */
function rangesOf(document: vscode.TextDocument, text: string, ignoreCase: boolean): vscode.Range[] {
    const result: vscode.Range[] = [];
    for (let line = 0; line < document.lineCount; line++) {
        const lineText = document.lineAt(line).text;
        const index = ignoreCase ? lineText.toLowerCase().indexOf(text.toLowerCase()) : lineText.indexOf(text);
        if (index >= 0) {
            result.push(new vscode.Range(line, index, line, index + text.length));
        }
    }
    return result;
}

function expectRanges(actual: vscode.Range[], expected: vscode.Range[]) {
    expect(actual.map((range) => rangeToString(range))).toEqual(expected.map((range) => rangeToString(range)));
}

function rangeToString(range: vscode.Range): string {
    return `${range.start.line}:${range.start.character}-${range.end.line}:${range.end.character}`;
}

describe('CustomPatternDecorator', () => {

    let testObject: CustomPatternDecorator;
    let document: vscode.TextDocument;

    // Lines 8-10 of firstLog.log, e.g. 'E/Application'
    const errorSources = ['E/Application', 'E/MyService', 'E/Subservice'];

    beforeAll(async () => {
        await vscode.workspace.getConfiguration('logFileHighlighter').update('customPatterns', [
            {
                pattern: 'verbose',
                patternFlags: 'i',
                foreground: 'green'
            },
            {
                pattern: 'E/\\w+',
                foreground: 'red',
                background: 'yellow'
            },
            {
                // Ignored, since it has no style
                pattern: 'Hello'
            }
        ]);
        document = (await openTestLog('firstLog.log')).document;
    });

    afterAll(async () => {
        await vscode.workspace.getConfiguration('logFileHighlighter').update('customPatterns', undefined);
    });

    beforeEach(() => {
        testObject = new CustomPatternDecorator();
        testObject.updateConfiguration();
    });

    afterEach(() => {
        testObject.dispose();
    });

    describe('decorateEditors', () => {
        it('decorates the matches of each configured pattern that has a style.', () => {
            // Arrange
            const { editor, calls } = createRecordingEditor(document);

            // Act
            testObject.decorateEditors([editor]);

            // Assert
            expect(calls.length).toBe(2);
            expectRanges(calls[0].ranges, rangesOf(document, 'verbose', true));
            expect(calls[0].ranges.length).toBe(4);
            expectRanges(calls[1].ranges, errorSources.map((source) => rangesOf(document, source, false)[0]));
        });

        it('uses a separate decoration type for each pattern.', () => {
            // Arrange
            const { editor, calls } = createRecordingEditor(document);

            // Act
            testObject.decorateEditors([editor]);

            // Assert
            expect(calls[0].type).not.toBe(calls[1].type);
        });
    });

    describe('updateConfiguration', () => {
        it('uses the patterns from the updated configuration.', async () => {
            // Arrange
            const config = vscode.workspace.getConfiguration('logFileHighlighter');
            const originalPatterns = config.get('customPatterns');
            await config.update('customPatterns', [{ pattern: 'crashed', foreground: 'red' }]);
            const { editor, calls } = createRecordingEditor(document);

            try {
                // Act
                testObject.updateConfiguration();
                testObject.decorateEditors([editor]);

                // Assert
                expect(calls.length).toBe(1);
                expectRanges(calls[0].ranges, rangesOf(document, 'crashed', false));
            } finally {
                await config.update('customPatterns', originalPatterns);
            }
        });
    });

    describe('decorateDocument', () => {
        it('decorates text that is added to the document.', async () => {
            // Arrange
            const untitled = await vscode.workspace.openTextDocument({
                language: 'log',
                content: '27.01.2018 19:38:28,982 [8988] E/Application: It crashed!\n'
            });
            await vscode.window.showTextDocument(untitled);
            testObject.decorateEditors(vscode.window.visibleTextEditors.filter((e) => e.document === untitled));

            const changed = new Promise<vscode.TextDocumentChangeEvent>((resolve) => {
                const listener = vscode.workspace.onDidChangeTextDocument((event) => {
                    if (event.document === untitled) {
                        listener.dispose();
                        resolve(event);
                    }
                });
            });
            const edit = new vscode.WorkspaceEdit();
            edit.insert(untitled.uri, new vscode.Position(1, 0), '27.01.2018 19:38:29,000 [8988] E/NewService: It crashed!\n');
            await vscode.workspace.applyEdit(edit);

            // Act
            testObject.decorateDocument(await changed);

            // Assert: the cache holds the ranges that were set as decorations
            const docCache: Map<unknown, vscode.Range[]> = (testObject as any)._cache.get(untitled.uri);
            const errorRanges = Array.from(docCache.values())[1];
            expectRanges(errorRanges, [
                rangesOf(untitled, 'E/Application', false)[0],
                rangesOf(untitled, 'E/NewService', false)[0]
            ]);

            await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
        });
    });
});
