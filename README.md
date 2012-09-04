# Introduction

Project goal is to convert files from gettext to i18next json format and vice versa.

# Installation

1. first install node.js from [nodejs.org](http://nodejs.org/).
2. `npm install i18next-conv -g`

# Usage

## convert .mo or .po to i18next json

in your console type:


__for help:__

````
i18next-conv -h
````

__to convert a .mo or .po file to json:__

````
i18next-conv -l [domain] -s [sourcePath] -t [targetPath]
````

eg.: i18next-conv -l en -s ./locales/en.po -t ./locales/en/translation.json


_if no target (-t) is specified file will be stored to [sourceDir]/[domain]/translation.json._


# All credits go to

- [andri9's node-gettext](https://github.com/andris9/node-gettext) for parsing .mo and .po files
- [TJ Holowaychuk's commander.js](https://github.com/visionmedia/commander.js/) for console program

# License

Copyright (c) 2012 Jan Mühlemann

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