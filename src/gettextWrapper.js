const Promise = require('bluebird');
const path = require('path');
const mkdirp = require('mkdirp');
const fs = require('fs');
const { blue } = require('chalk');

const plurals = require('./plurals');
const gettextToI18next = require('./gettext2json');
const i18nextToGettext = require('./json2gettext');

const writeFileAsync = Promise.promisify(fs.writeFile);

module.exports = {
  gettextToI18next(domain, source, target, options, callback) {
    callback = cleanCallback(options, callback);
    options = cleanOptions(options);

    const dirname = path.dirname(source);
    const ext = path.extname(source);
    const filename = path.basename(source, ext);

    if (!fs.existsSync(target)) {
      mkdirp.sync(path.dirname(target));
    }

    if (!target) {
      let dir;
      if (dirname.lastIndexOf(domain) === dirname.length - domain.length) {
        dir = path.join(dirname);
        target = path.join(dirname, `${filename}.json`);
      } else {
        dir = path.join(dirname, domain);
        target = path.join(dirname, domain, `${filename}.json`);
      }

      if (!fs.statSync(dir)) fs.mkdirSync(dir);
    }

    return gettextToI18next(domain, source, options)
    .then(data => writeFile(target, data, options))
    .asCallback(callback);
  },

  i18nextToGettext(domain, source, target, options, callback) {
    callback = cleanCallback(options, callback);
    options = cleanOptions(options);

    if (!fs.existsSync(target)) {
      mkdirp.sync(path.dirname(target));
    }

    const dirname = path.dirname(source);
    const ext = path.extname(source);
    const filename = path.basename(source, ext);

    if (!fs.existsSync(target)) {
      mkdirp.sync(path.dirname(target));
    }

    if (!target) {
      let dir;
      if (dirname.lastIndexOf(domain) === dirname.length - domain.length) {
        dir = path.join(dirname);
        target = path.join(dirname, `${filename}.po`);
      } else {
        dir = path.join(dirname, domain);
        target = path.join(dirname, domain, `${filename}.po`);
      }

      if (!fs.statSync(dir)) fs.mkdirSync(dir);
    }

    return i18nextToGettext(domain, source, target, options)
    .then(data => writeFile(target, `${data}\n`, options))
    .asCallback(callback);
  },

  process(domain, source, target, options, callback) {
    callback = cleanCallback(options, callback);
    options = cleanOptions(options);
    const ext = path.extname(source);

    if (options.plurals) {
      const pluralsPath = path.join(process.cwd(), options.plurals);
      plurals.rules = require(pluralsPath); // eslint-disable-line global-require
      if (!options.quiet) console.log(blue(`\nuse custom plural forms ${pluralsPath}\n`));
    }

    if (ext === '.mo' || ext === '.po' || ext === '.pot') {
      return this.gettextToI18next(domain, source, target, options, callback);
    }

    if (ext === '.json') {
      return this.i18nextToGettext(domain, source, target, options, callback);
    }

    return null;
  },
};

function noop() {}

function cleanCallback(options, callback) {
  if (typeof options === 'function') {
    callback = options;
  }
  return callback || noop;
}

function cleanOptions(options = {}) {
  return (typeof options === 'function') ? {} : options;
}

function writeFile(target, data, options = {}) {
  if (!options.quiet) console.log((`\n    <-- writing file to: ${target}`));

  return writeFileAsync(target, data);
}
