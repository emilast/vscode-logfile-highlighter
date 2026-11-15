'use strict';

import * as vscode from 'vscode';
import { isThemeColorId } from './ThemeColorId';

export class CustomPattern {
    public readonly pattern: string;
    public readonly foreground: string;
    public readonly background: string;
    public readonly regexes: RegExp[];
    public readonly decoration: vscode.TextEditorDecorationType;

    public constructor(
        pattern: string, patternFlags: string, highlightEntireLine: boolean, foreground: string, background: string, fontWeight: string,
        fontStyle: string, border: string, borderRadius: string, borderSpacing: string,
        letterSpacing: string, overviewRulerColor: string, overviewRulerLane: vscode.OverviewRulerLane,
        textDecoration: string)
    {
        this.pattern = pattern;
        this.foreground = foreground;
        this.background = background;
        this.regexes = this.createRegex(pattern, patternFlags, highlightEntireLine);
        this.decoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: this.toColor(this.background),
            color: this.toColor(this.foreground),
            fontWeight: fontWeight,
            fontStyle: fontStyle,
            border: border,
            borderRadius: borderRadius,
            borderSpacing: borderSpacing,
            letterSpacing: letterSpacing,
            overviewRulerColor: this.toColor(overviewRulerColor),
            overviewRulerLane: overviewRulerLane,
            textDecoration: textDecoration,
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });
    }

    public dispose() {
        this.decoration.dispose();
    }

    /** Uses the color of the current theme if the setting is a theme color id, e.g. 'terminal.ansiGreen'. */
    private toColor(color: string | undefined): string | vscode.ThemeColor | undefined {
        return isThemeColorId(color) ? new vscode.ThemeColor(color.trim()) : color;
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
