# Log File Highlighter

![alt text][sample]

A Visual Studio Code extension for adding color highlighting to log files. It is based on standard conventions for log4net log files but hopefully it's general enough to be useful for other variations of log files as well. 

The extension associates with `.log` files and applies coloring to the following elements in the file:

* Dates and times in ISO format, such as
	* `2015-12-09`
	* `2015-12-09 09:29`
	* `2015-12-09 09:29:02,258`
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


## Change log

### 0.7.0
#### 19 Apr 2016

* Adjusted the coloring for DEBUG, INFO, WARN, ERROR, constants, exceptions and stack traces to remain compatible with Visual Studio Code 1.0.

### 0.6.0
#### 22 Feb 2016

* Added icon to Marketplace manifest.

* Added coloring of Url:s and namespaces.

* Changed the color of exception stack traces to be a little more discreet. 

### 0.5.11
#### 29 Dec 2015

* A recent VS Code update caused exception call stacks to be uncolored for some reason. Changed so that they use the same color as the exception name.

### 0.5.10
#### 16 Dec 2015

* Fixed bug that dates were colored the same way as constants.

### 0.5.9
#### 15 Dec 2015

* Added coloring of **string constants** enclosed with single or double quotes.
* Added new constants `null`, `true` and `false`, colored the same way as numeric constants.


[sample]: https://raw.githubusercontent.com/emilast/vscode-logfile-highlighter/master/content/sample.png