# Log File Highlighter

[![License](http://img.shields.io/badge/license-MIT-green.svg?style=flat)](https://raw.githubusercontent.com/emilast/vscode-logfile-highlighter/master/LICENSE) [![Version](https://vsmarketplacebadge.apphb.com/version/emilast.LogFileHighlighter.svg)](https://marketplace.visualstudio.com/items?itemName=emilast.LogFileHighlighter) [![Installs](https://vsmarketplacebadge.apphb.com/installs/emilast.LogFileHighlighter.svg)](https://marketplace.visualstudio.com/items?itemName=emilast.LogFileHighlighter) [![Ratings](https://vsmarketplacebadge.apphb.com/rating/emilast.LogFileHighlighter.svg)](https://marketplace.visualstudio.com/items?itemName=emilast.LogFileHighlighter)

![alt text][sample]

## Description
A Visual Studio Code extension for adding color highlighting to log files. It is based on standard conventions for log4net log files but hopefully it's general enough to be useful for other variations of log files as well. 

The extension associates with `.log` files and applies coloring to the different elements in the file, for example:

* Dates and times in ISO format, such as
	* `2015-12-09`
	* `2015-12-09 09:29`
	* `2015-12-09 09:29:02,258`
* Dates and times in some culture specific formats
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
* .Net exception type names, i.e. word ending with `Exception`, such as
	* `ArgumentNullException`
	* `HttpException`
* .Net exception stack traces, i.e. lines starting with whitespace characters, followed by `at`, for example:
	```
	System.NullReferenceException: Object reference not set to an instance of an object.
		at MyClass.DoSomethingElse(string foo)
		at MyClass.DoSomething()
	```
* Url:s
	* `http://www.meadow.se/wordpress/`
* Namespaces (sequences of alpanumeric and dot characters). Useful to identity namespace qualified type names, for example.
	* `MyApp.MyNameSpace.MyClass`

## Tips

To make VS Code treat other file extensions than the default `.log` as log files, add the following to the user settings:

```
"files.associations": {
	"*.log.*": "log"
},
```
The example above associates extensions such as `.log.1` and `.log.2` with the Log File highlighter extension.


[sample]: https://raw.githubusercontent.com/emilast/vscode-logfile-highlighter/master/content/sample.png