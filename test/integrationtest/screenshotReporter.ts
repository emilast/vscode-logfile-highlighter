'use strict';

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * A Jasmine reporter that takes a screenshot of the whole screen when a test fails. Jasmine reports a test
 * after its afterEach functions, so the test suites close their editors in beforeEach instead, so that
 * VS Code still shows the state of the failed test. It uses ImageMagick's `import` on the X display, which is
 * available on Linux, e.g. under xvfb-run in CI. Elsewhere, or if `import` is missing, it does nothing.
 */
export class ScreenshotReporter implements jasmine.CustomReporter {

    private enabled: boolean;

    constructor(private readonly folder: string) {
        this.enabled = process.platform === 'linux' && !!process.env.DISPLAY;
    }

    public async specDone(result: jasmine.SpecResult): Promise<void> {
        if (!this.enabled || result.status !== 'failed') {
            return;
        }

        // Give VS Code a moment to render the latest changes
        await new Promise((resolve) => setTimeout(resolve, 500));

        const fileName = result.fullName.replace(/[^\w.-]+/g, '_').substring(0, 120) + '.png';
        const file = path.join(this.folder, fileName);

        try {
            fs.mkdirSync(this.folder, { recursive: true });
            execFileSync('import', ['-window', 'root', file], { timeout: 10000, stdio: 'ignore' });
            console.log(`Screenshot of the failed test: ${file}`);
        } catch (error) {
            // Don't try again for every failed test if screenshots can't be taken here
            this.enabled = false;
            console.log('Could not take a screenshot of the failed test:', error.message);
        }
    }
}
