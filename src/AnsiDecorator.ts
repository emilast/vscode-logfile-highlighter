import * as vscode from 'vscode';
import { AnsiColor, AnsiStyle, parseAnsi } from './AnsiParser';

type EscapeCodeDisplay = 'hide' | 'dim' | 'show';

// Theme color names for the 16 basic ANSI colors, as used by the integrated terminal.
const AnsiThemeColorNames = [
    'ansiBlack', 'ansiRed', 'ansiGreen', 'ansiYellow', 'ansiBlue', 'ansiMagenta', 'ansiCyan', 'ansiWhite',
    'ansiBrightBlack', 'ansiBrightRed', 'ansiBrightGreen', 'ansiBrightYellow',
    'ansiBrightBlue', 'ansiBrightMagenta', 'ansiBrightCyan', 'ansiBrightWhite'
];

export class AnsiDecorator {

    private _enabled: boolean;
    private _escapeCodeDisplay: EscapeCodeDisplay;

    // One decoration type per distinct ANSI style, created on demand.
    private _styleDecorations: Map<string, vscode.TextEditorDecorationType>;
    private _escapeDecoration: vscode.TextEditorDecorationType | undefined;

    public constructor() {
        this._enabled = true;
        this._escapeCodeDisplay = 'hide';
        this._styleDecorations = new Map<string, vscode.TextEditorDecorationType>();
    }

    public updateConfiguration(): void {
        const config = vscode.workspace.getConfiguration('logFileHighlighter');
        this._enabled = config.get<boolean>('enableAnsiColors', true);
        this._escapeCodeDisplay = config.get<EscapeCodeDisplay>('ansiEscapeCodeDisplay', 'hide');

        // Disposing the decoration types also removes them from all editors.
        this.disposeDecorations();

        if (this._escapeCodeDisplay === 'hide') {
            // Collapse the escape sequences so that they take up no space.
            this._escapeDecoration = vscode.window.createTextEditorDecorationType({
                textDecoration: 'none; font-size: 0; letter-spacing: 0',
                opacity: '0',
                rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
            });
        } else if (this._escapeCodeDisplay === 'dim') {
            this._escapeDecoration = vscode.window.createTextEditorDecorationType({
                opacity: '0.4',
                rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
            });
        }
    }

    public decorateEditors(editors: readonly vscode.TextEditor[]): void {
        if (!this._enabled) {
            return;
        }

        for (const editor of editors) {
            const result = parseAnsi(editor.document.getText());

            const styleRanges = new Map<string, vscode.Range[]>();
            for (const segment of result.styled) {
                if (!this._styleDecorations.has(segment.styleKey)) {
                    this._styleDecorations.set(segment.styleKey, this.createStyleDecoration(segment.style));
                }

                let ranges = styleRanges.get(segment.styleKey);
                if (ranges === undefined) {
                    ranges = [];
                    styleRanges.set(segment.styleKey, ranges);
                }
                ranges.push(new vscode.Range(segment.line, segment.start, segment.line, segment.end));
            }

            // Set all known decoration types, so that styles no longer present in the document are cleared.
            for (const [styleKey, decoration] of this._styleDecorations) {
                editor.setDecorations(decoration, styleRanges.get(styleKey) ?? []);
            }

            if (this._escapeDecoration !== undefined) {
                editor.setDecorations(
                    this._escapeDecoration,
                    result.escapes.map((escape) => new vscode.Range(escape.line, escape.start, escape.line, escape.end)));
            }
        }
    }

    private createStyleDecoration(style: AnsiStyle): vscode.TextEditorDecorationType {
        let foreground = this.toColor(style.foreground);
        let background = this.toColor(style.background);

        if (style.inverse) {
            const swappedForeground = background ?? new vscode.ThemeColor('editor.background');
            background = foreground ?? new vscode.ThemeColor('editor.foreground');
            foreground = swappedForeground;
        }

        const textDecorations: string[] = [];
        if (style.underline) {
            textDecorations.push('underline');
        }
        if (style.strikethrough) {
            textDecorations.push('line-through');
        }

        return vscode.window.createTextEditorDecorationType({
            color: foreground,
            backgroundColor: background,
            fontWeight: style.bold ? 'bold' : undefined,
            fontStyle: style.italic ? 'italic' : undefined,
            opacity: style.dim ? '0.6' : undefined,
            textDecoration: textDecorations.length > 0 ? textDecorations.join(' ') : undefined,
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });
    }

    private toColor(color: AnsiColor | undefined): string | vscode.ThemeColor | undefined {
        if (color === undefined) {
            return undefined;
        }

        if (typeof color === 'number') {
            return new vscode.ThemeColor('terminal.' + AnsiThemeColorNames[color]);
        }

        return color;
    }

    private disposeDecorations() {
        for (const decoration of this._styleDecorations.values()) {
            decoration.dispose();
        }
        this._styleDecorations.clear();

        this._escapeDecoration?.dispose();
        this._escapeDecoration = undefined;
    }

    public dispose() {
        this.disposeDecorations();
    }
}
