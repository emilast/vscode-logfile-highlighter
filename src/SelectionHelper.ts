'use strict';
import * as vscode from 'vscode';
import { TimePeriod } from './TimePeriod';


export class SelectionHelper {
    getFirstAndLastLines(editor: vscode.TextEditor, doc: vscode.TextDocument) {
        const startLineNumber = editor.selection.start.line;
        const endLineNumber = editor.selection.end.line;
        let timePeriod: TimePeriod | undefined;

        if (startLineNumber !== endLineNumber) {

            // Get the selections first and last non empty line
            const startLine: vscode.TextLine = doc.lineAt(startLineNumber);
            let endLine: vscode.TextLine;

            // If last line is not partially selected use last but first line
            if (editor.selection.end.character === 0) {
                // Because startLineNumber !== endLineNumber, endLineNumber - 1 >= 0 holds
                endLine = doc.lineAt(endLineNumber - 1);
            } else {
                endLine = doc.lineAt(endLineNumber);
            }

            return {
                startLine: startLine.text,
                endLine: endLine.text
            };
        }

        return undefined;

    }
}
