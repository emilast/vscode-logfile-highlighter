# Log File Highlighter

![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat)

![alt text][sample]

## Description
A Visual Studio Code extension for adding color highlighting to log files. It is based on standard conventions for log4net log files but it's general enough to be useful for other variations of log files as well. The colors are customizable but by default the current color theme's colors are used.

**Note**
An earlier version of the syntax highlighting definition from this extension was included into Visual Studio Code [version 1.20](https://code.visualstudio.com/updates/v1_20#_output-panel). If the default behavior of log files in VS Code is good enough for you, then you don't need this extension. However, if you want additional highlighting, customizable patterns and time duration calculation, then keep reading :-)

## Features
### Syntax Highlighting
The extension associates with `.log` files and applies coloring to the different elements in the file, for example:

* Dates and times in ISO format, such as
    * `2015-12-09`
    * `2015-12-09 09:29`
    * `2015-12-09 09:29:02.258`
* Dates and times in some culture-specific formats
    * `12/09/2016`
    * `12.09.2016`
    * `12-09-2016`
    * `12-09-2015 09:29`
    * `12-09-2015 09:29:02,258`
* Log level, such as
    * `DEBUG`
    * `INFO`, `INFORMATION`
    * `WARN`, `WARNING`
    * `ERROR`, `FAIL`, `FAILURE`
* Numeric constants, such as
    * `1`
    * `234`
* Standard .Net constants
    * `null`
    * `true`
    * `false`
* String constants, enclosed in single or double quotes. Examples:
    * `"lorem ipsum"`
    * `'lorem ipsum'`
* GUIDs. Example:
    * `859A4209-A82D-4CA1-8468-C2606A3501EE`
* MAC addresses (hex numbers separated by colons or dashes (':', '-')
    * `43:A4:19:A5:AF:C0`
    * `43-A4-19-A5-AF-C0`
    * `fde8:e767:269c:0:9425:3477:7c8f:7f1a`
    * `fde8-e767-269c-0-9425-3477-7c8f-7f1a`

* .Net exception type names, i.e. word ending with `Exception`, such as
    * `ArgumentNullException`
    * `HttpException`
* .Net exception stack traces, i.e. lines starting with whitespace characters, followed by `at`, for example:
    ```
    System.NullReferenceException: Object reference not set to an instance of an object.
        at MyClass.DoSomethingElse(string foo)
        at MyClass.DoSomething()
    ```
* Urls:
    * `http://www.meadow.se/wordpress/`

* Namespaces (sequences of alphanumeric and dot characters). Useful to identity namespace qualified type names, for example.
    * `MyApp.MyNameSpace.MyClass`

### Visualization of Time Duration and Progress
If you select multiple lines of a `.log` file, some simple timestamp analysis is performed.

* A status bar item is displayed that indicates how many days, hours, minutes, seconds and milliseconds that is selected.
* A progress bar is also drawn under the timestamps in the selection to give a visual representation of each line's point in time within the selection.
* Press <kbd>Escape</kbd> to clear the progress bars.

![Time Duration Sample](content/TimeAnalysis.gif)  

## Customization

### Customizing the colors

By default, this extension reuses existing theme colors in order to adapt to the user's preferences. Sometimes this will result in colors that may not make complete sense in the log file context (for example `ERROR` might be green and `DEBUG` red, when it would be more appropriate to have it the other way around).

For this reason, the extension defines a special set of grammar tokens that can be used to override the colors of the default log items:

```
log.constant
log.date
log.debug
log.error
log.exception
log.exceptiontype
log.info
log.string
log.verbose
log.warning
```

To override the color for one of these, use the `editor.tokenColorCustomizations` user setting, which was introduced in Visual Studio Code 1.15. Here's an example that forces errors to be red and bold and warnings to be orange, regardless of what color theme is used:

```JSON
"editor.tokenColorCustomizations": {
    "textMateRules": [
        {
            "scope": "log.error",
            "settings": {
                "foreground": "#af1f1f",
                "fontStyle": "bold"
            }
        },
        {
            "scope": "log.warning",
            "settings": {
                "foreground": "#f4ad42",
                "fontStyle": ""
            }
        }
    ]
}
```

### Time Analysis settings

* **enableProgressIndicator** can be used to disable the progress indicator feature. The default value is `true`. Set it to `false` to disable the feature.

* **progressIndicatorUnderlineColor** can be used to set the color of the progress indicator. The default value is `#00ff1f8f`. Note the alpha channel value at the end of the color value (`8f`). This can be used to make the color semi-transparent for mixing with the background color.

Example:
```JSON
"logFileHighlighter.enableProgressIndicator": true,
"logFileHighlighter.progressIndicatorUnderlineColor": "#ffee00",
```


### Defining custom highlighting patterns

The extension also supports defining custom patterns to be highlighted. This can be useful to make the extension compatible with the log levels of an otherwise unsupported logging framework or to highlight domain specific patterns, or just about anything else.

The patterns are defined in the user settings like in this example:


```JSON
"logFileHighlighter.customPatterns": [
    // Highlight the text 'Verbose' with green color
    {
        "pattern": "Verbose",
        "foreground": "#22aa22"
    },
    // Highlight the text 'E/' and any immediately following word constitient characters with red foreground and yellow background
    {
        "pattern": "E/\\w+",
        "foreground": "#af1f1f",
        "background": "#f3f38d"
    },
    // Highlight anything between square brackets with dark grey background
    {
        "pattern": "\\[(.*?)\\]",
        "background": "#333333"
    },
    // Highlight ERROR if surrounded by double quotes using positive lookbehind and lookahead expressions
    {
        "pattern": "(?<=\")ERROR(?=\")",
        "foreground": "#00FF00",
    }
]
```

| Setting       | Optional      | Description   | Example 	|
|--- 	        |---	        |---	        |---	    |
| `pattern`     | Mandatory 	| The matching expression. This can be either a string constant or a JavaScript regular expression (remember to **escape special characters**).|  `foobar`<br>`(todo\|TODO)` 	|
| `foreground`  | Optional	    | The color to use as foreground color for the matched pattern. Hex colors are preferred since they can be selected with the VS Code color picker but predefined VS Code color names work as well. 	| `yellow`<br>`#ff5588` |
| `background`  | Optional	    | The color to use as background color for the matched pattern. | `yellow`<br>`#ff5588` |
| `fontWeight`  | Optional	    | Used to change the weight of the font. | `bold`   |
| `fontStyle`   | Optional	    | Used to change the style of the font.  | `italic` |
| `border`      | Optional	    | Can be used for adding a border around matched text. | `2px solid yellow` |
| `borderRadius`| Optional	    | Can be used together with the `border` setting to make the border corners rounded. | `3px` |
| `letterSpacing`| Optional	    | Can be used to increase or decrease the horizontsl spacing between characters in the matched text. | `5px` <br> `-1px` |
| `overviewColor`| Optional	    | If set, this enables matched text to be indicated in the overview ruler to the right of the text editor window in Code. | `yellow`<br>`#ff5588` |
| `overviewRulerLane`| Optional	| If `overviewColor` is set, then this setting controls the placement of the marker in the ruler.| `Left`<br>`Right`<br>`Center`<br>`Full`|
| `textDecoration`| Optional	| Used for adding additional CSS text decorations. |`red underline overline dotted`<br>`red wavy underline`|


**Note**: Both `foreground` and `background` are optional individually but *at least* one of them must be set for the custom pattern to be activated.

**Tip**: By only setting the `background` a custom pattern can be combined with the built-in patterns that control the foreground color. This is shown in the last pattern in the example above.

![Custom Pattern Sample](content/CustomPattern-Sample.gif)  

## Tips

### File associations

To make VS Code treat other file extensions than the default `.log` as log files, add the following to the user settings:

```JSON
"files.associations": {
    "*.log.*": "log"
},
```
The example above associates extensions such as `.log.1` and `.log.2` with the Log File highlighter extension.


[sample]: https://raw.githubusercontent.com/emilast/vscode-logfile-highlighter/master/content/sample.png

### Syntax highlighting of large files

VS Code disables color highlighting for large files by default. This can be disabled with the **editor.largeFileOptimization** setting. To enable highlighting for large log files without changing the setting for other file types, place it in the `[log]` scope like this:

```json
"[log]": {
    "editor.largeFileOptimizations": false,
}
```