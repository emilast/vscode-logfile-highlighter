// A color is either one of the 16 basic ANSI colors (0-15, rendered with the theme's terminal colors)
// or an explicit hex color string (from the 256 color palette or 24-bit "truecolor").
export type AnsiColor = number | string;

export interface AnsiStyle {
    foreground?: AnsiColor;
    background?: AnsiColor;
    bold: boolean;
    dim: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    inverse: boolean;
}

export interface AnsiStyledSegment {
    line: number;
    start: number;
    end: number;
    style: AnsiStyle;
    styleKey: string;
}

export interface AnsiEscapeSegment {
    line: number;
    start: number;
    end: number;
}

export interface AnsiParseResult {
    styled: AnsiStyledSegment[];
    escapes: AnsiEscapeSegment[];
}

const ESC = '\x1b';

// Matches CSI escape sequences: ESC [ <parameter bytes> <intermediate bytes> <final byte>.
// Only sequences ending with 'm' (SGR) affect the style, but all of them are reported as escapes.
const CsiRegex = /\x1b\[([0-?]*)[ -\/]*([@-~])/g;

const CubeLevels = [0, 95, 135, 175, 215, 255];

export function isDefaultStyle(style: AnsiStyle): boolean {
    return style.foreground === undefined
        && style.background === undefined
        && !style.bold
        && !style.dim
        && !style.italic
        && !style.underline
        && !style.strikethrough
        && !style.inverse;
}

export function getStyleKey(style: AnsiStyle): string {
    return [
        style.foreground ?? '',
        style.background ?? '',
        style.bold ? 'b' : '',
        style.dim ? 'd' : '',
        style.italic ? 'i' : '',
        style.underline ? 'u' : '',
        style.strikethrough ? 's' : '',
        style.inverse ? 'r' : ''
    ].join('|');
}

// Parses ANSI escape sequences in the given text. Styles carry over line breaks, the same way as in a terminal.
// Positions are zero-based line numbers and character offsets within each line.
export function parseAnsi(text: string): AnsiParseResult {
    const result: AnsiParseResult = { styled: [], escapes: [] };

    if (text.indexOf(ESC) === -1) {
        return result;
    }

    let style = createDefaultStyle();
    const lines = text.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        let line = lines[lineIndex];
        if (line.endsWith('\r')) {
            line = line.slice(0, -1);
        }

        if (line.indexOf(ESC) === -1) {
            if (line.length > 0 && !isDefaultStyle(style)) {
                result.styled.push(createSegment(lineIndex, 0, line.length, style));
            }
            continue;
        }

        let position = 0;
        CsiRegex.lastIndex = 0;
        let match = CsiRegex.exec(line);

        while (match) {
            if (match.index > position && !isDefaultStyle(style)) {
                result.styled.push(createSegment(lineIndex, position, match.index, style));
            }

            const end = match.index + match[0].length;
            result.escapes.push({ line: lineIndex, start: match.index, end });

            if (match[2] === 'm') {
                style = applySgr(style, match[1]);
            }

            position = end;
            match = CsiRegex.exec(line);
        }

        if (position < line.length && !isDefaultStyle(style)) {
            result.styled.push(createSegment(lineIndex, position, line.length, style));
        }
    }

    return result;
}

// Converts a color index in the xterm 256 color palette to a hex color. Indexes 0-15 are kept as
// basic colors so that they follow the color theme.
export function convert256Color(index: number): AnsiColor {
    if (index < 16) {
        return index;
    }

    if (index < 232) {
        const value = index - 16;
        return toHex(
            CubeLevels[Math.floor(value / 36)],
            CubeLevels[Math.floor(value / 6) % 6],
            CubeLevels[value % 6]);
    }

    const gray = 8 + (index - 232) * 10;
    return toHex(gray, gray, gray);
}

function createDefaultStyle(): AnsiStyle {
    return {
        bold: false,
        dim: false,
        italic: false,
        underline: false,
        strikethrough: false,
        inverse: false
    };
}

function createSegment(line: number, start: number, end: number, style: AnsiStyle): AnsiStyledSegment {
    return { line, start, end, style, styleKey: getStyleKey(style) };
}

function applySgr(current: AnsiStyle, parameters: string): AnsiStyle {
    // Copy, since segments that have already been emitted refer to the current style object.
    const style: AnsiStyle = { ...current };
    const params = parameters === '' ? ['0'] : parameters.split(';');

    for (let i = 0; i < params.length; i++) {
        const param = params[i];

        // Colon separated sub parameters, e.g. "38:2::255:0:0" or "38:5:208".
        if (param.indexOf(':') !== -1) {
            const subParams = param.split(':');
            const colorCode = toNumber(subParams[0]);
            if (colorCode === 38 || colorCode === 48) {
                const color = parseExtendedColor(subParams.slice(1).map(toNumber), true);
                setExtendedColor(style, colorCode, color);
            }
            continue;
        }

        const code = toNumber(param);

        if (code === 38 || code === 48) {
            const rest = params.slice(i + 1).map(toNumber);
            const color = parseExtendedColor(rest, false);
            setExtendedColor(style, code, color);
            i += rest[0] === 5 ? 2 : rest[0] === 2 ? 4 : 0;
            continue;
        }

        applyCode(style, code);
    }

    return style;
}

function applyCode(style: AnsiStyle, code: number) {
    if (code === 0) {
        Object.assign(style, createDefaultStyle());
        style.foreground = undefined;
        style.background = undefined;
    } else if (code === 1) {
        style.bold = true;
    } else if (code === 2) {
        style.dim = true;
    } else if (code === 3) {
        style.italic = true;
    } else if (code === 4 || code === 21) {
        style.underline = true;
    } else if (code === 7) {
        style.inverse = true;
    } else if (code === 9) {
        style.strikethrough = true;
    } else if (code === 22) {
        style.bold = false;
        style.dim = false;
    } else if (code === 23) {
        style.italic = false;
    } else if (code === 24) {
        style.underline = false;
    } else if (code === 27) {
        style.inverse = false;
    } else if (code === 29) {
        style.strikethrough = false;
    } else if (code >= 30 && code <= 37) {
        style.foreground = code - 30;
    } else if (code === 39) {
        style.foreground = undefined;
    } else if (code >= 40 && code <= 47) {
        style.background = code - 40;
    } else if (code === 49) {
        style.background = undefined;
    } else if (code >= 90 && code <= 97) {
        style.foreground = code - 90 + 8;
    } else if (code >= 100 && code <= 107) {
        style.background = code - 100 + 8;
    }
}

// Parses the parameters following 38/48: either "5;n" or "2;r;g;b".
// With colon separated sub parameters, the 24-bit form may also contain a color space id: "2::r:g:b".
function parseExtendedColor(params: number[], colonSeparated: boolean): AnsiColor | undefined {
    if (params[0] === 5 && params.length >= 2) {
        return convert256Color(clamp(params[1]));
    }

    if (params[0] === 2) {
        const rgb = colonSeparated && params.length >= 5 ? params.slice(2, 5) : params.slice(1, 4);
        if (rgb.length === 3) {
            return toHex(clamp(rgb[0]), clamp(rgb[1]), clamp(rgb[2]));
        }
    }

    return undefined;
}

function setExtendedColor(style: AnsiStyle, code: number, color: AnsiColor | undefined) {
    if (color === undefined) {
        return;
    }

    if (code === 38) {
        style.foreground = color;
    } else {
        style.background = color;
    }
}

function toNumber(value: string): number {
    const result = parseInt(value, 10);
    return isNaN(result) ? 0 : result;
}

function clamp(value: number): number {
    return Math.max(0, Math.min(255, value));
}

function toHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map((value) => ('0' + value.toString(16)).slice(-2)).join('');
}
