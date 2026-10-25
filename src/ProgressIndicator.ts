import moment = require('moment');
import * as vscode from 'vscode';
import { Constants } from './Constants';
import { SelectionHelper } from './SelectionHelper';
import { TimePeriodCalculator } from './TimePeriodCalculator';
import { TimestampParser } from './TimestampParsers/TimestampParser';
import { TimeWithMicroseconds } from './TimeWithMicroseconds';

export class ProgressIndicator {

    private _decoration: vscode.TextEditorDecorationType | undefined;
    private _timeCalculator: TimePeriodCalculator;
    private _selectionHelper: SelectionHelper;
    private _timestampParser: TimestampParser;

    constructor(timeCalculator: TimePeriodCalculator, selectionHelper: SelectionHelper, timestampParser: TimestampParser) {
        this._timeCalculator = timeCalculator;
        this._selectionHelper = selectionHelper;
        this._timestampParser = timestampParser;
    }

    public setUnderlineColor(color: string) {
        this._decoration = vscode.window.createTextEditorDecorationType({
            borderWidth: '0 0 2px 0',
            borderStyle: 'solid',
            borderColor: color,
        });
    }

    /**
     * Decorates the lines in the specified range of the given text editor.
     *
     * @param editor - The text editor in which to decorate the lines.
     * @param startLine - The starting line of the range to decorate.
     * @param endLine - The ending line of the range to decorate.
     */
    public decorateLines(editor: vscode.TextEditor, startLine: number, endLine: number) {
        // Ensure decoration is initialized before use
        if (!this._decoration) {
            return;
        }

        const doc = editor.document;

        const texts = this._selectionHelper.getFirstAndLastLines(editor, doc);
        if (texts !== undefined) {
            const timePeriod = this._timeCalculator.getTimePeriod(texts.startLine, texts.endLine);

            if (timePeriod !== undefined) {

                const endLineTimestamp = this._timestampParser.getTimestampFromText(texts.endLine);
                if (!endLineTimestamp) {
                    // If no timestamp is found in the end line, we cannot calculate progress
                    return;
                }

                const timestampStartIndex = endLineTimestamp.matchIndex;
                const timestampWidth = endLineTimestamp.original.length;

                const durationInMicroseconds = timePeriod.getDurationAsMicroseconds();
                const startTimeAsEpoch = timePeriod.startTime.getTimeAsEpoch();

                // Iterate over all lines in the selection and decorate them according to their progress
                // (i.e. how far they are from the start time of the selection to the end time of the selection)
                const ranges: vscode.Range[] = [];
                for (let line = startLine; line <= endLine; line++) {
                    const lineText = editor.document.lineAt(line).text;

                    const timestamp = this._timestampParser.getTimestampFromText(lineText);
                    if (timestamp) {
                        const timestampWithMicroseconds = new TimeWithMicroseconds(timestamp.moment, timestamp.microseconds, timestamp.duration);
                        const progress = (timestampWithMicroseconds.getTimeAsEpoch() - startTimeAsEpoch) / durationInMicroseconds;

                        // Max progress = length of timestamp
                        let decorationCharacterCount = Math.floor(timestampWidth * progress);

                        // set decorationCharacterCount to 0 if not a number or infinit
                        if (isNaN(decorationCharacterCount) || !isFinite(decorationCharacterCount) || decorationCharacterCount < 0) {
                            decorationCharacterCount = 0;
                        }

                        const range = new vscode.Range(line, timestampStartIndex, line, timestampStartIndex + decorationCharacterCount);
                        ranges.push(range);
                    }
                }

                editor.setDecorations(this._decoration, ranges);

                vscode.commands.executeCommand('setContext', Constants.ContextNameIsShowingProgressIndicators, true);
            }
        }
    }

    public removeAllDecorations() {
        if (this._decoration) {
            const decoration = this._decoration;
            vscode.window.visibleTextEditors.forEach((editor) => {
                editor.setDecorations(decoration, []);
            });
        }

        vscode.commands.executeCommand('setContext', Constants.ContextNameIsShowingProgressIndicators, false);
    }
}
