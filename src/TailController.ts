'use strict';

import * as vscode from 'vscode';
import { Constants } from './Constants';

export class TailController {

    private _disposable: vscode.Disposable | undefined;
    private _statusBarItem: vscode.StatusBarItem | undefined;
    private _fileSystemWatcher: vscode.FileSystemWatcher | undefined;
    private _watchedUri: string | undefined;
    private _configurationListener: vscode.Disposable;

    private _tailModeActive: boolean = false;

    constructor() {

        this._configurationListener = vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('logFileHighlighter')) {
                this.onDidChangeConfiguration();
            }
        }, this);

        this.init();
    }

    private init() {
        const config = this.getConfiguration();

        // Remove the event handlers from any earlier call, so that they aren't registered more than once
        this.stopTailing();

        if (config.enableTailMode) {
            // Create as needed
            if (!this._statusBarItem) {
                this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
                this._statusBarItem.tooltip = 'The end of the file is visible, which activates the Log File Highlighter tail mode. When active, the editor will automatically scroll to the end of the file when new lines are added.';
            }

            // subscribe to selection change and editor activation events
            const subscriptions: vscode.Disposable[] = [];

            vscode.workspace.onDidChangeTextDocument(event => {
                this.tailLogFile(event.document);
            }, this, subscriptions);

            vscode.window.onDidChangeTextEditorVisibleRanges(event => {
                this.checkEndOfFileVisibilityInActiveEditor();
            }, this, subscriptions);

            vscode.window.onDidChangeActiveTextEditor(event => {
                this.editorChanged();
            }, this, subscriptions);

            // create a combined disposable from both event subscriptions
            this._disposable = vscode.Disposable.from(...subscriptions);

            this.checkEndOfFileVisibilityInActiveEditor();
        }
    }

    private onDidChangeConfiguration(): void {
        this.init();
    }

    public dispose() {
        this._configurationListener.dispose();
        this.stopTailing();
    }

    private stopTailing() {
        this._tailModeActive = false;
        if (this._statusBarItem) {
            this._statusBarItem.dispose();
            this._statusBarItem = undefined;
        }
        if (this._disposable) {
            this._disposable.dispose();
            this._disposable = undefined;
        }
        this.disposeFileWatcher();
    }

    private disposeFileWatcher() {
        if (this._fileSystemWatcher) {
            this._fileSystemWatcher.dispose();
            this._fileSystemWatcher = undefined;
        }
        this._watchedUri = undefined;
    }

    private getConfiguration(): { enableTailMode: boolean } {
        const config = vscode.workspace.getConfiguration('logFileHighlighter');

        const enableTailMode = config.get('enableTailMode', true);

        return {
            enableTailMode
        };
    }

    private checkEndOfFileVisibilityInActiveEditor() {
        const textEditor = vscode.window.activeTextEditor;
        if (textEditor) {
            const visibleRanges = textEditor.visibleRanges;

            if (visibleRanges && visibleRanges.length > 0 && textEditor?.document.languageId === Constants.LogLanguageId) {
                const lastLine = textEditor.document.lineCount - 1;
                const lastVisibleRange = visibleRanges[0].end.line;

                if (lastVisibleRange >= lastLine) {
                    // The end of the file is visible
                    this._tailModeActive = true;
                    if (this._statusBarItem) {
                        this._statusBarItem.text = 'Log File Tail Mode';
                        this._statusBarItem.show();
                    }

                    // Set up file watcher for the current file when entering tail mode
                    this.setupFileWatcher(textEditor.document.uri);

                    return;
                }
            }
        }

        // Else: Not a log file, or the end of the file is not visible => no tail mode
        this._tailModeActive = false;
        if (this._statusBarItem) {
            this._statusBarItem.hide();
        }

        // Clean up file watcher when exiting tail mode
        this.disposeFileWatcher();
    }

    editorChanged() {
        this.checkEndOfFileVisibilityInActiveEditor();
    }

    private tailLogFile(document: vscode.TextDocument) {
        // Check if tail mode is active and the document is the active editor
        if (this._tailModeActive && vscode.window.activeTextEditor?.document === document) {
            // Get the last line number
            const lastLine = document.lineCount - 1;
            const range = new vscode.Range(lastLine, 0, lastLine, 0);

            // Scroll to the last line
            vscode.window.activeTextEditor.revealRange(range, vscode.TextEditorRevealType.Default);
        }
    }

    private setupFileWatcher(uri: vscode.Uri) {
        // This is called on every scroll event while the end of the file is visible,
        // so keep the existing watcher if it's already watching this file.
        if (this._fileSystemWatcher && this._watchedUri === uri.toString()) {
            return;
        }

        // Clean up any existing watcher
        this.disposeFileWatcher();

        // Documents such as the Output panel and unsaved files have no file to watch
        if (uri.scheme === 'untitled' || uri.scheme === 'output') {
            return;
        }

        // Watch the folder of the current file and only react to changes of the file itself. A RelativePattern
        // with a base folder is used rather than a glob of the full path, so that characters with a special
        // meaning in globs, like [ ] { }, in the path are never interpreted as a pattern.
        const folder = vscode.Uri.joinPath(uri, '..');
        this._fileSystemWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(folder, '*'), false, false, true);
        this._watchedUri = uri.toString();

        this._fileSystemWatcher.onDidChange((changedUri) => {
            if (changedUri.toString() !== uri.toString()) {
                return;
            }
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && activeEditor.document.uri.toString() === uri.toString() && this._tailModeActive) {
                this.tailLogFile(activeEditor.document);
            }
        });
    }
}
