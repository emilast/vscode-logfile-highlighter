import * as vscode from 'vscode';
import TimePeriodCalculator = require('./TimePeriodCalculator');
import { SelectionHelper } from './SelectionHelper';
import moment = require('moment');

class ProgressIndicator {
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

    public underlineLine(editor: vscode.TextEditor, startLine: number, endLine: number) {
        // const range = new vscode.Range(startLine, 0, endLine, Number.MAX_VALUE);
        // editor.setDecorations(this.decoration, [range]);
        // console.log('startLine: ' + startLine + ' endLine: ' + endLine);
        
        const doc = editor.document;

        let texts = this._selectionHelper.getFirstAndLastLines(editor, doc);
        if (texts !== undefined) {
            let timePeriod = this._timeCalculator.getTimePeriod(texts.startLine, texts.endLine);
          
            if (timePeriod !== undefined) {

                let timestampWidth = this._timeCalculator.getTimestampFromText(texts.endLine).original.length;

                let ranges: vscode.Range[] = [];
                for (let line = startLine; line <= endLine; line++) {
                    var lineText = editor.document.lineAt(line).text;
                    var length = lineText.length;


                    var timestamp = this._timeCalculator.getTimestampFromText(lineText);
                    var ts = moment(timestamp.iso);

                    var progress = ts.diff(timePeriod.startTime) / timePeriod.duration.asMilliseconds();


                    // Compensaite for tab charactes
                    // const tabSize = editor.options.tabSize as number;
                    // const tabCount = (lineText.match(/\t/g) || []).length;

                    // length += tabCount * (tabSize - 1);
                    // console.log('line: ' + line + ' text: ' + lineText + ' length: ' + length);

                    // var underlineLength = Math.floor(length * progress);

                    // Max progress = given number of characters
                    var underlineLength = Math.floor(this.maxProgressWidth * progress);

                    // Max progress = length of last line of the selection
                    // var underlineLength = Math.floor(texts.endLine.length * progress);

                    // Max progress = length of timestamp
                    var underlineLength = Math.floor(timestampWidth * progress);


                    // console.log('underlineLength: ' + underlineLength);
                    var range = new vscode.Range(line, 0, line, underlineLength);
                    // console.log('range: ' + range);
                    ranges.push(range);
                }

                editor.setDecorations(this.decoration, ranges);
            }
        }
    }
}

export = ProgressIndicator;