import * as path from 'path';
import TestRunner = require('../testRunner');

// Entry point that VS Code calls to run the integration tests inside the extension host.
// See test/runIntegrationTests.ts for how VS Code is started.
export async function run(): Promise<void> {
    const runner = new TestRunner();
    const passed = await runner.run(path.resolve(__dirname, '../../../jasmine.integrationtest.json'));

    if (!passed) {
        throw new Error('Integration tests failed.');
    }
}
