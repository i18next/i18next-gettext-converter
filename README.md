# i18next-gettext-converter

[![Travis][build-badge]][build]
[![npm package][npm-badge]][npm]
[![Coverage Status][coveralls-badge]][coveralls]
[![Dependency Status][dependency-status-badge]][dependency-status]
[![devDependency Status][dev-dependency-status-badge]][dev-dependency-status]

## Introduction

Project goal is to convert files from gettext to i18next json format and vice versa.

## Installation

1. first install node.js from [nodejs.org](http://nodejs.org/).
2. `npm install i18next-conv -g`

For i18next <2.0.0 use i18next-conv@1.11.0

## Usage

### convert .mo or .po to i18next json

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
  gt.listKeys(domain).forEach(key => {
    var comment = gt.getComment(domain, "", key);
    if (!comment) {
      gt.deleteTranslation(domain, "", key);
    }
  });

  callback(err, gt._domains[gt._textdomain]._translationTable);
};
```

## API

This module exposes a few functions to convert json -> gettext and gettext -> json

```js
const path = require('path');
const { readFileSync, writeFileSync } = require('fs');
const {
  i18nextToPo,
  i18nextToPot,
  i18nextToMo,
  gettextToI18next,
};

const source = path.join(__dirname, '../locales/ua-UK/translation.json');
const options = {/* you options here */}

function save(target) {
  return result => {
    writeFileSync(result, target);
  };
}

i18nextToPo('ua-UK', readFileSync(source), options).then(save('../locales/ua-UK/translation.po'));
i18nextToPot('ua-UK', readFileSync(source), options).then(save('../locales/ua-UK/translation.pot'));
i18nextToMo('ua-UK', readFileSync(source), options).then(save('../locales/ua-UK/translation.mo'));
gettextToI18next('ua-UK', readFileSync('../locales/ua-UK/translation.po'), options).then(save('../locales/ua-UK/translation.json'));

```


## All credits go to

- [andri9's node-gettext](https://github.com/andris9/node-gettext) for parsing .mo and .po files
- [TJ Holowaychuk's commander.js](https://github.com/visionmedia/commander.js/) for console program

## License

See the [LICENSE](LICENSE.md) file for license rights and limitations.

[build-badge]: https://img.shields.io/travis/i18next/i18next-gettext-converter/master.svg?style=flat-square
[build]: https://travis-ci.org/i18next/i18next-gettext-converter

[npm-badge]: https://img.shields.io/npm/v/i18next-conv.svg?style=flat-square
[npm]: https://www.npmjs.org/package/i18next-conv

[coveralls-badge]: https://img.shields.io/coveralls/i18next/i18next-gettext-converter/master.svg?style=flat-square
[coveralls]: https://coveralls.io/r/i18next/i18next-gettext-converter

[dependency-status-badge]: https://david-dm.org/i18next/i18next-gettext-converter.svg?style=flat-square
[dependency-status]: https://david-dm.org/i18next/i18next-gettext-converter

[dev-dependency-status-badge]: https://david-dm.org/i18next/i18next-gettext-converter/dev-status.svg?style=flat-square
[dev-dependency-status]: https://david-dm.org/i18next/i18next-gettext-converter#info=devDependencies
