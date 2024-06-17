import * as vscode from 'vscode';
import { TimePeriodCalculator } from './TimePeriodCalculator';
import { SelectionHelper } from './SelectionHelper';
import moment = require('moment');

export class ProgressIndicator {
    private readonly decoration: vscode.TextEditorDecorationType;
    private _timeCalculator: TimePeriodCalculator;
    private _selectionHelper: SelectionHelper;

    private maxProgressWidth:number = 25;

    constructor(timeCalculator: TimePeriodCalculator, selectionHelper: SelectionHelper ) {
        this._timeCalculator = timeCalculator;
        this._selectionHelper = selectionHelper;

        this.decoration = vscode.window.createTextEditorDecorationType({
            // textDecoration: 'underline',
            borderWidth: '0 0 2px 0',
            borderStyle: 'solid',
            borderColor: '#00ff1f8f',
            // backgroundColor: '#00ff1f0f'
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

                let timestampStartIndex = this._timeCalculator.getTimestampFromText(texts.endLine).matchIndex;
                let timestampWidth = this._timeCalculator.getTimestampFromText(texts.endLine).original.length;

                // Iterate over all lines in the selection and decorate them according to their progress
                // (i.e. how far they are from the start time of the selection to the end time of the selection)
                let ranges: vscode.Range[] = [];
                for (let line = startLine; line <= endLine; line++) {
                    var lineText = editor.document.lineAt(line).text;

                    var timestamp = this._timeCalculator.getTimestampFromText(lineText);
                    var ts = moment(timestamp.iso);

                    var progress = ts.diff(timePeriod.startTime) / timePeriod.duration.asMilliseconds();

                    // Max progress = length of timestamp
                    var decorationCharacterCount = Math.floor(timestampWidth * progress);

                    // set decorationCharacterCount to 0 if not a number or infinit
                    if (isNaN(decorationCharacterCount) || !isFinite(decorationCharacterCount)) {
                        decorationCharacterCount = 0;
                    }
                    
                    var range = new vscode.Range(line, timestampStartIndex, line, timestampStartIndex + decorationCharacterCount);

                    ranges.push(range);
                }

                editor.setDecorations(this.decoration, ranges);
            }
        }
    }
}