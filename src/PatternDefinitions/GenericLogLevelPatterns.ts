'use strict';

import * as vscode from 'vscode';
import { CustomPattern } from '../CustomPattern';
import { LogLevelColors } from './ColorConstants';

export const GenericLogLevelPatterns: CustomPattern[] = [
    // Trace/Verbose
    new CustomPattern(
        '\\b(Trace)\\b:',
        '',
        false,
        LogLevelColors.Verbose,
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

    // Debug
    new CustomPattern(
        '\\b(DEBUG|Debug)\\b|\\b(debug)\\:',
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
        '\\b(HINT|INFO|INFORMATION|Info|NOTICE|II)\\b|\\b(info|information)\\:',
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
        '\\b(WARNING|WARN|Warn|WW)\\b|\\b(warning)\\:',
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
        '\\b(ALERT|CRITICAL|EMERGENCY|ERROR|FAILURE|FAIL|Fatal|FATAL|Error|EE)\\b|\\b(error)\\:',
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
