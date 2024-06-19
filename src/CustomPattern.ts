'use strict';

import * as vscode from 'vscode';

export class CustomPattern {
    public readonly pattern: string;
    public readonly foreground: string;
    public readonly background: string;
    public readonly regexes: RegExp[];
    public readonly decoration: vscode.TextEditorDecorationType;

    public constructor(
        pattern: string, foreground: string, background: string, fontWeight: string,
        fontStyle: string, border: string, borderRadius: string, borderSpacing: string,
        letterSpacing: string, overviewRulerColor: string, overviewRulerLane: vscode.OverviewRulerLane,
        textDecoration: string)
    {
        this.pattern = pattern;
        this.foreground = foreground;
        this.background = background;
        this.regexes = this.createRegex(pattern);
        this.decoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: this.background,
            color: this.foreground,
            fontWeight: fontWeight,
            fontStyle: fontStyle,
            border: border,
            borderRadius: borderRadius,
            letterSpacing: letterSpacing,
            overviewRulerColor: overviewRulerColor,
            overviewRulerLane: overviewRulerLane,
            textDecoration: textDecoration,
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
                result.push(new RegExp(pattern, 'gm'));
            } catch (err) {
                vscode.window.showErrorMessage('Regex of custom log level is invalid. Error: ' + err);
            }
        } else {

            // Log level consists only of "simple" characters -> build regex.
            const first = new RegExp('\\b(?!\\[)(' + pattern.toUpperCase() +
                '|' + pattern + ')(?!\\]|\\:)\\b', 'gm');
            const second = new RegExp('\\[(' + pattern + ')\\]|\\b(' + pattern + ')\\:', 'ig');

            result.push(first, second);
        }

        return result;
    }
}
