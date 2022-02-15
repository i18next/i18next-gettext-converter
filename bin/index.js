#!/usr/bin/env node

import path from 'path';
import { program } from 'commander';
import {
  mkdir, existsSync, readFileSync, promises as fsp,
} from 'fs'; // node 12 does not support fs/promises
import { createRequire } from 'module';
import {
  red, green, blue, yellow,
} from 'colorette';

import {
  gettextToI18next,
  i18nextToPo,
  i18nextToPot,
  i18nextToMo,
// https://github.com/import-js/eslint-plugin-import/issues/1649
// eslint-disable-next-line import/no-unresolved,node/no-missing-import
} from 'i18next-conv';

const { writeFile, readFile } = fsp;

const require = createRequire(import.meta.url);
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
  .option('--compatibilityJSON <ver>', "Set to 'v4' to generate i18next@21 compatible json files")
  .parse(process.argv);

const {
  source,
  target,
  filter,
  base: baseArg,
  ...options
} = program.opts();

if (filter && existsSync(filter)) {
  options.filter = require(path.resolve(filter)); // eslint-disable-line global-require,import/no-dynamic-require
}

if (baseArg && existsSync(baseArg)) {
  options.base = readFileSync(baseArg);
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
    process.exit(1); // eslint-disable-line no-process-exit
  }

  if (!options.quiet) console.log(yellow('start converting'));

  if (options.plurals) {
    const pluralsPath = path.join(process.cwd(), options.plurals);
    options.plurals = require(pluralsPath); // eslint-disable-line global-require,import/no-dynamic-require

    if (!options.quiet) console.log(blue(`use custom plural forms ${pluralsPath}`));
  }

  processFile(language, source, target, options)
    .then(() => {
      if (!options.quiet) console.log(green('file written'));
    })
    .catch((/* err */) => {
      console.log(red('failed writing file'));
      process.exitCode = 1
    });
} else {
  console.log(red('at least call with argument -l and -s.'));
  console.log('(call program with argument -h for help.)');
  process.exitCode = 1
}

function processFile(locale, source, target, options) {
  if (!options.quiet) console.log((`--> reading file from: ${source}`));

  return readFile(source)
    .then((body) => {
      const dirname = path.dirname(source);
      const ext = path.extname(source);
      const filename = path.basename(source, ext);

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

      if (!existsSync(targetDir)) {
        mkdir(targetDir, { recursive: true });
      }

      return converter(locale, body, options);
    })
    .then((data) => {
      if (!options?.quiet) console.log((`<-- writing file to: ${target}`));

      return writeFile(target, data);
    })
    .catch((err) => {
      if (err.code === 'ENOENT'){
        console.log(red(`file ${source} was not found.`));
      } else {
        console.log(red(err.message));
      }
      throw err
    });
}
