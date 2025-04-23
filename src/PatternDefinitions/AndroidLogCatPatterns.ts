'use strict';

import * as vscode from 'vscode';
import { CustomPattern } from '../CustomPattern';
import { LogLevelColors } from './ColorConstants';

export const AndroidLogCatPatterns: CustomPattern[] = [
    // Android logcat /V
    new CustomPattern(
        '(?<=^[\\s\\d\\p]*)\\bV\\b',
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
    // Android logcat /D
    new CustomPattern(
        '(?<=^[\\s\\d\\p]*)\\bD\\b',
        '',
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
    // Android logcat /I
    new CustomPattern(
        '(?<=^[\\s\\d\\p]*)\\bI\\b',
        '',
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
    // Android logcat /W
    new CustomPattern(
        '(?<=^[\\s\\d\\p]*)\\bW\\b',
        '',
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
    // Android logcat /E
    new CustomPattern(
        '(?<=^[\\s\\d\\p]*)\\bE\\b',
        '',
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
