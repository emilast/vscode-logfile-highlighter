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
        undefined,
        undefined,
        undefined
    ),
    // Android logcat /D
    new CustomPattern(
        '(?<=^[\\s\\d\\p]*)\\bD\\b',
        '',
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
    // Android logcat /I
    new CustomPattern(
        '(?<=^[\\s\\d\\p]*)\\bI\\b',
        '',
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
        vscode.OverviewRulerLane.Center,
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
        vscode.OverviewRulerLane.Right,
        undefined
    ),
];
