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
        LogLevelColors.Verbose,
        vscode.OverviewRulerLane.Full,
        undefined
    ),
    // Debug
    new CustomPattern(
        '\\[(debug|dbug|dbg|de|d)\\]',
        'i',
        false,
        LogLevelColors.Debug,
        undefined,
        'bold',
        'normal',
        undefined,
        undefined,
        undefined,
        undefined,
        LogLevelColors.Debug,
        vscode.OverviewRulerLane.Full,
        undefined
    ),
    // Info
    new CustomPattern(
        '\\[(information|info|inf|in|i)\\]',
        'i',
        false,
        LogLevelColors.Info,
        undefined,
        'bold',
        'normal',
        undefined,
        undefined,
        undefined,
        undefined,
        LogLevelColors.Info,
        vscode.OverviewRulerLane.Full,
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
        vscode.OverviewRulerLane.Full,
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
        vscode.OverviewRulerLane.Full,
        undefined
    ),
];
