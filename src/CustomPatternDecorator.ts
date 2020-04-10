'use strict';

import * as vscode from 'vscode';
import CustomPattern = require('./CustomPattern');

class CustomPatternDecorator {

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
            'customPatterns') as Array<{ pattern: string, foreground?: string, background?: string }>;

        for (const pattern of this._configPattern) {
            pattern.dispose();
        }

        this._configPattern = [];

        for (const item of configPatterns) {
            // If we have a pattern and either a foreground or background color, then use the pattern
            if ((item.foreground !== undefined || item.background !== undefined) && item.pattern !== undefined) {
                this._configPattern.push(new CustomPattern(item.pattern, item.foreground, item.background));
            }
        }
    }

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

        for (const logLevel of this._configPattern) {
            const patternCache = docCache.get(logLevel);

            // Remove all ranges from the cache that occur after the changed range (change.range).
            const logLevelRanges = patternCache.filter((range) => {
                return range.end.isBefore(change.range.start);
            });

            for (const regex of logLevel.regexes) {
                let matches = regex.exec(contentToEnd);

                while (matches) {
                    const start = doc.positionAt(doc.offsetAt(startPos) + matches.index);
                    const end = start.translate(0, matches[0].length);
                    logLevelRanges.push(new vscode.Range(start, end));

                    matches = regex.exec(contentToEnd);
                }
            }

            // Update cache and set decorations.
            docCache.set(logLevel, logLevelRanges);
            editors[0].setDecorations(logLevel.decoration, logLevelRanges);
        }

        this._cache.set(doc.uri, docCache);
    }

    public decorateEditors(editors: vscode.TextEditor[], changes?: vscode.TextDocumentContentChangeEvent[]): void {
        if (editors.length >= 1) {
            for (const editor of editors) {
                const content = editor.document.getText();

                const docRanges = new Map<CustomPattern, vscode.Range[]>();
                for (const logLevel of this._configPattern) {
                    const logLevelRanges = [];

                    for (const regex of logLevel.regexes) {
                        let matches = regex.exec(content);

                        while (matches) {
                            const start = editor.document.positionAt(matches.index);
                            const end = start.translate(0, matches[0].length);

                            logLevelRanges.push(new vscode.Range(start, end));

                            matches = regex.exec(content);
                        }
                    }

                    // Update cache and set decorations.
                    editor.setDecorations(logLevel.decoration, logLevelRanges);
                    docRanges.set(logLevel, logLevelRanges);
                }

                this._cache.set(editor.document.uri, docRanges);
            }
        }
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

export = CustomPatternDecorator;
