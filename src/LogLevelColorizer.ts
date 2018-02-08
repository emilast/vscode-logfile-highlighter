'use strict';

import * as vscode from 'vscode';
import CustomLogLevel = require('./CustomLogLevel');

class LogLevelColorizer {

    private _customLogLevels: CustomLogLevel[];

    public constructor() {
        this._customLogLevels = [];
    }

    public updateConfiguration(): void {
        const configLogLevels = vscode.workspace.getConfiguration('logFileHighlighter').get(
                'customLogLevels') as Array<{value: string, color: string}>;

        for (const loglevel of this._customLogLevels) {
            loglevel.decoration.dispose();
        }

        this._customLogLevels = [];

        for (const item of configLogLevels) {
            if (item.color !== undefined && item.value !== undefined) {
                this._customLogLevels.push(new CustomLogLevel(item.value, item.color));
            }
        }
    }

    public colorfyDocument(changedEvent: vscode.TextDocumentChangeEvent): void {
        const doc = changedEvent.document;
        const changes = changedEvent.contentChanges;
    }

    public colorfyEditors(editors: vscode.TextEditor[]): void {

    }
}

export = LogLevelColorizer;
