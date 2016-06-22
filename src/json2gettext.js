const GettextParser = require('gettext-parser');
const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');
const { cyan } = require('chalk');

const plurals = require('./plurals');
const flatten = require('./flatten');

const readFileAsync = Promise.promisify(fs.readFile);

function i18nextToGettext(domain, source, target, options = {}) {
  return flattenI18nextJSON(source, options)
  .then(flat => {
    if (options.base) {
      return flattenI18nextJSON(options.base, options)
      .then(bflat => {
        Object.keys(bflat).forEach((key) => {
          if (flat[key]) {
            if (flat[key].plurals) {
              const ext = plurals.rules[domain.replace('_', '-').split('-')[0]];
              const pArray = [];

              for (let i = 0, len = flat[key].plurals.length; i < len; i++) {
                const plural = flat[key].plurals[i];
                pArray.splice(getGettextPluralPosition(ext, plural.pluralNumber), 0, plural.value);
              }
              pArray.splice(getGettextPluralPosition(ext, flat[key].pluralNumber), 0, flat[key].value);
              bflat[key].translated_value = (path.extname(target) === '.pot') ? '' : pArray;
            } else {
              bflat[key].translated_value = (path.extname(target) === '.pot') ? '' : flat[key].value;
            }
          }
        });
        return parseGettext(domain, bflat, options);
      });
    }

    return parseGettext(domain, flat, options);
  })
  .then(data => (
    (path.extname(target) === '.po' || path.extname(target) === '.pot')
      ? GettextParser.po.compile(data)
      : GettextParser.mo.compile(data)
  ));
}

/*
 * i18next json --> flat json
 */
function flattenI18nextJSON(source, options = {}) {
  if (!options.quiet) console.log((`\n    --> reading file from: ${source}`));

  return readFileAsync(source)
  .then(body => flatten.flatten(JSON.parse(body), options));
}

/*
 * flat json --> gettext
 */
function parseGettext(domain, data, options = {}) {
  const out = {
    charset: 'utf-8',
    headers: {
      'project-id-version': options.project || 'i18next-conv',
      'mime-version': '1.0',
      'content-type': 'text/plain; charset=utf-8',
      'content-transfer-encoding': '8bit',
    },
    translations: {},
  };

  const ext = plurals.rules[domain.replace('_', '-').split('-')[0]];
  const trans = {};
  const pluralFunc = (typeof ext.plurals === 'function') ? `${ext.plurals}`
    .match(/Number(\(.*\))/)[1]
    .replace(/ % /g, '%')
    .replace(/ > /g, '>')
    .replace(/ < /g, '<')
    .replace(/ >==? /g, '>=')
    .replace(/ <==? /g, '<=')
    .replace(/ !==? /g, '!=')
    .replace(/ ===? /g, '==') : ext.plurals.toString();

  out.headers['plural-forms'] =
    `nplurals=${ext.numbers.length}; ` +
    `plural=${pluralFunc}`;

  if (!options.noDate) {
    out.headers['pot-creation-date'] = new Date().toISOString();
    out.headers['po-revision-date'] = new Date().toISOString();
  }
  if (options.language) {
    out.headers.language = options.language;
  }
  if (!options.quiet) console.log(cyan('\n    <-> parsing data to gettext format'));

  const delkeys = [];

  Object.keys(data).forEach(m => {
    const kv = data[m];

    if (kv.plurals) {
      const pArray = [];

      for (let i = 0, len = kv.plurals.length; i < len; i++) {
        const plural = kv.plurals[i];
        pArray.splice(getGettextPluralPosition(ext, plural.pluralNumber), 0, plural.value);
      }
      pArray.splice(getGettextPluralPosition(ext, kv.pluralNumber), 0, kv.value);

      if (typeof trans[kv.context] !== 'object') trans[kv.context] = {};
      if (options.keyasareference) {
        if (typeof trans[kv.context][kv.value] === 'object') {
                      // same context and msgid. this could theorically be merged.
          trans[kv.context][kv.value].comments.reference.push(kv.key);
        } else {
          trans[kv.context][kv.value] = {
            msgctxt: kv.context,
            msgid: pArray[0],
            msgid_plural: pArray.slice(1, pArray.length),
            msgstr: kv.translated_value,
            comments: { reference: [kv.key] },
          };
        }
        if (kv.key !== kv.value) {
          delkeys.push([kv.context, kv.key]);
        }
      } else {
        trans[kv.context][kv.key] = {
          msgctxt: kv.context,
          msgid: kv.key,
          msgid_plural: kv.key,
          msgstr: pArray,
        };
      }
    } else {
      if (typeof trans[kv.context] !== 'object') trans[kv.context] = {};

      if (options.keyasareference) {
        if (typeof trans[kv.context][kv.value] === 'object') {
          // same context and msgid. this could theorically be merged.
          trans[kv.context][kv.value].comments.reference.push(kv.key);
        } else {
          trans[kv.context][kv.value] = {
            msgctxt: kv.context,
            msgid: kv.value,
            msgstr: kv.translated_value,
            comments: {
              reference: [kv.key],
            },
          };
        }
        if (kv.key !== kv.value) {
          delkeys.push([kv.context, kv.key]);
        }
      } else {
        trans[kv.context][kv.key] = { msgctxt: kv.context, msgid: kv.key, msgstr: kv.value };
      }
    }
  });

  delkeys.forEach(a => {
    const c = a[0];
    const k = a[1];
    delete trans[c][k];
  });

  // re-format reference comments to be able to compile with gettext-parser...
  Object.keys(trans).forEach(ctxt => {
    Object.keys(trans[ctxt]).forEach(id => {
      if (trans[ctxt][id].comments && trans[ctxt][id].comments.reference) {
        trans[ctxt][id].comments.reference = trans[ctxt][id].comments.reference.join('\n');
      }
    });
  });

  out.translations = trans;
  return Promise.resolve(out);
}

/*
 * helper to get plural suffix
 */
function getGettextPluralPosition(ext, suffix) {
  if (ext) {
    // if (ext.numbers.length === 2) {
    //     if (suffix === '-1') { // regular plural
    //         suffix = '1';
    //     } else if (suffix === '1') { // singular
    //         suffix = '2';
    //     }
    // }

    for (let i = 0, len = ext.numbers.length; i < len; i++) {
      if (ext.numbers[i].toString() === suffix) {
        return i;
      }
    }
  }

  return -1;
}

module.exports = i18nextToGettext;
