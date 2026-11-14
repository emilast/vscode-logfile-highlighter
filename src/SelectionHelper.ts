'use strict';
import * as vscode from 'vscode';

export class SelectionHelper {
    getFirstAndLastLines(editor: vscode.TextEditor, doc: vscode.TextDocument) {
        // The selection can briefly refer to lines past the end of the document, e.g. when a
        // tailed log file is truncated, so keep the line numbers within the document.
        const lastLineNumber = doc.lineCount - 1;
        const startLineNumber = Math.min(editor.selection.start.line, lastLineNumber);
        const endLineNumber = Math.min(editor.selection.end.line, lastLineNumber);

        if (startLineNumber !== endLineNumber) {
            let startLine: vscode.TextLine | undefined;
            let endLine: vscode.TextLine | undefined;

            // Iterate from the start to find the first non-empty line
            for (let i = startLineNumber; i <= endLineNumber; i++) {
                const line = doc.lineAt(i);
                if (line.text.trim() !== '') {
                    startLine = line;
                    break;
                }
            }

            // Iterate from the end to find the last non-empty line
            for (let i = endLineNumber; i >= startLineNumber; i--) {
                const line = doc.lineAt(i);
                if (line.text.trim() !== '') {
                    endLine = line;
                    break;
                }
            }

            // If startLine and endLine are set, return their text
            if (startLine && endLine) {
                return {
                    startLine: startLine.text,
                    endLine: endLine.text
                };
            }
        }

        return undefined;
    }
}