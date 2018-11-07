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

For i18next < 2.0.0 use i18next-conv@1.11.0, for i18next < 3.0.0 use i18next-conv@2.6.1, for i18next < 12.0.0 use i18next-conv@<8.

## Usage

### convert .mo or .po to i18next json

in your console type:


__for help:__

````
i18next-conv -h
````

__to convert a .mo or .po file to i8next json:__

````
i18next-conv -l [locale] -s [sourcePath] -t [targetPath]
````

eg.: i18next-conv -l en -s ./locales/en.po -t ./locales/en/translation.json


_if no target (-t) is specified file will be stored to [sourceDir]/[locale]/translation.json._

__to convert i18next json to a .mo or .po file:__

````
i18next-conv -l [locale] -s [sourcePath] -t [targetPath]
````

eg.: i18next-conv -l en -s ./locales/en.translation.json -t ./locales/en/translation.mo (or .po)

_if no target (-t) is specified file will be stored to [sourceDir]/[locale]/translation.po._


__for utf8-encoded po-files add these lines to your po file:__

````
"Content-Type: text/plain; charset=UTF-8\n"
"Content-Transfer-Encoding: 8bit\n"
````

It is necessary if you get corrupted output from the command above.

__to filter incoming po-file translations, pass the path to a module that exports a filter function:__

````
i18next-conv -l [locale] -s [sourcePath] -t [targetPath] -f [filterPath]
````

eg.: i18next-conv -l en -s ./locales/en.po -t ./locales/en/translation.json -f ./filter.js

The filter module should export a single function that accepts the gettext object, the locale and a callback
as its arguments. For the full API of the gettext object, check [node-gettext](https://github.com/alexanderwallin/node-gettext).
The function can then add/edit/delete translations, invoking the callback with an error object and the
translation table.

eg.

```javascript
// Delete all keys which do not belong to the frontend
module.exports = function (gt, locale, callback) {
  const clientSideSource = '/frontend/';
  const domain = 'messages';
  const translations = gt.catalogs[locale][domain].translations;
  gt.setLocale(locale); // Needed for when getComment is called

  Object.keys(translations).forEach(ctxt => {
    Object.keys(translations[ctxt]).forEach(key => {
      const comment = gt.getComment('messages', ctxt, key);
      if (comment) {
        if (comment.reference && comment.reference.indexOf(clientSideSource) === -1) {
          delete translations[ctxt][key];
        }
      }
    });
  });

  callback(null, translations);
};
```

## Options

```js
program
.version(i18nextConv.version)
.option('-b, --base [path]', 'Specify path for the base language file. only take effect with -K option', '')
.option('-f, --filter <path>', 'Specify path to gettext filter')
.option('-l, --language <locale>', 'Specify the language code, eg. \'en\'')
.option('-p, --pot', 'Generate POT file.')
.option('-s, --source <path>', 'Specify path to read from')
.option('-t, --target [path]', 'Specify path to write to', '')
.option('-K, --keyasareference', 'Deal with the reference comment as a key', false)
.option('-k, --keyseparator [path]', 'Specify keyseparator you want to use, defaults to ##', '##')
.option('-P, --plurals <path>', 'Specify path to plural forms definitions')
.option('--project <project>', 'Specify the project-id-version when converting json to gettext')
.option('--quiet', 'Silence output', false)
.option('--gettextDefaultCharset', 'Default charset when parsing gettext files with gettext-parser', 'UTF-8')
.option('--skipUntranslated', 'Skip untranslated keys when converting into json', false)
.option('--splitNewLine', 'Silence output', false)
.option('--ctxSeparator [sep]', 'Specify the context separator', '_')
.option('--ignorePlurals', 'Do not process the plurals')
.parse(process.argv);
```

## API

This module exposes a few functions to convert json to gettext and gettext to json. It accepts the same options as the cli.

```js
const path = require('path');
const { readFileSync, writeFileSync } = require('fs');
const {
  i18nextToPo,
  i18nextToPot,
  i18nextToMo,
  gettextToI18next,
} = require('i18next-conv');

const source = path.join(__dirname, '../locales/ua-UK/translation.json');
const options = {/* you options here */}

function save(target) {
  return result => {
    writeFileSync(target, result);
  };
}

i18nextToPo('ua-UK', readFileSync(source), options).then(save('../locales/ua-UK/translation.po'));
i18nextToPot('ua-UK', readFileSync(source), options).then(save('../locales/ua-UK/translation.pot'));
i18nextToMo('ua-UK', readFileSync(source), options).then(save('../locales/ua-UK/translation.mo'));

gettextToI18next('ua-UK', readFileSync('../locales/ua-UK/translation.po'), options)
.then(save('../locales/ua-UK/translation.json'));

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
