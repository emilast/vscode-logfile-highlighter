'use strict';

import * as vscode from 'vscode';

class CustomLogLevel {
    public readonly value: string;
    public readonly color: string;
    public readonly regexes: RegExp[];
    public readonly decoration: vscode.TextEditorDecorationType;

    public constructor(value: string, color: string) {
        this.value = value;
        this.color = color;
        this.regexes = this.createRegex(value);
        this.decoration = vscode.window.createTextEditorDecorationType({
            color: this.color,
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });
    }

    private createRegex(logLevelValue: string): RegExp[] {
        const result: RegExp[] = [];

        // Check if the log level value is a "simple" string or not.
        if (!/\w+/g.test(logLevelValue)) {

            // log level is already regex.
            try {
                result.push(new RegExp(logLevelValue, 'g'));
            } catch (err) {
                vscode.window.showErrorMessage('Regex of custom log level is invalid. Error: ' + err);
            }
        } else {

            // Log level consits only of "simple" characters -> build regex.
            const first = new RegExp('\\b(?!\\[)(' + logLevelValue.toUpperCase() +
                '|' + logLevelValue + ')(?!\\]|\\:)\\b', 'g');
            const second = new RegExp('\\[(' + logLevelValue + ')\\]|\\b(' + logLevelValue + ')\\:', 'ig');

            result.push(first, second);

            //// Todo remove
            // logLevelValue = 'HelloWorld';
            // const firstVariant = '(?i)\\b(' + logLevelValue + ')\\:|' +
            //     '(?-i)\\b(' + logLevelValue.toUpperCase() + '|' + logLevelValue + ')\\b';
            // const secondVariant = '(?i)\\[(' + logLevelValue + ')\\]';
            // '(' + first.source + '|' + second.source + ')|(' + third.source + ')'

            // let testResult = result[0].test('HelloWorld');
            // testResult = result[0].test('helloworld:');
            // testResult = result[0].test('Helloworld'.toUpperCase());
            // testResult = result[0].test('[helloworld]');

            // testResult = result[1].test('HelloWorld');
            // testResult = result[1].test('helloworld:');
            // testResult = result[1].test('Helloworld'.toUpperCase());
            // testResult = result[1].test('[helloworld]');
        }

        return result;
    }
}

export = CustomLogLevel;
