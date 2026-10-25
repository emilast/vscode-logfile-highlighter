'use strict';

import * as vscode from 'vscode';

export class CustomPattern {
    public readonly pattern: string;
    public readonly foreground: string | undefined;
    public readonly background: string | undefined;
    public readonly regexes: RegExp[];
    public readonly decoration: vscode.TextEditorDecorationType;

    public constructor(
        pattern: string, patternFlags: string, highlightEntireLine: boolean, foreground: string | undefined, background: string | undefined,
        fontWeight: string | undefined, fontStyle: string | undefined, border: string | undefined, borderRadius: string | undefined,
        borderSpacing: string | undefined, letterSpacing: string | undefined, overviewRulerColor: string | undefined,
        overviewRulerLane: vscode.OverviewRulerLane | undefined, textDecoration: string | undefined)
    {
        this.pattern = pattern;
        this.foreground = foreground;
        this.background = background;
        this.regexes = this.createRegex(pattern, patternFlags, highlightEntireLine);
        this.decoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: this.background,
            color: this.foreground,
            fontWeight: fontWeight,
            fontStyle: fontStyle,
            border: border,
            borderRadius: borderRadius,
            borderSpacing: borderSpacing,
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

    private createRegex(pattern: string, patternFlags: string, highlightEntireLine: boolean): RegExp[] {
        const result: RegExp[] = [];

        if (highlightEntireLine) {
            pattern = '^.*' + pattern + '.*$';
        }

        try {
            result.push(new RegExp(pattern, 'gm' + patternFlags));
        } catch (err) {
            vscode.window.showErrorMessage('Regex of custom log level is invalid. Error: ' + err);
        }

        return result;
    }
}
