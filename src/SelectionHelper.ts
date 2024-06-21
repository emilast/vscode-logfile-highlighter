'use strict';
import * as vscode from 'vscode';
import { TimePeriod } from './TimePeriod';


export class SelectionHelper {
    getFirstAndLastLines(editor: vscode.TextEditor, doc: vscode.TextDocument) {
        const startLineNumber = editor.selection.start.line;
        const endLineNumber = editor.selection.end.line;

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