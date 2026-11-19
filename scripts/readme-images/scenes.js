// Runs inside VS Code, started by run.js. Plays each scene and saves its image in content/readme/.
//
// Each scene opens a sample log from samples/, applies its settings, and either takes a screenshot or
// records a GIF of what it does. The screen is the editor only (run.js hides everything else), so the
// images are cropped to the lines and columns the sample uses. The custom pattern settings below are
// the same as the examples in the README, so keep them in sync when you change one of them.

'use strict';

const vscode = require('vscode');
const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const outputDir = process.env.README_IMAGES_OUTPUT;
const samplesDir = process.env.README_IMAGES_SAMPLES;
const [screenWidth, screenHeight] = process.env.README_IMAGES_SCREEN.split('x').map(Number);
const display = process.env.DISPLAY;

// Editor geometry, from the font settings in run.js (JetBrains Mono, size 15, line height 24)
const charWidth = 9;
const lineHeight = 24;
const textLeft = 82;          // where the text starts, after the line numbers
const textTop = 4;            // where the first line starts
const paddingRight = 24;
const paddingBottom = 8;      // added below the last line, in the editor's background color
const statusBarHeight = 22;
const endGap = 13;            // between the last line and the bottom of the editor, when scrolled to the end

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Custom patterns shown in the README ("Highlight your own patterns")
const customPatterns = [
    { pattern: 'ORD-\\d+', foreground: '#4fc1ff', border: '1px solid #4fc1ff80', borderRadius: '3px' },
    { pattern: 'C-\\d+', foreground: '#c586c0', fontStyle: 'italic' },
    { pattern: 'SLOW', highlightEntireLine: true, background: '#f2cc6026' },
    { pattern: 'TODO', foreground: '#1f1f1f', background: '#f2cc60', fontWeight: 'bold' },
];

// Theme colors shown in the README ("Using theme colors")
const themeColorPatterns = [
    { pattern: '^E \\(\\d+\\)', foreground: 'terminal.ansiRed' },
    { pattern: '^W \\(\\d+\\)', foreground: 'terminal.ansiYellow' },
    { pattern: '^I \\(\\d+\\)', foreground: 'terminal.ansiGreen' },
    { pattern: '^D \\(\\d+\\)', foreground: 'terminal.ansiBlue' },
    { pattern: 'timeout', background: 'editor.findMatchHighlightBackground' },
];

// Multiple styles for the same pattern, shown in the README
const multipleStylesPatterns = [
    { pattern: 'todo', patternFlags: 'i', foreground: '#000000', background: '#7d8aff' },
    { pattern: 'todo', patternFlags: 'i', highlightEntireLine: true, background: '#7d8aff50' },
];

// Multiline pattern shown in the README
const multilinePatterns = [
    { pattern: 'SELECT.*?FROM.*?WHERE.*?$', patternFlags: 'si', foreground: '#eeff05' },
];

const scenes = {
    'overview': async () => {
        const editor = await openSample('app.log');
        await screenshot('overview.png', editor);
    },

    'time-selection': async () => {
        await configure({ 'workbench.statusBar.visible': true, 'logFileHighlighter.enableTailMode': false });
        const editor = await openSample('app.log');
        const lines = contentLineCount(editor.document);

        await recordGif('time-selection.gif', editor, { withStatusBar: true }, async () => {
            await sleep(800);
            // Select the lines one by one, like dragging the mouse down
            for (let line = 1; line < lines; line++) {
                editor.selection = new vscode.Selection(0, 0, line, editor.document.lineAt(line).text.length);
                await sleep(110);
            }
            await sleep(3000);
            await vscode.commands.executeCommand('logFileHighlighter.removeProgressIndicatorDecorations');
            editor.selection = new vscode.Selection(lines, 0, lines, 0);
            await sleep(1000);
        });
    },

    'tail-mode': async () => {
        await configure({ 'workbench.statusBar.visible': true });

        // A copy of a generated log, so that lines can be added to it without changing a sample
        const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'lfh-tail-')), 'service.log');
        let next = 0;
        const logLine = () => {
            const levels = ['INFO ', 'INFO ', 'DEBUG', 'INFO ', 'WARN ', 'INFO ', 'INFO ', 'ERROR'];
            const messages = ['Request handled in {n} ms', 'Cache hit for key user:{n}', 'Polling queue, {n} messages',
                'Request handled in {n} ms', 'Retrying inventory call ({n} ms)', 'Order {n} shipped',
                'Request handled in {n} ms', 'Connection to db-2 lost, reconnecting'];
            const i = next++;
            const time = new Date(Date.UTC(2026, 10, 19, 14, 5, 10) + i * 1137);
            return time.toISOString().replace('T', ' ').replace('Z', '')
                + ` ${levels[i % levels.length]} [worker-${(i % 3) + 1}] `
                + messages[i % messages.length].replace('{n}', String(40 + ((i * 53) % 900)));
        };
        // Without a line break at the end, so that the last line of the GIF is a log line
        const lines = [];
        for (let i = 0; i < 40; i++) {
            lines.push(logLine());
        }
        fs.writeFileSync(file, lines.join('\n'));

        const editor = await openFile(file);
        // Show the end of the file, which starts tail mode, with the cursor at the top, out of the image
        editor.revealRange(new vscode.Range(editor.document.lineCount - 1, 0, editor.document.lineCount - 1, 0));
        editor.selection = new vscode.Selection(0, 0, 0, 0);
        await sleep(1000);

        await recordGif('tail-mode.gif', editor, { withStatusBar: true, bottomLines: 12 }, async () => {
            await sleep(800);
            for (let i = 0; i < 12; i++) {
                const edit = new vscode.WorkspaceEdit();
                const end = editor.document.lineAt(editor.document.lineCount - 1).range.end;
                edit.insert(editor.document.uri, end, '\n' + logLine());
                await vscode.workspace.applyEdit(edit);
                await sleep(450);
            }
            await sleep(1500);
        });

        await vscode.commands.executeCommand('workbench.action.files.revert');
    },

    'ansi-colors': async () => {
        const editor = await openSample('ansi-colors.log');
        // The colors and text styles, without the 256 color and 24-bit color tables below them
        await screenshot('ansi-colors.png', editor, { lines: 30 });
    },

    'custom-patterns': async () => {
        await configure({ 'logFileHighlighter.customPatterns': customPatterns });
        const editor = await openSample('custom-patterns.log');
        await screenshot('custom-patterns.png', editor);
    },

    'theme-colors': async () => {
        await configure({ 'logFileHighlighter.customPatterns': themeColorPatterns });
        const editor = await openSample('theme-colors.log');
        const dark = path.join(os.tmpdir(), 'lfh-theme-dark.png');
        const light = path.join(os.tmpdir(), 'lfh-theme-light.png');
        await screenshot(dark, editor);
        await configure({ 'workbench.colorTheme': 'Default Light Modern' });
        await screenshot(light, editor);
        // The two themes above each other, with a thin gap
        execFileSync('convert', [dark, '(', '-size', '1x6', 'xc:#808080', ')', light, '-gravity', 'west', '-background', '#808080',
            '-append', path.join(outputDir, 'theme-colors.png')]);
        fs.rmSync(dark);
        fs.rmSync(light);
    },

    'multiple-styles': async () => {
        await configure({ 'logFileHighlighter.customPatterns': multipleStylesPatterns });
        const editor = await openSample('multiple-styles.log');
        await screenshot('multiple-styles.png', editor);
    },

    'multiline-pattern': async () => {
        await configure({ 'logFileHighlighter.customPatterns': multilinePatterns });
        const editor = await openSample('multiline-pattern.log');
        await screenshot('multiline-pattern.png', editor);
    },
};

exports.run = async function () {
    const only = (process.env.README_IMAGES_SCENES || '').split(',').filter((name) => name);
    const unknown = only.filter((name) => !scenes[name]);
    if (unknown.length > 0) {
        throw new Error(`Unknown scenes: ${unknown.join(', ')}. Known scenes: ${Object.keys(scenes).join(', ')}`);
    }

    for (const [name, scene] of Object.entries(scenes)) {
        if (only.length > 0 && !only.includes(name)) {
            continue;
        }
        console.log(`Scene: ${name}`);
        await prepare();
        try {
            await scene();
        } finally {
            await resetSettings();
        }
    }
};

// The user settings each scene changed, with the values from run.js to restore after the scene
const changedSettings = new Map();

/** Changes user settings for the current scene. They're restored after the scene. */
async function configure(settings) {
    const config = vscode.workspace.getConfiguration();
    for (const [key, value] of Object.entries(settings)) {
        if (!changedSettings.has(key)) {
            changedSettings.set(key, config.inspect(key).globalValue);
        }
        await config.update(key, value, vscode.ConfigurationTarget.Global);
    }
    await sleep(800);
}

async function resetSettings() {
    const config = vscode.workspace.getConfiguration();
    for (const [key, value] of changedSettings) {
        await config.update(key, value, vscode.ConfigurationTarget.Global);
    }
    changedSettings.clear();
    await sleep(500);
}

/** Starts each scene from an empty editor area with nothing else visible. */
async function prepare() {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    await vscode.commands.executeCommand('workbench.action.closeSidebar');
    await vscode.commands.executeCommand('workbench.action.closePanel');
    await vscode.commands.executeCommand('workbench.action.closeAuxiliaryBar');
}

async function openSample(fileName) {
    return openFile(path.join(samplesDir, fileName));
}

async function openFile(file) {
    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(file));
    const editor = await vscode.window.showTextDocument(document, { preview: false });
    // Put the cursor on the last, empty line, which isn't part of the image
    const lastLine = document.lineCount - 1;
    editor.selection = new vscode.Selection(lastLine, 0, lastLine, 0);
    await sleep(1500);
    return editor;
}

/** The number of lines, not counting the empty line after the last line break. */
function contentLineCount(document) {
    const lastLine = document.lineCount - 1;
    return document.lineAt(lastLine).text.length === 0 ? lastLine : document.lineCount;
}

/** The width in characters of the longest line, without ANSI escape codes, which the editor hides. */
function contentColumns(document) {
    let columns = 0;
    for (let line = 0; line < document.lineCount; line++) {
        const text = document.lineAt(line).text.replace(/\x1b\[[0-9;]*m/g, '');
        columns = Math.max(columns, text.length);
    }
    return columns;
}

function imageWidth(columns) {
    return Math.min(screenWidth, textLeft + columns * charWidth + paddingRight);
}

/** Takes a screenshot of the lines of the editor's document, or of its first options.lines lines. */
async function screenshot(fileName, editor, options = {}) {
    await vscode.commands.executeCommand('notifications.clearAll');
    await sleep(700);

    const width = imageWidth(contentColumns(editor.document));
    // Cropped exactly below the last line, so that the cursor on the empty line after it isn't included
    const lines = options.lines || contentLineCount(editor.document);
    const height = Math.min(screenHeight, textTop + lines * lineHeight);
    const file = path.isAbsolute(fileName) ? fileName : path.join(outputDir, fileName);
    execFileSync('import', ['-window', 'root', '-crop', `${width}x${height}+0+0`, '+repage', file]);

    // Add some space below the last line, in the editor's background color
    const background = execFileSync('convert', [file, '-format', '%[pixel:p{5,5}]', 'info:']).toString().trim();
    execFileSync('convert', [file, '-background', background, '-gravity', 'south', '-splice', `0x${paddingBottom}`, file]);
    console.log(`  ${path.relative(process.cwd(), file)}`);
}

/**
 * Records a GIF while the action runs. By default it shows the top lines of the editor, with
 * bottomLines the bottom lines instead (for tail mode), and with withStatusBar the status bar below them.
 */
async function recordGif(fileName, editor, options, action) {
    await vscode.commands.executeCommand('notifications.clearAll');
    await sleep(700);

    const width = imageWidth(options.columns || contentColumns(editor.document));
    const editorBottom = screenHeight - (options.withStatusBar ? statusBarHeight : 0);
    const lines = options.bottomLines || contentLineCount(editor.document);
    const height = textTop + lines * lineHeight + (options.bottomLines ? endGap : 0);
    const top = options.bottomLines ? editorBottom - height : 0;

    const recording = path.join(os.tmpdir(), `lfh-${path.basename(fileName, '.gif')}.mkv`);
    const ffmpeg = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'x11grab', '-framerate', '15',
        '-video_size', `${screenWidth}x${screenHeight}`, '-i', `${display}.0`, '-c:v', 'ffv1', recording],
        { stdio: ['pipe', 'ignore', 'inherit'] });
    await sleep(500);

    await action();

    // Ask ffmpeg to finish the file, and wait for it
    const exited = new Promise((resolve) => ffmpeg.on('exit', resolve));
    ffmpeg.stdin.write('q');
    await exited;

    // Crop the editor area (and the status bar, if wanted) and convert to a GIF with its own palette
    const crops = options.withStatusBar
        ? `[0]crop=${width}:${height}:0:${top}[editor];[0]crop=${width}:${statusBarHeight}:0:${editorBottom}[status];[editor][status]vstack[v]`
        : `[0]crop=${width}:${height}:0:${top}[v]`;
    const file = path.join(outputDir, fileName);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', recording, '-filter_complex',
        `${crops};[v]fps=10,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle`,
        file]);
    fs.rmSync(recording);
    console.log(`  ${path.relative(process.cwd(), file)}`);
}
