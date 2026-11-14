# Instructions for developers

## Build locally

```
npm install
npm run compile
```

## Test extension in new Code instance

1. Open the project folder in Code.
2. Choose **Debug/Start Debugging** or press <kbd>F5</kbd>.

## Run tests

### Unit tests

#### VsCode
1. <kbd>Ctrl</kbd> + <kbd>P</kbd>
2. type *Debug Unit Tests*
3. Press <kbd>Enter</kbd>

#### Command Prompt
Or start them after compiling the project via:
```
npm run unittest
```

### Integration tests
#### VsCode
1. <kbd>Ctrl</kbd> + <kbd>P</kbd>
2. type *Debug Integration Tests*
3. Press <kbd>Enter</kbd>

#### Command Prompt
Run:
```
npm run integrationtest
```

This builds the extension and the tests, downloads VS Code to `.vscode-test/` (the first time) and runs the tests in it with `test/integrationtest/testLogs` as the workspace. Set `VSCODE_TEST_VERSION` to test against another VS Code version than the latest stable one, e.g. `insiders` or `1.140.0`.

On Linux without a display, such as in a container or a CI job, run it with a virtual display:
```
xvfb-run -a npm run integrationtest
```
