'use strict';

import jasmine = require('jasmine');
import * as path from 'path';
import * as util from 'util';

class TestRunner {
    public  run(configPath: string, clb: (error: Error) => void): void {
        const runner = new jasmine(null);
        runner.projectBaseDir = path.dirname(configPath);
        runner.configureDefaultReporter({
            print() {
                const line = util.format.apply(util.format, arguments);
                if (line !== '\n') {
                    console.log(line);
                }
            }
        });
        runner.loadConfigFile(configPath);
        runner.execute();
    }
}

// Executed directly
if (process.argv.indexOf('-c') === -1) {
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
        } else {
            console.log('All tests succeeded.');
        }
    });
}
export = TestRunner; 