const Gettext = require('node-gettext');
const Promise = require('bluebird');

const plurals = require('./plurals');

function gettextToI18next(domain, body, target, options = {}) {
  return addTextDomain(domain, body, options)
  .then(data => {
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

    return parseJSON(domain, data, options);
  })
  .then(json => JSON.stringify(json, null, 4));
}

/*
 * gettext --> barebone json
 */
function addTextDomain(domain, body, options = {}) {
  const gt = new Gettext();

  if (body.length > 0) {
    gt.addTextdomain(domain, body);
  }

  if (options.filter) {
    const filterAsync = Promise.promisify(options.filter);
    return filterAsync(gt, domain);
  }

  return Promise.resolve(gt.domains[gt._normalizeDomain(domain)] && gt.domains[gt._normalizeDomain(domain)].translations);
}

/*
 * barebone json --> i18next json
 */
function parseJSON(domain, data = {}, options = {}) {
  const separator = options.keyseparator || '##';
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
          const pluralSuffix = getI18nextPluralExtension(ext, i);
          const pkey = targetKey + pluralSuffix;

          appendTo[pkey] = toArrayIfNeeded(values[i]);
        }
      }
    });
  });

  return Promise.resolve(json);
}

/*
 * helper to get plural suffix
 */
function getI18nextPluralExtension(ext, i) {
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
}

module.exports = gettextToI18next;
