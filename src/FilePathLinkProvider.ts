'use strict';

import * as vscode from 'vscode';
import { Constants } from './Constants';
import { FilePathMatch, findFilePaths, isAbsolutePath } from './FilePathParser';

/**
 * Makes file paths in log files clickable, e.g. `D:\src\app\Program.cs:42` or `src/app.ts(12,5)`, so that
 * they open the file at that line (#502). Only paths to files that exist get a link. Relative paths are
 * looked up next to the log file and in the workspace folders.
 */
export class FilePathLinkProvider implements vscode.DocumentLinkProvider, vscode.Disposable {

    /** How long to wait for a file to be found, e.g. on a slow network share, before skipping it. */
    private static readonly StatTimeoutMs = 2000;

    /** At most this many different paths are looked up per document, to keep huge logs fast. */
    private static readonly MaxPathsPerDocument = 1000;

    private _registration: vscode.Disposable;

    constructor() {
        this._registration = vscode.languages.registerDocumentLinkProvider({ language: Constants.LogLanguageId }, this);
    }

    public dispose() {
        this._registration.dispose();
    }

    public async provideDocumentLinks(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.DocumentLink[]> {
        if (!vscode.workspace.getConfiguration('logFileHighlighter').get<boolean>('enableFileLinks', true)) {
            return [];
        }

        const matches = findFilePaths(document.getText());
        if (matches.length === 0) {
            return [];
        }

        // Look up each path once, even if it occurs on many lines
        const resolved = new Map<string, Promise<vscode.Uri | undefined>>();
        for (const match of matches) {
            if (!resolved.has(match.path) && resolved.size < FilePathLinkProvider.MaxPathsPerDocument) {
                resolved.set(match.path, this.resolve(match.path, document));
            }
        }

        const links: vscode.DocumentLink[] = [];
        for (const match of matches) {
            if (token.isCancellationRequested) {
                return [];
            }
            const uri = await resolved.get(match.path);
            if (uri) {
                const range = new vscode.Range(document.positionAt(match.index), document.positionAt(match.index + match.length));
                links.push(new vscode.DocumentLink(range, FilePathLinkProvider.withPosition(uri, match)));
            }
        }
        return links;
    }

    /** The file that a path refers to, or undefined if there's no such file. */
    private async resolve(path: string, document: vscode.TextDocument): Promise<vscode.Uri | undefined> {
        for (const candidate of FilePathLinkProvider.candidates(path, document)) {
            if (await FilePathLinkProvider.isFile(candidate)) {
                return candidate;
            }
        }
        return undefined;
    }

    /** The files that a path may refer to, in the order they're tried. */
    private static candidates(path: string, document: vscode.TextDocument): vscode.Uri[] {
        const documentUri = document.uri;
        const isLocal = documentUri.scheme === 'file' || documentUri.scheme === 'untitled';

        if (isAbsolutePath(path)) {
            // In a remote window (WSL, SSH, containers), paths in the log refer to the remote machine
            if (!isLocal && path.startsWith('/')) {
                return [documentUri.with({ path, query: '', fragment: '' })];
            }
            return [vscode.Uri.file(path)];
        }

        const segments = path.split(/[\\/]/);
        const folders: vscode.Uri[] = [];
        if (documentUri.scheme !== 'untitled') {
            folders.push(vscode.Uri.joinPath(documentUri, '..'));
        }
        for (const folder of vscode.workspace.workspaceFolders ?? []) {
            folders.push(folder.uri);
        }
        return folders.map((folder) => vscode.Uri.joinPath(folder, ...segments));
    }

    private static async isFile(uri: vscode.Uri): Promise<boolean> {
        let timer: NodeJS.Timeout | undefined;
        const timeout = new Promise<boolean>((resolve) => {
            timer = setTimeout(() => resolve(false), FilePathLinkProvider.StatTimeoutMs);
        });
        const stat = Promise.resolve(vscode.workspace.fs.stat(uri)).then(
            (s) => (s.type & vscode.FileType.File) !== 0,
            () => false);
        try {
            return await Promise.race([stat, timeout]);
        } finally {
            clearTimeout(timer);
        }
    }

    /** Adds the line and column to the link, which VS Code moves the cursor to when it opens the file. */
    private static withPosition(uri: vscode.Uri, match: FilePathMatch): vscode.Uri {
        if (match.line === undefined) {
            return uri;
        }
        return uri.with({ fragment: match.column !== undefined ? `L${match.line},${match.column}` : `L${match.line}` });
    }
}
