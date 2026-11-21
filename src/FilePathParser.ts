'use strict';

/** A file path found in a text, with the line and column that follow it, if any. */
export interface FilePathMatch {
    /** The index in the text where the match starts. */
    index: number;
    /** The length of the match, including the line and column. */
    length: number;
    /** The path as it's written in the text. */
    path: string;
    /** The 1-based line number, if the path is followed by one. */
    line?: number;
    /** The 1-based column number, if the path is followed by one. */
    column?: number;
}

// One folder or file name. Spaces aren't allowed, since there's no way to tell where a path with spaces starts.
const segment = String.raw`[\w.\-@+~]+`;

// The start of an absolute or explicitly relative path: C:\ or C:/, \\server, / or ./ and ../
const root = String.raw`(?:[A-Za-z]:[\\/]|\\\\|\/|\.{1,2}[\\/])`;

// A path is either a root followed by any number of folders, or at least one folder, followed by a file
// name with an extension. A bare file name like "Program.cs" isn't a path, since it can't be found without
// searching the workspace.
const filePath = String.raw`(?:${root}(?:${segment}[\\/])*|(?:${segment}[\\/])+)${segment}\.[A-Za-z0-9]+(?![\w\-\\/]|\.\w)`;

// The line and column after a path, in the formats of compilers and stack traces:
//   path:42  path:42:7  path(42)  path(42,7)  path:line 42 (.NET)  "path", line 42 (Python)
const position = String.raw`(?::line\s+(\d+)|:(\d+)(?::(\d+))?|\((\d+)(?:,\s*(\d+))?\)|",\s*line\s+(\d+))?`;

// A path doesn't start in the middle of a word or another path.
const pathRegex = new RegExp(String.raw`(?<![\w.\-@+~\\/:])(${filePath})${position}`, 'g');

// URLs, whose paths are handled by VS Code's own link detection.
const urlRegex = /\b[a-z][a-z0-9+.\-]*:\/\/[^\s"'<>]+/gi;

/** Finds the file paths in a text, except those that are part of a URL. */
export function findFilePaths(text: string): FilePathMatch[] {
    const urls: [number, number][] = [];
    urlRegex.lastIndex = 0;
    let url: RegExpExecArray | null;
    while ((url = urlRegex.exec(text)) !== null) {
        urls.push([url.index, url.index + url[0].length]);
    }

    const result: FilePathMatch[] = [];
    let urlIndex = 0;
    pathRegex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pathRegex.exec(text)) !== null) {
        const start = m.index;
        const end = start + m[0].length;

        // Both lists are sorted by position, so skip the URLs that end before this match.
        while (urlIndex < urls.length && urls[urlIndex][1] <= start) {
            urlIndex++;
        }
        if (urlIndex < urls.length && urls[urlIndex][0] < end) {
            continue;
        }

        const line = toNumber(m[2] ?? m[3] ?? m[5] ?? m[7]);
        const column = toNumber(m[4] ?? m[6]);
        result.push({
            index: start,
            length: m[0].length,
            path: m[1],
            line,
            column: line !== undefined ? column : undefined,
        });
    }
    return result;
}

/** Whether a path is absolute, on Windows (C:\ or \\server) or on Linux and macOS (/). */
export function isAbsolutePath(path: string): boolean {
    return /^(?:[A-Za-z]:[\\/]|\\\\|\/)/.test(path);
}

function toNumber(value: string | undefined): number | undefined {
    if (value === undefined) {
        return undefined;
    }
    const n = parseInt(value, 10);
    return n > 0 ? n : undefined;
}
