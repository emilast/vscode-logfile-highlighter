'use strict';

import * as vscode from 'vscode';
import { CustomPattern } from '../CustomPattern';
import { GeneralColors } from './ColorConstants';

export const PathPatterns: CustomPattern[] = [
    // URLs
    new CustomPattern(
        '\\b[a-z]+://\\S+\\b/?',
        // 'http',
        '',
        false,
        GeneralColors.Paths,
        undefined,
        'normal',
        'normal',
        undefined,
        undefined,
        undefined,
        undefined,
        GeneralColors.Paths,
        vscode.OverviewRulerLane.Full,
        undefined
    ),
    // Match character and . sequences (such as namespaces)	as well as file names and extensions (e.g. bar.txt)
    new CustomPattern(
        '(?<![\\w/\\\\])([\\w-]+\\.)+([\\w-])+(?![\\w/\\\\])',
        // 'http',
        '',
        false,
        GeneralColors.Paths,
        undefined,
        'normal',
        'normal',
        undefined,
        undefined,
        undefined,
        undefined,
        GeneralColors.Paths,
        vscode.OverviewRulerLane.Full,
        undefined
    ),
];
