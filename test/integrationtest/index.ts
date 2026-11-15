import * as path from 'path';
import TestRunner = require('../testRunner');
import { ScreenshotReporter } from './screenshotReporter';

// Entry point that VS Code calls to run the integration tests inside the extension host.
// See test/runIntegrationTests.ts for how VS Code is started.
export async function run(): Promise<void> {
    const runner = new TestRunner();
    const repositoryRoot = path.resolve(__dirname, '../../../');

    // Screenshots of failed tests, which CI uploads as an artifact
    const screenshots = new ScreenshotReporter(path.join(repositoryRoot, 'test-results', 'screenshots'));

    const passed = await runner.run(path.join(repositoryRoot, 'jasmine.integrationtest.json'), undefined, [screenshots]);

    if (!passed) {
        throw new Error('Integration tests failed.');
    }
}
