import * as vscode from 'vscode';
import { TimePeriodCalculator } from './TimePeriodCalculator';
import { SelectionHelper } from './SelectionHelper';
import moment = require('moment');
import { Constants } from './Constants';
import { TimeWithMicroseconds } from './TimeWithMicroseconds';
import { TimestampParser } from './TimestampParsers/TimestampParser';

export class ProgressIndicator {

    private _decoration: vscode.TextEditorDecorationType;;
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
        const doc = editor.document;

        let texts = this._selectionHelper.getFirstAndLastLines(editor, doc);
        if (texts !== undefined) {
            let timePeriod = this._timeCalculator.getTimePeriod(texts.startLine, texts.endLine);

            if (timePeriod !== undefined) {

                const endLineTimestamp = this._timestampParser.getTimestampFromText(texts.endLine);
                if (!endLineTimestamp) {
                    // If no timestamp is found in the end line, we cannot calculate progress
                    return;
                }
                
                let timestampStartIndex = endLineTimestamp.matchIndex;
                let timestampWidth = endLineTimestamp.original.length;

                const durationInMicroseconds = timePeriod.getDurationAsMicroseconds();
                const startTimeAsEpoch = timePeriod.startTime.getTimeAsEpoch();

                // Iterate over all lines in the selection and decorate them according to their progress
                // (i.e. how far they are from the start time of the selection to the end time of the selection)
                let ranges: vscode.Range[] = [];
                for (let line = startLine; line <= endLine; line++) {
                    var lineText = editor.document.lineAt(line).text;

                    var timestamp = this._timestampParser.getTimestampFromText(lineText);
                    if (timestamp) {
                        let timestampWithMicroseconds = new TimeWithMicroseconds(timestamp.moment, timestamp.microseconds);
                        var progress = (timestampWithMicroseconds.getTimeAsEpoch() - startTimeAsEpoch) / durationInMicroseconds;

                        // Max progress = length of timestamp
                        var decorationCharacterCount = Math.floor(timestampWidth * progress);

                        // set decorationCharacterCount to 0 if not a number or infinit
                        if (isNaN(decorationCharacterCount) || !isFinite(decorationCharacterCount) || decorationCharacterCount < 0) {
                            decorationCharacterCount = 0;
                        }

                        var range = new vscode.Range(line, timestampStartIndex, line, timestampStartIndex + decorationCharacterCount);
                        ranges.push(range);
                    }
                }

                editor.setDecorations(this._decoration, ranges);

                vscode.commands.executeCommand('setContext', Constants.ContextNameIsShowingProgressIndicators, true);
            }
        }
    }

    removeAllDecorations() {
        if (this._decoration) {
            vscode.window.visibleTextEditors.forEach(editor => {
                editor.setDecorations(this._decoration, []);
            });
        }

        vscode.commands.executeCommand('setContext', Constants.ContextNameIsShowingProgressIndicators, false);
    }
}