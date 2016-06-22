#!/usr/bin/env node

const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const program = require('commander');
const { red, green, blue, yellow } = require('chalk');

const { gettextToI18next, i18nextToGettext } = require('../lib');
const plurals = require('../lib/plurals');
const pkg = require('../package.json');

const writeFileAsync = Promise.promisify(fs.writeFile);

// test calls:

// gettext -> i18next
// babel-node bin -l en -s ./test/_testfiles/en/translation.utf8.po -t ./test/_tmp/en.json
// babel-node bin -l de -s ./test/_testfiles/de/translation.utf8.po -t ./test/_tmp/de.json
// babel-node bin -l ru -s ./test/_testfiles/ru/translation.utf8.po -t ./test/_tmp/ru.json

// With filter:
// babel-node bin -l en -s ./test/_testfiles/en/translation.utf8.po -t ./test/_tmp/en.json -f path/to/filter.js

// i18next -> gettext
// babel-node bin -l de -s ./test/_testfiles/de/translation.utf8.json -t ./test/_tmp/de.po
// and back
// babel-node bin -l de -s ./test/_tmp/de.po -t ./test/_tmp/de.json

// program
program
  .version(pkg.version)
  .option('-b, --base [path]', 'Sepcify path for the base language file. only take effect with -K option', '')
  .option('-f, --filter [path]', 'Specify path to gettext filter')
  .option('-l, --language [domain]', 'Specify the language code, eg. \'en\'')
  .option('-p, --pot', 'Generate POT file.')
  .option('-s, --source [path]', 'Specify path to read from')
  .option('-t, --target [path]', 'Specify path to write to', '')
  .option('-K, --keyasareference', 'Deal with the reference comment as a key', false)
  .option('-ks, --keyseparator [path]', 'Specify keyseparator you want to use, defaults to ##', '##')
  .option('-P, --plurals [path]', 'Specify path to plural forms definitions')
  .option('--quiet', 'Silence output', false)
  .option('--splitNewLine', 'Silence output', false)
  .option('--ctxSeparator [sep]', 'Specify the context separator', '_')
  .option('--ignorePlurals', 'Do not process the plurals')
  .parse(process.argv);

const {
  source,
  target,
  filter,
  ...options,
} = program;

if (filter && fs.existsSync(filter)) {
  options.filter = require(filter); // eslint-disable-line global-require
}

const {
  language,
  pot,
  base,
} = options;

if (source && language) {
  if (pot && !base) {
    console.log(red('\nat least call with argument -p and -b.'));
    console.log('(call program with argument -h for help.)\n\n');
    process.exit();
  }

  if (!options.quiet) console.log(yellow('\nstart converting'));

  processFile(language, source, target, options)
  .then(() => {
    if (!options.quiet) console.log(green('\nfile written\n\n'));
  })
  .catch((/* err */) => {
    console.log(red('\nfailed writing file\n\n'));
  });
} else {
  console.log(red('\nat least call with argument -l and -s.'));
  console.log('(call program with argument -h for help.)\n\n');
}

function processFile(domain, source, target, options) {
  const dirname = path.dirname(source);
  const ext = path.extname(source);
  const filename = path.basename(source, ext);

  if (options.plurals) {
    const pluralsPath = path.join(process.cwd(), options.plurals);
    plurals.rules = require(pluralsPath); // eslint-disable-line global-require

    if (!options.quiet) console.log(blue(`\nuse custom plural forms ${pluralsPath}\n`));
  }

  let converter;
  let targetExt;

  if (ext === '.mo' || ext === '.po' || ext === '.pot') {
    converter = gettextToI18next;
    targetExt = 'json';
  } else if (ext === '.json') {
    converter = i18nextToGettext;
    targetExt = 'po';
  } else {
    return null;
  }

  let targetDir;

  if (!target) {
    targetDir = (dirname.lastIndexOf(domain) === 0)
      ? dirname
      : path.join(dirname, domain);
    target = path.join(targetDir, `${filename}.${targetExt}`);
  } else {
    targetDir = path.dirname(target);
  }

  if (!fs.existsSync(targetDir)) {
    mkdirp.sync(targetDir);
  }

  return converter(domain, source, target, options)
  .then(data => writeFile(target, data, options));
}

function writeFile(target, data, options = {}) {
  if (!options.quiet) console.log((`\n    <-- writing file to: ${target}`));

  return writeFileAsync(target, data);
}