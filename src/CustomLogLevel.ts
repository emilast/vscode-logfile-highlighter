'use strict';

import * as vscode from 'vscode';

class CustomLogLevel {
    public readonly value: string;
    public readonly color: string;
    public readonly regex: string;
    public readonly decoration: vscode.TextEditorDecorationType;

    public constructor(value: string, color: string) {
        this.value = value;
        this.color = color;
        this.regex = this.createRegex(value);
        this.decoration = vscode.window.createTextEditorDecorationType({
            color: this.color,
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });
    }

    private createRegex(logLevelValue: string): string {
        let result: string;

        // Check if the log level value is a "simple" string or not.
        if (!/\w+/g.test(logLevelValue)) {

            // log level is already regex.
            result = logLevelValue;
        } else {

            // Log level consits only of "simple" characters -> build regex.
            const firstVariant = '(?i)\\b(' + logLevelValue + ')\\:|' +
                '(?-i)\\b(' + logLevelValue.toUpperCase() + '|' + logLevelValue + ')\\b';
            const secondVariant = '(?i)\\[(' + logLevelValue + ')\\]';
            result = '(' + firstVariant + ')|(' + secondVariant + ')';
        }

        return result;
    }
}

export = CustomLogLevel;
