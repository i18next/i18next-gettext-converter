#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const mkdirp = require('mkdirp').sync;
const program = require('commander');
const {
  red, green, blue, yellow,
} = require('chalk');

const plurals = require('../lib/plurals');

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const {
  gettextToI18next,
  i18nextToPo,
  i18nextToPot,
  i18nextToMo,
} = require('../lib');

const { version } = require('../package.json');

// test calls:

// gettext -> i18next
// node bin -l en -s ./test/_testfiles/en/translation.utf8.po -t ./test/_tmp/en.json
// node bin -l de -s ./test/_testfiles/de/translation.utf8.po -t ./test/_tmp/de.json
// node bin -l ru -s ./test/_testfiles/ru/translation.utf8.po -t ./test/_tmp/ru.json

// With filter:
// node bin -l en -s ./test/_testfiles/en/translation.utf8.po -t ./test/_tmp/en.json -f path/to/filter.js

// i18next -> gettext
// node bin -l de -s ./test/_testfiles/de/translation.utf8.json -t ./test/_tmp/de.po
// and back
// node bin -l de -s ./test/_tmp/de.po -t ./test/_tmp/de.json

// program
program
  .version(version)
  .option('-b, --base [path]', 'Sepcify path for the base language file. only take effect with -K option', '')
  .option('-f, --filter <path>', 'Specify path to gettext filter')
  .option('-l, --language <locale>', 'Specify the language code, eg. \'en\'')
  .option('-p, --pot', 'Generate POT file.')
  .option('-s, --source <path>', 'Specify path to read from')
  .option('-t, --target [path]', 'Specify path to write to', '')
  .option('-K, --keyasareference', 'Deal with the reference comment as a key', false)
  .option('-k, --keyseparator [path]', 'Specify keyseparator you want to use, defaults to ##', '##')
  .option('-P, --plurals <path>', 'Specify path to plural forms definitions')
  .option('--project <name>', 'Specify the project-id-version when converting json to gettext')
  .option('--quiet', 'Silence output', false)
  .option('--gettextDefaultCharset', 'Default charset when parsing gettext files with gettext-parser')
  .option('--skipUntranslated', 'Skip untranslated keys when converting into json', false)
  .option('--splitNewLine', 'Silence output', false)
  .option('--ctxSeparator [sep]', 'Specify the context separator', '_')
  .option('--ignorePlurals', 'Do not process the plurals')
  .option('--foldLength', 'Specify the character fold length for strings')
  .parse(process.argv);

const {
  source,
  target,
  filter,
  base: baseArg,
  ...options
} = program;

if (filter && fs.existsSync(filter)) {
  options.filter = require(path.resolve(filter)); // eslint-disable-line global-require,import/no-dynamic-require
}

if (baseArg && fs.existsSync(baseArg)) {
  options.base = fs.readFileSync(baseArg);
}

const {
  language,
  pot,
  base,
} = options;

if (source && language) {
  if (pot && !base) {
    console.log(red('at least call with argument -p and -b.'));
    console.log('(call program with argument -h for help.)');
    process.exit();
  }

  if (!options.quiet) console.log(yellow('start converting'));

  processFile(language, source, target, options)
    .then(() => {
      if (!options.quiet) console.log(green('file written'));
    })
    .catch((/* err */) => {
      console.log(red('failed writing file'));
    });
} else {
  console.log(red('at least call with argument -l and -s.'));
  console.log('(call program with argument -h for help.)');
}

function processFile(locale, source, target, options) {
  if (!options.quiet) console.log((`--> reading file from: ${source}`));

  return readFileAsync(source)
    .then((body) => {
      const dirname = path.dirname(source);
      const ext = path.extname(source);
      const filename = path.basename(source, ext);

      if (options.plurals) {
        const pluralsPath = path.join(process.cwd(), options.plurals);
        plurals.rules = require(pluralsPath); // eslint-disable-line global-require,import/no-dynamic-require

        if (!options.quiet) console.log(blue(`use custom plural forms ${pluralsPath}`));
      }

      let targetDir;
      let targetExt;
      let converter;

      if (!target) {
        targetDir = (dirname.lastIndexOf(locale) === 0)
          ? dirname
          : path.join(dirname, locale);
        targetExt = (ext === '.json') ? '.po' : '.json';
        target = path.join(targetDir, `${filename}${targetExt}`);
      } else {
        targetDir = path.dirname(target);
        targetExt = path.extname(target);
      }

      switch (targetExt) {
        case '.po':
          converter = i18nextToPo;
          break;
        case '.pot':
          converter = i18nextToPot;
          break;
        case '.mo':
          converter = i18nextToMo;
          break;
        case '.json':
          converter = gettextToI18next;
          break;
        default:
          return null;
      }

      if (!fs.existsSync(targetDir)) {
        mkdirp(targetDir);
      }

      return converter(locale, body, options);
    })
    .then((data) => writeFile(target, data, options))
    .catch((err) => {
      if (err.code === 'ENOENT') console.log(red(`file ${source} was not found.`));
    });
}

function writeFile(target, data, options = {}) {
  if (!options.quiet) console.log((`<-- writing file to: ${target}`));

  return writeFileAsync(target, data);
}
