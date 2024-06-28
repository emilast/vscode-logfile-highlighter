'use strict';

import * as vscode from 'vscode';
import { CustomPattern } from './CustomPattern';

export class CustomPatternDecorator {

    // All custom log level specified in the configuration.
    private _configPattern: CustomPattern[];

    // Indicates in which file which log level highlights which ranges.
    private _cache: Map<vscode.Uri, Map<CustomPattern, vscode.Range[]>>;

    public constructor() {
        this._configPattern = [];
        this._cache = new Map<vscode.Uri, Map<CustomPattern, vscode.Range[]>>();
    }

    public updateConfiguration(): void {
        const configPatterns = vscode.workspace.getConfiguration('logFileHighlighter').get(
            'customPatterns') as {
                pattern: string,
                patternFlags: string,
                foreground?: string,
                background?: string,
                fontWeight?: string,
                fontStyle?: string,
                border?: string,
                borderRadius?: string,
                borderSpacing?: string,
                letterSpacing?: string,
                overviewColor?: string,
                overviewRulerLane?: string,
                textDecoration?: string,
            }[];

        for (const pattern of this._configPattern) {
            pattern.dispose();
        }

        this._configPattern = [];

        for (const item of configPatterns) {
            // If we have a pattern and either a foreground or background color, then use the pattern
            if (
                (item.foreground !== undefined
                    || item.background !== undefined
                    || item.fontWeight !== undefined
                    || item.fontStyle !== undefined
                    || item.border !== undefined
                    || item.borderRadius !== undefined
                )
                && item.pattern !== undefined) {
                var pattern = new CustomPattern(
                    item.pattern, item.patternFlags ?? '', item.foreground, item.background,
                    item.fontWeight, item.fontStyle, item.border, item.borderRadius,
                    item.borderSpacing, item.letterSpacing,
                    item.overviewColor, vscode.OverviewRulerLane[item.overviewRulerLane],
                    item.textDecoration);
                this._configPattern.push(pattern);
            }
        }
    }

    // As a reaction to a document change, decorate the changed parts with the configured custom patterns.
    public decorateDocument(changedEvent: vscode.TextDocumentChangeEvent): void {
        if (this._configPattern.length === 0 || changedEvent.contentChanges.length === 0) {
            return;
        }

        const doc = changedEvent.document;

        const editors = vscode.window.visibleTextEditors.filter((editor) => {
            return editor.document.fileName === doc.fileName;
        });

        const change = changedEvent.contentChanges.slice().sort((a, b) => Math.abs(a.range.start.line - b.range.start.line))[0];

        // Start always at the beginning of the line.
        const startPos = new vscode.Position(change.range.start.line, 0);
        const docCache = this._cache.get(doc.uri);

        const contentToEnd: string =
            doc.getText(new vscode.Range(startPos, doc.lineAt(doc.lineCount - 1).range.end));

        for (const pattern of this._configPattern) {
            const patternCache = docCache.get(pattern);

            // Remove all ranges from the cache that occur after the changed range (change.range).
            const patternRanges = patternCache.filter((range) => {
                return range.end.isBefore(change.range.start);
            });

            for (const regex of pattern.regexes) {
                let matches = regex.exec(contentToEnd);

                while (matches) {
                    var { start, end } = this.getMatchPositions(doc, matches);
                    // Adjust start and end positions to be relative to the whole document.
                    start = new vscode.Position(start.line + startPos.line, start.character);
                    end = new vscode.Position(end.line + startPos.line, end.character);

                    patternRanges.push(new vscode.Range(start, end));
                    matches = regex.exec(contentToEnd);
                }
            }

            // Update cache and set decorations.
            docCache.set(pattern, patternRanges);
            editors[0].setDecorations(pattern.decoration, patternRanges);
        }

        this._cache.set(doc.uri, docCache);
    }

    // Apply custom patterns on an array of open files.
    public decorateEditors(editors: vscode.TextEditor[], changes?: vscode.TextDocumentContentChangeEvent[]): void {
        if (editors.length >= 1) {
            for (const editor of editors) {
                const content = editor.document.getText();

                const docRanges = new Map<CustomPattern, vscode.Range[]>();
                for (const pattern of this._configPattern) {
                    const logLevelRanges = [];

                    for (const regex of pattern.regexes) {
                        let matches = regex.exec(content);

                        while (matches) {
                            var { start, end } = this.getMatchPositions(editor.document, matches);
                            logLevelRanges.push(new vscode.Range(start, end));
                            matches = regex.exec(content);
                        }
                    }

                    // Update cache and set decorations.
                    editor.setDecorations(pattern.decoration, logLevelRanges);
                    docRanges.set(pattern, logLevelRanges);
                }

                this._cache.set(editor.document.uri, docRanges);
            }
        }
    }

    private getMatchPositions(document: vscode.TextDocument, matches: RegExpExecArray) {
        const start = document.positionAt(matches.index);
        const matchString = matches[0];
        const newlineCount = (matchString.match(/\n/g) || []).length;

        let end;
        if (newlineCount === 0) {
            // Match is on the same line
            end = start.translate(0, matchString.length);
        } else {
            // Match spans multiple lines
            const lastNewlineIndex = matchString.lastIndexOf('\n');
            const lengthOfLastLine = matchString.length - lastNewlineIndex - 1;
            const lineOffset = newlineCount;
            end = start.translate(lineOffset, lengthOfLastLine);
        }
        return { start, end };
    }

    public dispose() {
        for (const level of this._configPattern) {
            level.dispose();
        }

        this._cache.forEach((patternCache) => {
            for (const pattern of patternCache.keys()) {
                pattern.dispose();
            }
        });
    }
}
