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
Set the following environment variables on your system:
* `CODE_TESTS_PATH`: **Absolute path** to `out/test/integrationtest`
* `CODE_TESTS_WORKSPACE`: **Absolute path** to `test/integrationtest/testLogs`

Start the integration tests after compiling the project via running:
```
npm run integrationtest
```

# Class diagram

```mermaid
classDiagram
    class TimePeriod {
        -TimeWithMicroseconds startTime
        -TimeWithMicroseconds endTime
        -moment.Duration duration
        -number durationPartMicroseconds
        +getDurationAsMicroseconds(): number
        -processStartAndEndTimes(startTimeMatch: ParsedTimestamp, endTimeMatch: ParsedTimestamp)
        -adjustDurationWithMicroseconds()
    }

    class TimeWithMicroseconds {
        -moment.Moment time
        -number microseconds
        +getTimeAsEpoch(): number
    }

    class TimePeriodCalculator {
        -TimestampParser _timestampParser
        +convertToDisplayString(selectedDuration: TimePeriod): string
        +getTimePeriod(firstLine: string, lastLine: string): TimePeriod
    }

    class TimestampParser {
        +getTimestampFromText(text: string): ParsedTimestamp
    }

    class ParsedTimestamp {
        +string original
        +number matchIndex
        +string iso
        +number microseconds
        +moment.Moment moment
        +moment.Duration duration
    }

    class ProgressIndicator {
        -vscode.TextEditorDecorationType _decoration
        -TimePeriodCalculator _timeCalculator
        -SelectionHelper _selectionHelper
        -TimestampParser _timestampParser
        +setUnderlineColor(color: string)
        +decorateLines(editor: vscode.TextEditor, startLine: number, endLine: number)
        +removeAllDecorations()
    }

    class SelectionHelper {
        +getFirstAndLastLines(editor: vscode.TextEditor, doc: vscode.TextDocument): ParsedTimestamp
    }

    class TimePeriodController {
        -TimePeriodCalculator _timeCalculator
        -SelectionHelper _selectionHelper
        -vscode.Disposable _disposable
        -vscode.StatusBarItem _statusBarItem
        +dispose()
        +updateTimePeriod()
        -_onEvent()
    }

    TimePeriodCalculator --> TimePeriod
    TimePeriodCalculator --> TimestampParser
    ProgressIndicator --> TimePeriodCalculator
    ProgressIndicator --> SelectionHelper
    ProgressIndicator --> TimestampParser
    TimePeriodController --> TimePeriodCalculator
    TimePeriodController --> SelectionHelper
    TimePeriod --> TimeWithMicroseconds
    TimestampParser --> ParsedTimestamp
```
