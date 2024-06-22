'use strict';

import * as vscode from 'vscode';

export class CustomPattern {
    public readonly pattern: string;
    public readonly foreground: string;
    public readonly background: string;
    public readonly regexes: RegExp[];
    public readonly decoration: vscode.TextEditorDecorationType;

    public constructor(
        pattern: string, patternFlags: string, foreground: string, background: string, fontWeight: string,
        fontStyle: string, border: string, borderRadius: string, borderSpacing: string,
        letterSpacing: string, overviewRulerColor: string, overviewRulerLane: vscode.OverviewRulerLane,
        textDecoration: string)
    {
        this.pattern = pattern;
        this.foreground = foreground;
        this.background = background;
        this.regexes = this.createRegex(pattern, patternFlags);
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

    private createRegex(pattern: string, patternFlags: string): RegExp[] {
        const result: RegExp[] = [];

        try {
            result.push(new RegExp(pattern, 'gm' + patternFlags));
        } catch (err) {
            vscode.window.showErrorMessage('Regex of custom log level is invalid. Error: ' + err);
        }

        return result;
    }
}
