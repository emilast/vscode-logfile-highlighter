'use strict';
import * as moment from 'moment';
import * as vscode from 'vscode';
import { CustomTimestampFormatParser, CustomTimestampFormat, ValidatedFormat } from './TimestampParsers/CustomTimestampFormatParser';

export class CustomTimestampFormatController {
    private _disposable: vscode.Disposable;

    private validatedFormats: ValidatedFormat[] = [];
    private formatParser: CustomTimestampFormatParser;

    constructor(formatParser: CustomTimestampFormatParser) {
        this.formatParser = formatParser;
        this.loadAndValidateFormats();

        const subscriptions: vscode.Disposable[] = [];
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('logFileHighlighter.customTimestampFormats')) {
                this.loadAndValidateFormats(true);
            }
        }, this, subscriptions);

        this._disposable = vscode.Disposable.from(...subscriptions);
    }

    public dispose() {
        this._disposable.dispose();
    }

    private loadAndValidateFormats(isUserChange: boolean = false): void {
        const formats = vscode.workspace.getConfiguration('logFileHighlighter').get<CustomTimestampFormat[]>('customTimestampFormats', []);
        this.validatedFormats = [];
        
        formats.forEach((format, index) => {
            if (!format.pattern || !format.format) {
                vscode.window.showErrorMessage(`Missing required fields in customTimestampFormats[${index}]: 'pattern' and 'format' are required`);
                return;
            }

            try {
                const regex = new RegExp(format.pattern);
                
                const testDate = moment();
                if (!testDate.format(format.format)) {
                    vscode.window.showErrorMessage(`Invalid moment.js format string in customTimestampFormats[${index}]: ${format.format}`);
                    return;
                }

                this.validatedFormats.push({ format, regex });
            } catch (e) {
                if (e instanceof SyntaxError) {
                    vscode.window.showErrorMessage(`Invalid regex pattern in customTimestampFormats[${index}]: ${format.pattern}\nError: ${e.message}`);
                } else {
                    vscode.window.showErrorMessage(`Error validating customTimestampFormats[${index}]: ${e}`);
                }
            }
        });

        if (formats.length > 0 && this.validatedFormats.length === 0) {
            vscode.window.showWarningMessage('No valid custom timestamp formats found. Check your configuration for errors.');
        } else if (isUserChange && this.validatedFormats.length > 0) {
            vscode.window.showInformationMessage('Custom timestamp formats have been successfully applied.');
        }

        this.formatParser.setFormats(this.validatedFormats);
    }
}
