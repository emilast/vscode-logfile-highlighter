'use strict';

import { Position, Range, Selection } from 'vscode';
import * as vscode from 'vscode';
import { CustomPatternDecorator } from '../../src/CustomPatternDecorator';

describe('CustomPatternDecorator', () => {

    // Initial situation for all tests:
    // Set config once to enable custom log level.
    beforeAll((done) => {
        const config = vscode.workspace.getConfiguration('logFileHighlighter');
        config.update('customPatterns', [
            {
                pattern: 'Verbose',
                foreground: 'green'
            },
            {
                pattern: 'E/\\w+',
                foreground: 'red',
                background: 'yellow'
            }
        ]).then(() => done());

    });

    let testObject: CustomPatternDecorator;
    const verbRanges = [
        new Range(4, 31, 4, 38),
        new Range(5, 31, 5, 38),
        new Range(6, 31, 6, 40),
        new Range(7, 31, 7, 39)
    ];
    const eRanges = [
        new Range(8, 31, 8, 44),
        new Range(9, 31, 9, 42),
        new Range(10, 31, 10, 43)
    ];

    // Initial situation for all tests:
    // folder 'testLogs' is opened and first file is selected in editor.
    beforeEach((done) => {
        testObject = new CustomPatternDecorator();

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

    describe('updateConfiguration', () => {
        it('should update the its log level.', (done) => {
            const decoratorSpy = spyOn(CustomPatternDecorator.prototype, 'updateConfiguration').and.callThrough();
            const config = vscode.workspace.getConfiguration('logFileHighlighter');
            config.update('customPatterns', [
                {
                    pattern: 'Verbose',
                    foreground: 'yellow'
                },
                {
                    pattern: 'E/\\w+',
                    foreground: 'darkred',
                    background: 'yellow'
                }
            ]).then(() => {
                expect(decoratorSpy.calls.count()).toBe(1);
                done();
            });
        });
    });

    describe('decorateDocument', () => {
        it('should decorate the document with the specified log levels of the config.', () => {
            // Arrange
            const mockEvent = {
                contentChanges: [
                    {
                        length: 0,
                        range: new Range(new Position(0, 0), new Position(0, 0)),
                        rangeLength: 0,
                        text: ''
                    }
                ],
                document: vscode.window.visibleTextEditors[0].document
            };
            testObject.updateConfiguration(); // Init log level of config
            testObject.decorateEditors([vscode.window.activeTextEditor]); // Init Cache
            const vscodeSpy = spyOn(vscode.window.activeTextEditor, 'setDecorations').and.callThrough();

            // Act
            // testObject.decorateDocument(mockEvent);

            // Assert
            expect(vscodeSpy.calls.count()).toBe(2); // Two calls for two log level.

            const actualVerbRanges = vscodeSpy.calls.argsFor(0)[1];
            expect(typeof(verbRanges)).toBe('object');
            expect(actualVerbRanges.length).toBe(4);
            for (const verb of actualVerbRanges) {
                // expect(verbRanges[i].isEqual(actualVerbRanges[i])).toBeTruthy();
            }

            const actualERanges = vscodeSpy.calls.argsFor(1)[1];
            expect(typeof(actualERanges)).toBe('object');
            expect(actualERanges.length).toBe(3);
            for (const eRange of actualERanges) {
                // expect(eRanges[i].isEqual(actualERanges[i])).toBeTruthy();
            }
        });
    });

    describe('decorateEditors', () => {
        it('should decorate all visible editors with the specified log levels of the config.', () => {
            // Arrange
            testObject.updateConfiguration(); // Init log level of config
            const vscodeSpy = spyOn(vscode.window.activeTextEditor, 'setDecorations').and.callThrough();

            // Act
            testObject.decorateEditors([vscode.window.activeTextEditor]);

            // Assert
            expect(vscodeSpy.calls.count()).toBe(2); // Two calls for two log level.

            const actualVerbRanges = vscodeSpy.calls.argsFor(0)[1];
            expect(typeof(verbRanges)).toBe('object');
            expect(actualVerbRanges.length).toBe(4);
            for (const verb of actualVerbRanges) {
                // expect(verbRanges[i].isEqual(actualVerbRanges[i])).toBeTruthy();
            }

            const actualERanges = vscodeSpy.calls.argsFor(1)[1];
            expect(typeof(actualERanges)).toBe('object');
            expect(actualERanges.length).toBe(3);
            for (const eRange of actualERanges) {
                // expect(eRanges[i].isEqual(actualERanges[i])).toBeTruthy();
            }
        });
    });

    // Remove configuration again.
    afterAll((done) => {
        const config = vscode.workspace.getConfiguration('logFileHighlighter');
        config.update('customPatterns', []).then(() => done());

    });
});
