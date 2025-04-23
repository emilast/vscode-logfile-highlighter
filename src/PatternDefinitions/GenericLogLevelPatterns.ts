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
        '\\b(DEBUG|Debug)\\b|\\b(debug)\\:',
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
        '\\b(HINT|INFO|INFORMATION|Info|NOTICE|II)\\b|\\b(info|information)\\:',
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
        vscode.OverviewRulerLane.Full,
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
        vscode.OverviewRulerLane.Full,
        undefined
    ),
];
