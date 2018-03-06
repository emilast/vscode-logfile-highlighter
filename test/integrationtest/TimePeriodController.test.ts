'use strict';

import { Position, Selection } from 'vscode';
import * as vscode from 'vscode';
import TimePeriodController = require('../../src/TimePeriodController');

describe('TimePeriodController', () => {

    // Initial situation for all tests:
    // folder 'testLogs' is opened and first file is selected in editor.
    beforeEach((done) => {
        if (vscode.workspace.workspaceFolders !== undefined) {
            const workspaceRootPath = vscode.workspace.workspaceFolders[0].uri.path;
            vscode.workspace.findFiles('*.log').then(
                (uris) => {
                    vscode.workspace.openTextDocument(uris[0]).then(
                        (file) => {
                            vscode.window.showTextDocument(file).then(
                                (editor) => {
                                    editor.selection = new Selection(new Position(0, 0), new Position(0, 0));
                                    done();
                                },
                                (reason) => {
                                    done.fail(reason);
                                });
                        },
                        (reason) => {
                            done.fail(reason);
                        });
                },
                (reason) => {
                    done.fail(reason);
                });
        } else {
            done.fail('No folder was opened!');
        }
    });

    it('should show a status bar item when a range of valid log statements is selcted.', (done) => {

        // Arrange
        const editor = vscode.window.activeTextEditor;
        let controllerSpy = spyOn(TimePeriodController.prototype, 'updateTimePeriod').and.callThrough();

        // Assert
        vscode.window.onDidChangeTextEditorSelection((selectionChangedEvent) => {
            // Only assert once
            if (controllerSpy !== undefined && controllerSpy.calls.count() === 1) {
                expect(controllerSpy.calls.count()).toBe(1);
                expect(typeof (controllerSpy.calls.argsFor(0)[0])).toBe('object');
                expect(controllerSpy.calls.argsFor(0)[0].text).toBe('Selected: 1ms');
                controllerSpy = undefined;
                done();
            }
        });

        // Act
        if (editor) {
            editor.selection = new Selection(new Position(0, 0), new Position(2, 0));
        } else {
            done.fail('No text editor is active!');
        }
    });

    it('should not show a status bar item when a range of invalid log statements is selcted.', (done) => {

        // Arrange
        const editor = vscode.window.activeTextEditor;
        let controllerSpy = spyOn(TimePeriodController.prototype, 'updateTimePeriod').and.callThrough();

        // Assert
        vscode.window.onDidChangeTextEditorSelection((selectionChangedEvent) => {

            // Only check on second call once.
            if (controllerSpy !== undefined && controllerSpy.calls.count() === 2) {
                expect(typeof (controllerSpy.calls.argsFor(1)[0])).toBe('object');
                expect(controllerSpy.calls.argsFor(1)[0].text).toBe('');
                controllerSpy = undefined;
                done();
            }
        });

        // Act
        if (editor) {
            editor.selection = new Selection(new Position(0, 1), new Position(1, 12));
        } else {
            done.fail('No text editor is active!');
        }
    });

    it('should update the status bar item when the active editor switches to another file.', (done) => {

        // Arrange
        let controllerSpy = spyOn(TimePeriodController.prototype, 'updateTimePeriod').and.callThrough();

        // Assert
        vscode.window.onDidChangeActiveTextEditor((selectionChangedEvent) => {

            // Only check on fourth call once.
            if (controllerSpy !== undefined && controllerSpy.calls.count() === 4) {

                // Wait for the TimePeriodController to update the status bar.
                setTimeout(() => {
                    expect(typeof (controllerSpy.calls.argsFor(3)[0])).toBe('object');
                    expect(controllerSpy.calls.argsFor(3)[0].text).toBe('Selected: 1ms');
                    controllerSpy = undefined;
                    done();
                }, 200);
            }
        });

        // Open both files and select some lines then change back to the first file.
        vscode.workspace.findFiles('*.log').then(
            (uris) => {
                // Open and show second file with default selection
                vscode.workspace.openTextDocument(uris[1]).then(
                    (secondFile) => {
                        vscode.window.showTextDocument(secondFile, {
                            preview: false,
                            selection: new Selection(new Position(0, 0), new Position(2, 0))
                        }).then(
                            (editor) => {
                                // Switch back to the first file with default selection.
                                vscode.workspace.openTextDocument(uris[0]).then(
                                    (firstFile) => {
                                        vscode.window.showTextDocument(firstFile, {
                                            preserveFocus: false,
                                            preview: false,
                                            selection: new Selection(new Position(0, 0), new Position(2, 0))
                                        });
                                    },
                                    (reason) => {
                                        done.fail(reason);
                                    });
                            },
                            (reason) => {
                                done.fail(reason);
                            });
                    },
                    (reason) => {
                        done.fail(reason);
                    });
            },
            (reason) => {
                done.fail(reason);
            });
    });
});
