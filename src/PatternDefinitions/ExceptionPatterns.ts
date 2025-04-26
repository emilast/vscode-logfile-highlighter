'use strict';

import * as vscode from 'vscode';
import { CustomPattern } from '../CustomPattern';
import { GeneralColors } from './ColorConstants';

export const ExceptionPatterns: CustomPattern[] = [
    // Exception type names 
    new CustomPattern(
        '\\b([a-zA-Z.]*Exception)\\b',
        '',
        false,
        GeneralColors.Exceptions,
        undefined,
        'normal',
        'normal',
        undefined,
        undefined,
        undefined,
        undefined,
        GeneralColors.Constants,
        vscode.OverviewRulerLane.Full,
        undefined
    ),
    // Exception call stack rows 
    new CustomPattern(
        '^[\t ]*at[\t ]',
        '',
        false,
        GeneralColors.Exceptions,
        undefined,
        'normal',
        'normal',
        undefined,
        undefined,
        undefined,
        undefined,
        GeneralColors.Constants,
        vscode.OverviewRulerLane.Full,
        undefined
    ),
];
