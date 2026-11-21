'use strict';

import * as vscode from 'vscode';
import { Constants } from './Constants';

/**
 * Tail mode: every visible log editor that shows the end of its file follows the file, i.e. scrolls to the
 * end when lines are added. This includes editors that aren't active, such as one in a floating window or
 * the other side of a split editor (#688). Scrolling up in an editor stops it following the file.
 */
export class TailController {

    private _disposable: vscode.Disposable | undefined;
    private _statusBarItem: vscode.StatusBarItem | undefined;
    private _configurationListener: vscode.Disposable;

    /** The visible editors that show the end of their file and follow it. */
    private _tailingEditors = new Set<vscode.TextEditor>();

    /** One watcher per followed file, keyed by the file's URI, which detects changes made outside VS Code. */
    private _fileWatchers = new Map<string, vscode.FileSystemWatcher>();

    constructor() {

        this._configurationListener = vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('logFileHighlighter')) {
                this.init();
            }
        }, this);

        this.init();
    }

    public dispose() {
        this._configurationListener.dispose();
        this.stopTailing();
    }

    private init() {
        // Remove the event handlers from any earlier call, so that they aren't registered more than once
        this.stopTailing();

        if (!this.getConfiguration().enableTailMode) {
            return;
        }

        this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);

        const subscriptions: vscode.Disposable[] = [];

        vscode.workspace.onDidChangeTextDocument((event) => {
            this.followDocument(event.document);
        }, this, subscriptions);

        vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
            this.onVisibleRangesChanged(event.textEditor);
        }, this, subscriptions);

        vscode.window.onDidChangeVisibleTextEditors(() => {
            this.onVisibleEditorsChanged();
        }, this, subscriptions);

        this._disposable = vscode.Disposable.from(...subscriptions);

        this.onVisibleEditorsChanged();
    }

    private stopTailing() {
        this._tailingEditors.clear();
        if (this._statusBarItem) {
            this._statusBarItem.dispose();
            this._statusBarItem = undefined;
        }
        if (this._disposable) {
            this._disposable.dispose();
            this._disposable = undefined;
        }
        for (const watcher of this._fileWatchers.values()) {
            watcher.dispose();
        }
        this._fileWatchers.clear();
    }

    private getConfiguration(): { enableTailMode: boolean } {
        const config = vscode.workspace.getConfiguration('logFileHighlighter');

        return {
            enableTailMode: config.get('enableTailMode', true)
        };
    }

    /** Editors were opened, closed or moved, so check all visible editors again. */
    private onVisibleEditorsChanged() {
        this._tailingEditors.clear();
        for (const editor of vscode.window.visibleTextEditors) {
            if (this.isEndOfFileVisible(editor)) {
                this._tailingEditors.add(editor);
            }
        }
        this.update();
    }

    /** The editor was scrolled, so it starts or stops following its file. */
    private onVisibleRangesChanged(editor: vscode.TextEditor) {
        if (this.isEndOfFileVisible(editor) && vscode.window.visibleTextEditors.includes(editor)) {
            this._tailingEditors.add(editor);
        } else {
            this._tailingEditors.delete(editor);
        }
        this.update();
    }

    private isEndOfFileVisible(editor: vscode.TextEditor): boolean {
        const visibleRanges = editor.visibleRanges;
        if (editor.document.languageId !== Constants.LogLanguageId || !visibleRanges || visibleRanges.length === 0) {
            return false;
        }

        // With folded regions there is more than one visible range, so use the last one
        const lastVisibleLine = visibleRanges[visibleRanges.length - 1].end.line;
        return lastVisibleLine >= editor.document.lineCount - 1;
    }

    /** Scrolls every editor that follows the document to its end. */
    private followDocument(document: vscode.TextDocument) {
        const lastLine = document.lineCount - 1;
        const range = new vscode.Range(lastLine, 0, lastLine, 0);

        for (const editor of this._tailingEditors) {
            if (editor.document === document) {
                editor.revealRange(range, vscode.TextEditorRevealType.Default);
            }
        }
    }

    /** Updates the file watchers and the status bar after the set of following editors changed. */
    private update() {
        this.updateFileWatchers();
        this.updateStatusBar();
    }

    private updateStatusBar() {
        if (!this._statusBarItem) {
            return;
        }

        const count = this._tailingEditors.size;
        if (count === 0) {
            this._statusBarItem.hide();
            return;
        }

        this._statusBarItem.text = 'Log File Tail Mode';
        this._statusBarItem.tooltip = (count === 1
            ? 'The end of a log file is visible in an editor, '
            : `The end of a log file is visible in ${count} editors, `)
            + 'which activates the Log File Highlighter tail mode. While it is active, an editor that shows the end of a file '
            + 'automatically scrolls to the end when new lines are added. Scroll up in an editor to stop it.';
        this._statusBarItem.show();
    }

    private updateFileWatchers() {
        const followedUris = new Map<string, vscode.Uri>();
        for (const editor of this._tailingEditors) {
            const uri = editor.document.uri;
            // Documents such as the Output panel and unsaved files have no file to watch
            if (uri.scheme !== 'untitled' && uri.scheme !== 'output') {
                followedUris.set(uri.toString(), uri);
            }
        }

        // Stop watching files that no editor follows any longer
        for (const [key, watcher] of this._fileWatchers) {
            if (!followedUris.has(key)) {
                watcher.dispose();
                this._fileWatchers.delete(key);
            }
        }

        // Start watching newly followed files. Existing watchers are kept, since this runs on every scroll event.
        for (const [key, uri] of followedUris) {
            if (!this._fileWatchers.has(key)) {
                this._fileWatchers.set(key, this.createFileWatcher(uri));
            }
        }
    }

    private createFileWatcher(uri: vscode.Uri): vscode.FileSystemWatcher {
        // Watch the folder of the file and only react to changes of the file itself. A RelativePattern
        // with a base folder is used rather than a glob of the full path, so that characters with a special
        // meaning in globs, like [ ] { }, in the path are never interpreted as a pattern.
        const folder = vscode.Uri.joinPath(uri, '..');
        const watcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(folder, '*'), false, false, true);

        watcher.onDidChange((changedUri) => {
            if (changedUri.toString() === uri.toString()) {
                this.onFileChanged(uri);
            }
        });

        return watcher;
    }

    /** The file changed on disk, e.g. when a program appended lines to it. */
    private onFileChanged(uri: vscode.Uri) {
        for (const editor of this._tailingEditors) {
            if (editor.document.uri.toString() === uri.toString()) {
                this.followDocument(editor.document);
                return;
            }
        }
    }
}
