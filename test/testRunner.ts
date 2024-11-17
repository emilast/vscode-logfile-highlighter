'use strict';

import Jasmine = require('jasmine');
import JasmineConsoleReporter = require('jasmine-console-reporter');

import * as path from 'path';
import * as util from 'util';

class TestRunner {
    
    public run(configPath: string, clb: (error: Error) => void): void {
        const jasmine = new Jasmine();
        jasmine.loadConfigFile(configPath);

        const reporter = new JasmineConsoleReporter({
            colors: 1,           // (0|false)|(1|true)|2 
            cleanStack: 1,       // (0|false)|(1|true)|2|3 
            verbosity: 4,        // (0|false)|1|2|(3|true)|4|Object 
            listStyle: 'indent', // "flat"|"indent" 
            activity: false
        });

        jasmine.addReporter(reporter);

        jasmine.execute();
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