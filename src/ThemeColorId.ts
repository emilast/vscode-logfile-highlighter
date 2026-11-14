'use strict';

// A theme color id, such as 'terminal.ansiGreen' or 'editorError.foreground', is two or more
// identifiers separated by dots. CSS colors never look like that: names ('red'), hex values
// ('#ff5588') and functions ('rgba(255, 0, 0, 0.5)') have no dot between two identifiers.
const THEME_COLOR_ID_PATTERN = /^[a-zA-Z][\w-]*(\.[a-zA-Z][\w-]*)+$/;

/**
 * Returns true if the color setting refers to a color of the current theme, e.g. 'terminal.ansiGreen',
 * rather than being a CSS color. See https://code.visualstudio.com/api/references/theme-color.
 */
export function isThemeColorId(color: string | undefined): boolean {
    return typeof color === 'string' && THEME_COLOR_ID_PATTERN.test(color.trim());
}
