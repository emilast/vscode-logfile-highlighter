'use strict';

import * as vscode from 'vscode';
import { CustomPattern } from '../CustomPattern';
import { GeneralColors } from './ColorConstants';

export const ConstantsPatterns: CustomPattern[] = [
    // Covered by the new MAC address regex below
    // Git commit hashes of length 40, 10 or 7 
    // new CustomPattern(
    //     '\\b([0-9a-fA-F]{40}|[0-9a-fA-F]{10}|[0-9a-fA-F]{7})\\b',
    //     '',
    //     false,
    //     GeneralColors.Constants,
    //     undefined,
    //     'normal',
    //     'normal',
    //     undefined,
    //     undefined,
    //     undefined,
    //     undefined,
    //     GeneralColors.Constants,
    //     vscode.OverviewRulerLane.Full,
    //     undefined
    // ),
    // Guids
    new CustomPattern(
        '\\b[0-9a-fA-F]{8}[-]?([0-9a-fA-F]{4}[-]?){3}[0-9a-fA-F]{12}\\b',
        '',
        false,
        GeneralColors.Constants,
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
    // MAC addresses: 89:A1:23:45:AB:C0, fde8:e767:269c:0:9425:3477:7c8f:7f1a
    new CustomPattern(
        // '\\b([0-9a-fA-F]{2,}[:-])+([0-9a-fA-F]{2,})+\\b',
        '\\b([0-9a-fA-F])+([0-9a-fA-F:-])+\\b', // Easier regex than before
        '', // TODO: Make greedy
        false,
        GeneralColors.Constants,
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
    // Constants
    new CustomPattern(
        '\\b([0-9]+|true|false|null)\\b',
        '',
        false,
        GeneralColors.Constants,
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
    // HEX constants
    new CustomPattern(
        '\\b(0x[a-fA-F0-9]+)\\b',
        '',
        false,
        GeneralColors.Constants,
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
    // String constants (double quotes)
    new CustomPattern(
        '"[^"]*"',
        '',
        false,
        GeneralColors.StringConstants,
        undefined,
        'normal',
        'normal',
        undefined,
        undefined,
        undefined,
        undefined,
        GeneralColors.StringConstants,
        vscode.OverviewRulerLane.Full,
        undefined
    ),
    // String constants (single quotes)
    new CustomPattern(
        // '\'[^\']*\'', // Original: (?<![\w])'[^']*'
        '(?<![\\w])\'[^\']*\'', // NB: Excludes single quotes inside strings such as "don't"
        '',
        false,
        GeneralColors.StringConstants,
        undefined,
        'normal',
        'normal',
        undefined,
        undefined,
        undefined,
        undefined,
        GeneralColors.StringConstants,
        vscode.OverviewRulerLane.Full,
        undefined
    ),
];
