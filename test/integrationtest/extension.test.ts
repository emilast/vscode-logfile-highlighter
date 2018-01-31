'use strict';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as proxyquire from 'proxyquire';
import * as vscode from 'vscode';
import * as highlighter from '../../src/extension';

describe('foo', () => {
    it('bar', () => {
        class TimePeriodCalculatorMock {
            constructor() {
                console.log('Hello MockWorld');
            }
        }

        const extension = proxyquire('../../src/extension', {
            './TimePeriodCalculator': TimePeriodCalculatorMock
        });
        extension.activate(null);
        expect(1 + 1).toEqual(2);
    });
});
