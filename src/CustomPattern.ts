'use strict';

import * as vscode from 'vscode';

class CustomPattern {
    public readonly pattern: string;
    public readonly foreground: string;
    public readonly regexes: RegExp[];
    public readonly decoration: vscode.TextEditorDecorationType;

    public constructor(pattern: string, foreground: string) {
        this.pattern = pattern;
        this.foreground = foreground;
        this.regexes = this.createRegex(pattern);
        this.decoration = vscode.window.createTextEditorDecorationType({
            color: this.foreground,
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });
    }

    public dispose() {
        this.decoration.dispose();
    }

    private createRegex(pattern: string): RegExp[] {
        const result: RegExp[] = [];

        // Check if the log level value is a "simple" string or not.
        if (!/^\w+$/g.test(pattern)) {

            // log level is already regex.
            try {
                result.push(new RegExp(pattern, 'g'));
            } catch (err) {
                vscode.window.showErrorMessage('Regex of custom log level is invalid. Error: ' + err);
            }
        } else {

            // Log level consists only of "simple" characters -> build regex.
            const first = new RegExp('\\b(?!\\[)(' + pattern.toUpperCase() +
                '|' + pattern + ')(?!\\]|\\:)\\b', 'g');
            const second = new RegExp('\\[(' + pattern + ')\\]|\\b(' + pattern + ')\\:', 'ig');

            result.push(first, second);
        }

        return result;
    }
}

export = CustomPattern;
