'use strict';

import * as vscode from 'vscode';
import { CustomPattern } from '../CustomPattern';
import { LogLevelColors } from './ColorConstants';

export const SerilogPatterns: CustomPattern[] = [
    // Trace/Verbose
    new CustomPattern(
        '\\[(verbose|verb|vrb|vb|v)\\]',
        'i',
        false,
        LogLevelColors.Verbose,
        undefined,
        'normal',
        'italic',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
    ),
    // Debug
    new CustomPattern(
        '\\[(debug|dbug|dbg|de|d)\\]',
        'i',
        false,
        LogLevelColors.Debug,
        undefined,
        'normal',
        'normal',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
    ),
    // Info
    new CustomPattern(
        '\\[(information|info|inf|in|i)\\]',
        'i',
        false,
        LogLevelColors.Info,
        undefined,
        'normal',
        'normal',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
    ),
    // Warning
    new CustomPattern(
        '\\[(warning|warn|wrn|wn|w)\\]',
        'i',
        false,
        LogLevelColors.Warning,
        undefined,
        'bold',
        'normal',
        undefined,
        undefined,
        undefined,
        undefined,
        LogLevelColors.Warning,
        vscode.OverviewRulerLane.Center,
        undefined
    ),
    // Error
    new CustomPattern(
        '\\[(error|eror|err|er|e|fatal|fatl|ftl|fa|f)\\]',
        'i',
        false,
        LogLevelColors.Error,
        undefined,
        'bold',
        'normal',
        undefined,
        undefined,
        undefined,
        undefined,
        LogLevelColors.Error,
        vscode.OverviewRulerLane.Right,
        undefined
    ),
];
