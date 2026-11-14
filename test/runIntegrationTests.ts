import { runTests } from '@vscode/test-electron';
import * as path from 'path';

// Downloads VS Code (cached in .vscode-test/), starts it with the extension and
// the test log folder, and runs the integration tests in test/integrationtest.
// On Linux without a display, run it with xvfb-run.
async function main() {
    // This file is compiled to out/test/runIntegrationTests.js
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    const extensionTestsPath = path.resolve(__dirname, './integrationtest/index');
    const testWorkspace = path.resolve(extensionDevelopmentPath, 'test/integrationtest/testLogs');

    try {
        await runTests({
            version: process.env.VSCODE_TEST_VERSION || 'stable',
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [
                testWorkspace,
                '--disable-extensions',
                '--disable-workspace-trust',
            ],
        });
    } catch (err) {
        console.error('Integration tests failed:', err);
        process.exit(1);
    }
}

main();
