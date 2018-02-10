'use strict';

import * as vscode from 'vscode';
import CustomLogLevel = require('./CustomLogLevel');

class LogLevelColorizer {

    // All custom log level specified in the configuration.
    private _configLogLevel: CustomLogLevel[];

    // Indicates in which file which log level highlights which ranges.
    private _cache: Map<vscode.Uri, Map<CustomLogLevel, vscode.Range[]>>;

    public constructor() {
        this._configLogLevel = [];
        this._cache = new Map<vscode.Uri, Map<CustomLogLevel, vscode.Range[]>>();
    }

    public updateConfiguration(): void {
        const configLogLevels = vscode.workspace.getConfiguration('logFileHighlighter').get(
            'customLogLevels') as Array<{ value: string, color: string }>;

        for (const loglevel of this._configLogLevel) {
            loglevel.dispose();
        }

        this._configLogLevel = [];

        for (const item of configLogLevels) {
            if (item.color !== undefined && item.value !== undefined) {
                this._configLogLevel.push(new CustomLogLevel(item.value, item.color));
            }
        }
    }

    public colorfyDocument(changedEvent: vscode.TextDocumentChangeEvent): void {
        if (this._configLogLevel.length === 0 || changedEvent.contentChanges.length === 0) {
            return;
        }

        const doc = changedEvent.document;

        const editors = vscode.window.visibleTextEditors.filter((editor) => {
            return editor.document.fileName === doc.fileName;
        });

        const change = changedEvent.contentChanges.sort((a, b) => Math.abs(a.range.start.line - b.range.start.line))[0];

        // Start always at the beginning of the line.
        const startPos = new vscode.Position(change.range.start.line, 0);
        const docCache = this._cache.get(doc.uri);

        const contentToEnd: string =
            doc.getText(new vscode.Range(startPos, doc.lineAt(doc.lineCount - 1).range.end));

        for (const logLevel of this._configLogLevel) {
            const logLevelCache = docCache.get(logLevel);

            // Remove all ranges from the cache that occur after the changed range (change.range).
            const logLevelRanges = logLevelCache.filter((range) => {
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

    public colorfyEditors(editors: vscode.TextEditor[], changes?: vscode.TextDocumentContentChangeEvent[]): void {
        if (editors.length >= 1) {
            for (const editor of editors) {
                const content = editor.document.getText();

                const docRanges = new Map<CustomLogLevel, vscode.Range[]>();
                for (const logLevel of this._configLogLevel) {
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
        for (const level of this._configLogLevel) {
            level.dispose();
        }

        this._cache.forEach((loglevelCache) => {
            for (const loglevel of loglevelCache.keys()) {
                loglevel.dispose();
            }
        });
    }
}

export = LogLevelColorizer;
