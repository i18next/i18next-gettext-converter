# Introduction

Project goal is to convert files from gettext to i18next json format and vice versa.

# Installation

1. first install node.js from [nodejs.org](http://nodejs.org/).
2. `npm install i18next-conv -g`

For i18next <2.0.0 use i18next-conv@1.11.0

# Usage

## convert .mo or .po to i18next json

in your console type:


__for help:__

````
i18next-conv -h
````

__to convert a .mo or .po file to i8next json:__

````
i18next-conv -l [domain] -s [sourcePath] -t [targetPath]
````

eg.: i18next-conv -l en -s ./locales/en.po -t ./locales/en/translation.json


_if no target (-t) is specified file will be stored to [sourceDir]/[domain]/translation.json._

__to convert i18next json to a .mo or .po file:__

````
i18next-conv -l [domain] -s [sourcePath] -t [targetPath]
````

eg.: i18next-conv -l en -s ./locales/en.translation.json -t ./locales/en/translation.mo (or .po)

_if no target (-t) is specified file will be stored to [sourceDir]/[domain]/translation.po._


__for utf8-encoded po-files add these lines to your po file:__

````
"Content-Type: text/plain; charset=UTF-8\n"
"Content-Transfer-Encoding: 8bit\n"
````

It is necessary if you get corrupted output from the command above.

__to filter incoming po-file translations, pass the path to a module that exports a filter function:__

````
i18next-conv -l [domain] -s [sourcePath] -t [targetPath] -f [filterPath]
````

eg.: i18next-conv -l en -s ./locales/en.po -t ./locales/en/translation.json -f ./filter.js

The filter module should export a single function that accepts the gettext object, the domain and a callback
as its arguments. The function can then add/edit/delete translations, invoking the callback with an error object
and the translation table.

eg.

```javascript
module.exports = function(gt, domain, callback) {
 	var err;

 	// Delete all keys without comments
 	gt.listKeys(domain).forEach(function(key) {
 		var comment = gt.getComment(domain, "", key);
 		if (!comment) {
 			gt.deleteTranslation(domain, "", key);
 		}
 	});

 	callback(err, gt._domains[gt._textdomain]._translationTable);
};
```

## convert i18next json to .mo or .po with node

```
var path = require('path');
var source = path.resolve(__dirname, '../locales/ua-UK/translation.json');
var target = path.resolve(__dirname, '../locales/ua-UK/translation.mo');
var options = {quiet : true};
var callback = () => {console.log('Translation ua-UK done');}

converter.i18nextToGettext('ua-UK', source, target, options, callback);

```


# All credits go to

- [andri9's node-gettext](https://github.com/andris9/node-gettext) for parsing .mo and .po files
- [TJ Holowaychuk's commander.js](https://github.com/visionmedia/commander.js/) for console program

# License

Copyright (c) 2016 Jan Mühlemann

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
