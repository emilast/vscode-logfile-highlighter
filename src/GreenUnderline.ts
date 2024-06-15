import * as vscode from 'vscode';
import TimePeriodCalculator = require('./TimePeriodCalculator');
import { time } from 'console';
import { SelectionHelper } from './SelectionHelper';
import moment = require('moment');

class GreenUnderline {
    private readonly decoration: vscode.TextEditorDecorationType;
    private _timeCalculator: TimePeriodCalculator;
    private _selectionHelper: SelectionHelper;

    private maxProgressWidth:number = 40;

    constructor(timeCalculator: TimePeriodCalculator, selectionHelper: SelectionHelper ) {
        this._timeCalculator = timeCalculator;
        this._selectionHelper = selectionHelper;

        this.decoration = vscode.window.createTextEditorDecorationType({
            // textDecoration: 'underline',
            borderWidth: '0 0 2px 0',
            borderStyle: 'solid',
            borderColor: 'green'
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

                let ranges: vscode.Range[] = [];
                for (let line = startLine; line <= endLine; line++) {
                    var lineText = editor.document.lineAt(line).text;
                    var length = lineText.length;


                    var timestamp = this._timeCalculator.getTimestampFromText(lineText);
                    var ts = moment(timestamp);

                    var progress = ts.diff(timePeriod.startTime) / timePeriod.duration.asMilliseconds();


                    // Compensaite for tab charactes
                    // const tabSize = editor.options.tabSize as number;
                    // const tabCount = (lineText.match(/\t/g) || []).length;

                    // length += tabCount * (tabSize - 1);
                    // console.log('line: ' + line + ' text: ' + lineText + ' length: ' + length);

                    // var underlineLength = Math.floor(length * progress);
                    var underlineLength = Math.floor(this.maxProgressWidth * progress);

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

export = GreenUnderline;