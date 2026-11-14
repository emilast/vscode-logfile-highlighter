'use strict';

import Jasmine = require('jasmine');
import JasmineConsoleReporter = require('jasmine-console-reporter');

import * as path from 'path';
import * as util from 'util';

class TestRunner {
    
    /** Runs the tests and resolves to true if they all passed. */
    public async run(configPath: string, clb?: (error: Error) => void): Promise<boolean> {
        const jasmine = new Jasmine();
        jasmine.loadConfigFile(configPath);

        // Don't let Jasmine exit the process, which would also exit the VS Code extension host
        // when running the integration tests.
        jasmine.exitOnCompletion = false;

        const reporter = new JasmineConsoleReporter({
            colors: 1,           // (0|false)|(1|true)|2 
            cleanStack: 1,       // (0|false)|(1|true)|2|3 
            verbosity: 4,        // (0|false)|1|2|(3|true)|4|Object 
            listStyle: 'indent', // "flat"|"indent" 
            activity: false
        });

        jasmine.addReporter(reporter);

        const result = await jasmine.execute();
        const passed = result.overallStatus === 'passed';

        if (clb) {
            clb(passed ? undefined : new Error('Tests failed with status: ' + result.overallStatus));
        }

        return passed;
    }
}

// Executed directly, rather than imported by the integration tests
if (require.main !== module) {
    // Nothing to do
} else if (process.argv.indexOf('-c') === -1) {
    process.stdout.write('The "-c" argument is required. (Path to the jasmine config file)');
    process.exit(1);
} else if (process.argv.length !== 4) {
    process.stdout.write('The argument is missing. Example to start the test: \
    "node testRunner.js -c ./myConfigPath/jasmine.json"');
    process.exit(1);
} else {
    let configPath = process.argv[process.argv.indexOf('-c') + 1];
    if (!path.isAbsolute(configPath)) {
        configPath = path.resolve(configPath);
    }
    const runner = new TestRunner();
    runner.run(configPath, (error) => {
        if (error) {
            console.log(error.message);
            process.exitCode = 1;
        } else {
            console.log('All tests succeeded.');
        }
    });
}

export = TestRunner;