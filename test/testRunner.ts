import jasmine = require('jasmine');
import util = require('util');

class TestRunner {
    public  run(configPath: string, clb: (error: Error) => void): void {
        const runner = new jasmine(null);
        runner.configureDefaultReporter({
            print() {
                const line = util.format.apply(util.format, arguments);
                if (line !== '\n') {
                    console.log(line);
                }
            }
        });
        runner.loadConfigFile(configPath);
        runner.loadSpecs();
        runner.loadHelpers();
        runner.onComplete((passed) => {
            if (passed) {
                clb(null);
            } else {
                clb(new Error('At least one test failed.'));
            }
        });

        runner.execute();
    }
}

// Executed directly
if (!module.parent) {
    if (process.argv.indexOf('-c') === -1) {
        process.stdout.write('The "-c" argument is required. (Path to the jasmine config file)');
        process.exit(1);
    } else if (process.argv.length !== 4) {
        process.stdout.write('The argument is missing. Example to start the test: \
        "node testRunner.js -c ./myConfigPath/jasmine.json"');
        process.exit(1);
    } else {
        const configPath = process.argv[process.argv.indexOf('-c') + 1];
        const i = process.cwd();
        const runner = new TestRunner();
        runner.run(configPath, (error) => {
            if (error) {
                console.log(error.message);
            } else {
                console.log('All tests succeeded.');
            }
        });
    }
}
