// Regenerates the images in content/readme/ that the README shows.
//
//   npm run readme-images              all scenes
//   npm run readme-images -- overview  only the named scenes
//
// Starts a virtual X display (Xvfb) with a fixed size, starts VS Code with this extension and a
// fixed set of settings (theme, font, no minimap etc.), and runs scenes.js inside it, which opens the
// sample logs in samples/, plays each scene and takes screenshots (ImageMagick) and GIFs (ffmpeg).
//
// Needs Linux with Xvfb, ImageMagick, ffmpeg and the JetBrains Mono font, e.g. on Ubuntu:
//   sudo apt-get install -y xvfb imagemagick ffmpeg fonts-jetbrains-mono
// See .claude/skills/readme-images/SKILL.md.

'use strict';

const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runTests } = require('@vscode/test-electron');

const repoRoot = path.resolve(__dirname, '../..');
// The size of VS Code's default window, so that the window covers the whole screen
const screen = { width: 1200, height: 800 };

function checkTools() {
    if (process.platform !== 'linux') {
        throw new Error('The README images can only be generated on Linux (they need Xvfb).');
    }
    for (const tool of ['Xvfb', 'import', 'convert', 'ffmpeg']) {
        try {
            execFileSync('which', [tool], { stdio: 'ignore' });
        } catch {
            throw new Error(`${tool} was not found. Install it, e.g. sudo apt-get install -y xvfb imagemagick ffmpeg`);
        }
    }
}

/** Starts Xvfb on the first free display number, so that every run has the same screen size. */
async function startXvfb() {
    for (let display = 99; display < 120; display++) {
        if (fs.existsSync(`/tmp/.X11-unix/X${display}`) || fs.existsSync(`/tmp/.X${display}-lock`)) {
            continue;
        }
        const xvfb = spawn('Xvfb', [`:${display}`, '-screen', '0', `${screen.width}x${screen.height}x24`, '-nolisten', 'tcp'],
            { stdio: 'ignore' });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (xvfb.exitCode === null) {
            return { xvfb, display: `:${display}` };
        }
    }
    throw new Error('Could not start Xvfb.');
}

/** The user settings that make every image look the same, wherever it is generated. */
function writeUserSettings(userDataDir) {
    const settings = {
        'workbench.colorTheme': 'Default Dark Modern',
        'workbench.startupEditor': 'none',
        'workbench.tips.enabled': false,
        'workbench.activityBar.location': 'hidden',
        'workbench.editor.showTabs': 'none',
        'workbench.layoutControl.enabled': false,
        'workbench.statusBar.visible': false,
        'window.titleBarStyle': 'native',
        'window.menuBarVisibility': 'toggle',
        'workbench.editor.editorActionsLocation': 'hidden',
        'window.commandCenter': false,
        'window.newWindowDimensions': 'fullscreen',
        'window.restoreWindows': 'none',
        'breadcrumbs.enabled': false,
        'editor.fontFamily': '\'JetBrains Mono\', \'DejaVu Sans Mono\', monospace',
        'editor.fontSize': 15,
        'editor.lineHeight': 24,
        'editor.minimap.enabled': false,
        'editor.renderLineHighlight': 'none',
        'editor.occurrencesHighlight': 'off',
        'editor.selectionHighlight': false,
        'editor.matchBrackets': 'never',
        'editor.guides.indentation': false,
        'editor.renderWhitespace': 'none',
        'editor.unicodeHighlight.ambiguousCharacters': false,
        'editor.links': true,
        'editor.cursorBlinking': 'solid',
        'editor.scrollBeyondLastLine': false,
        'editor.hover.enabled': false,
        'chat.disableAIFeatures': true,
        'security.workspace.trust.enabled': false,
        'git.openRepositoryInParentFolders': 'never',
        'extensions.ignoreRecommendations': true,
        'update.mode': 'none',
        'telemetry.telemetryLevel': 'off',
    };
    fs.mkdirSync(path.join(userDataDir, 'User'), { recursive: true });
    fs.writeFileSync(path.join(userDataDir, 'User', 'settings.json'), JSON.stringify(settings, null, 4));
}

async function main() {
    checkTools();

    // The user data folder must have a short path, since VS Code puts a socket in it
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lfh-img-'));
    writeUserSettings(userDataDir);

    const outputDir = path.join(repoRoot, 'content', 'readme');
    fs.mkdirSync(outputDir, { recursive: true });

    const { xvfb, display } = await startXvfb();
    process.env.DISPLAY = display;
    try {
        const launchArgs = [
            `--user-data-dir=${userDataDir}`,
            // An empty extensions folder, so that only this extension is loaded
            `--extensions-dir=${path.join(userDataDir, 'extensions')}`,
            '--disable-workspace-trust',
            '--disable-gpu',
        ];
        if (process.getuid && process.getuid() === 0) {
            launchArgs.push('--no-sandbox');
        }

        await runTests({
            version: process.env.VSCODE_TEST_VERSION || 'stable',
            extensionDevelopmentPath: repoRoot,
            extensionTestsPath: path.join(__dirname, 'scenes.js'),
            launchArgs,
            extensionTestsEnv: {
                DISPLAY: display,
                README_IMAGES_OUTPUT: outputDir,
                README_IMAGES_SAMPLES: path.join(__dirname, 'samples'),
                README_IMAGES_SCREEN: `${screen.width}x${screen.height}`,
                README_IMAGES_SCENES: process.argv.slice(2).join(','),
            },
        });
    } finally {
        xvfb.kill();
        fs.rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5 });
    }
}

main().catch((error) => {
    console.error('Generating the README images failed:', error);
    process.exit(1);
});
