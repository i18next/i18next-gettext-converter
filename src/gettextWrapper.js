const Gettext = require('node-gettext');
const GettextParser = require('gettext-parser');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const { blue, cyan } = require('chalk');

const plurals = require('./plurals');
const flatten = require('./flatten');
const utils = require('./utils');

const {
  cleanCallback,
  cleanOptions,
} = utils;

module.exports = {
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

  /***************************
   *
   * I18NEXT JSON --> GETTEXT
   *
   ***************************/
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

    this.i18nextToGettextData(domain, source, target, options, (err, data) => {
      this.writeFile(target, `${data}\n`, options, callback);
    });
  },

  i18nextToGettextData(domain, source, target, options, callback) {
    callback = cleanCallback(options, callback);
    options = cleanOptions(options);

    this.flattenI18nextJSON(source, options, (err, flat) => {
      const f = (err, data) => {
        const res = (path.extname(target) === '.po' || path.extname(target) === '.pot') ? GettextParser.po.compile(data) : GettextParser.mo.compile(data);
        callback(err, res);
      };

      if (options.base) {
        this.flattenI18nextJSON(options.base, options, (err, bflat) => {
          Object.keys(bflat).forEach((key) => {
            if (flat[key]) {
              if (flat[key].plurals) {
                const ext = plurals.rules[domain.replace('_', '-').split('-')[0]];
                const pArray = [];

                for (let i = 0, len = flat[key].plurals.length; i < len; i++) {
                  const plural = flat[key].plurals[i];
                  pArray.splice(this.getGettextPluralPosition(ext, plural.pluralNumber), 0, plural.value);
                }
                pArray.splice(this.getGettextPluralPosition(ext, flat[key].pluralNumber), 0, flat[key].value);
                bflat[key].translated_value = (path.extname(target) === '.pot') ? '' : pArray;
              } else {
                bflat[key].translated_value = (path.extname(target) === '.pot') ? '' : flat[key].value;
              }
            }
          });
          this.parseGettext(domain, bflat, options, f);
        });
      } else {
        this.parseGettext(domain, flat, options, f);
      }
    });
  },

    /* i18next json --> flat json
     *
     */
  flattenI18nextJSON(source, options, callback) {
    callback = cleanCallback(options, callback);
    options = cleanOptions(options);
    if (!options.quiet) console.log((`\n    --> reading file from: ${source}`));

    fs.readFile(source, (err, body) => {
      if (err) {
        callback(err);
        return;
      }

      const flat = flatten.flatten(JSON.parse(body), options);
      callback(null, flat);
    });
  },

  /*
   * flat json --> gettext
   */
  parseGettext(domain, data, options, callback) {
    callback = cleanCallback(options, callback);
    options = cleanOptions(options);

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
          pArray.splice(this.getGettextPluralPosition(ext, plural.pluralNumber), 0, plural.value);
        }
        pArray.splice(this.getGettextPluralPosition(ext, kv.pluralNumber), 0, kv.value);

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
    callback(null, out);
  },

  /*
   * helper to get plural suffix
   */
  getGettextPluralPosition(ext, suffix) {
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
  },

  /***************************
   *
   * GETTEXT --> I18NEXT JSON
   *
   ***************************/

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

    this.gettextToI18nextData(domain, source, options, (err, data) => {
      this.writeFile(target, data, options, callback);
    });
  },

  gettextToI18nextData(domain, source, options, callback) {
    callback = cleanCallback(options, callback);
    options = cleanOptions(options);

    this.addTextDomain(domain, source, options, (err, data) => {
      if (options.keyasareference) {
        const keys = [];

        Object.keys(data).forEach(ctxt => {
          Object.keys(data[ctxt]).forEach(key => {
            if (data[ctxt][key].comments && data[ctxt][key].comments.reference) {
              data[ctxt][key].comments.reference.split(/\r?\n|\r/).forEach(id => {
                const x = data[ctxt][key];
                data[ctxt][id] = x;
                if (x.msgstr[0] === '') {
                  x.msgstr[0] = x.msgid;
                }
                for (let i = 1; i < x.msgstr.length; i++) {
                  if (x.msgstr[i] === '') {
                    x.msgstr[i] = x.msgid_plural;
                  }
                }
                x.msgid = id;
                if (id !== key) {
                  keys.push([ctxt, key]);
                }
              });
            }
          });
        });

        keys.forEach(a => {
          const c = a[0];
          const k = a[1];

          delete data[c][k];
        });
      }

      this.parseJSON(domain, data, options, (err, json) => {
        const jsonData = JSON.stringify(json, null, 4);
        callback(err, jsonData);
      });
    });
  },

  /*
   * gettext --> barebone json
   */
  addTextDomain(domain, source, options, callback) {
    const gt = new Gettext();
    callback = cleanCallback(options, callback);
    options = cleanOptions(options);
    if (!options.quiet) console.log((`\n    --> reading file from: ${source}`));

    fs.readFile(source, (err, body) => {
      if (err) {
        callback(err);
        return;
      }

      if (body.length > 0) {
        gt.addTextdomain(domain, body);
      }

      if (options.filter) {
        options.filter(gt, domain, callback);
      } else {
        callback(null, gt.domains[gt._normalizeDomain(domain)] && gt.domains[gt._normalizeDomain(domain)].translations);
      }
    });
  },

  /*
   * barebone json --> i18next json
   */
  parseJSON(domain, data = {}, options, callback) {
    callback = cleanCallback(options, callback);
    options = cleanOptions(options);
    const separator = options.keyseparator || '##';

    if (!options.quiet) console.log(cyan('\n    <-> parsing data to i18next json format'));
    const json = {};

    const toArrayIfNeeded = value => {
      let ret = value;
      if (ret.indexOf('\n') > -1 && options.splitNewLine) ret = ret.split('\n');
      return ret;
    };

    Object.keys(data).forEach(m => {
      const context = data[m];

      Object.keys(context).forEach(key => {
        let targetKey = key;
        let appendTo = json;

        if (key.length === 0) {
          // delete if msgid is empty.
          // this might be the header.
          delete context[key];
          return;
        }

        if (key.indexOf(separator) > -1) {
          const keys = key.split(separator);

          let x = 0;
          while (keys[x]) {
            if (x < keys.length - 1) {
              appendTo[keys[x]] = appendTo[keys[x]] || {};
              appendTo = appendTo[keys[x]];
            } else {
              targetKey = keys[x];
            }
            x++;
          }
        }

        const values = context[key].msgstr;

        if (m !== '') targetKey = `${targetKey}_${m}`;

        if (values.length === 1) {
          appendTo[targetKey] = toArrayIfNeeded(values[0]);
        } else {
          const ext = plurals.rules[domain.replace('_', '-').split('-')[0]];

          for (let i = 0, len = values.length; i < len; i++) {
            const pluralSuffix = this.getI18nextPluralExtension(ext, i);
            const pkey = targetKey + pluralSuffix;

            appendTo[pkey] = toArrayIfNeeded(values[i]);
          }
        }
      });
    });

    callback(null, json);
  },

  /*
   * helper to get plural suffix
   */
  getI18nextPluralExtension(ext, i) {
    if (ext) {
      let number = ext.numbers[i];
      if (ext.numbers.length === 2) {
        if (ext.numbers.length === 2) {
                    // germanic like en
          if (ext.numbers[0] === 2) {
            if (number === 2) {
              number = 1; // singular
            } else if (number === 1) {
              number = -1; // regular plural
            }
          } else if (ext.numbers[0] === 1) { // romanic like fr
            if (number === 2) {
              number = -1; // regular plural
            } else if (number === 1) {
              number = 1; // singular
            }
          }
        }
        return number > 0 ? '' : '_plural';
      }

      return `_${number}`;
    }

    return i === 1 ? '' : '_plural';
  },


  /** *************************
   *
   * SHARED
   *
   ***************************/
  writeFile(target, data, options, callback) {
    callback = cleanCallback(options, callback);
    options = cleanOptions(options);
    if (!options.quiet) console.log((`\n    <-- writing file to: ${target}`));
    fs.writeFile(target, data, err => {
      callback(err);
    });
  },
};
