'use strict';

import { CustomPattern } from '../CustomPattern';
import { GeneralColors } from './ColorConstants';

export const TimeAndDatePatterns: CustomPattern[] = [
    // ISO dates ("2016-08-23") 
    new CustomPattern(
        '\\b\\d{4}-\\d{2}-\\d{2}',
        '',
        false,
        GeneralColors.TimeAndDates,
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
    // Culture specific dates ("23/08/2016", "23.08.2016") 
    new CustomPattern(
        '(?<=(^|\\s))\\d{2}[^\\w\\s]\\d{2}[^\\w\\s]\\d{4}\\b',
        '',
        false,
        GeneralColors.TimeAndDates,
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
    // Clock times with optional timezone and optional T prefix ("T09:13:16", "09:13:16", "09:13:16.323", "09:13:16+01:00")
    new CustomPattern(
        '(T|\\b)\\d{1,2}:\\d{2}(:\\d{2}([.,]\\d{1,})?)?(Z| ?[+-]\\d{1,2}:\\d{2})?\\b',
        '',
        false,
        GeneralColors.TimeAndDates,
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
    // Clock times without separator and with optional timezone ("T091316", "T091316.323", "T091316+0100")
    new CustomPattern(
        'T\\d{2}\\d{2}(\\d{2}([.,]\\d{1,})?)?(Z| ?[+-]\\d{1,2}\\d{2})?\\b',
        '',
        false,
        GeneralColors.TimeAndDates,
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
];
