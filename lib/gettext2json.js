const { promisify } = require('util');

const Gettext = require('node-gettext');
const { po } = require('gettext-parser');

const plurals = require('./plurals');

function gettextToI18next(locale, body, options = {}) {
  return addTextLocale(locale, body, options)
    .then((data) => {
      if (options.keyasareference) {
        setKeysAsReference(data, options);
      }

      return parseJSON(locale, data, options);
    })
    .then((json) => JSON.stringify(json, null, 4));
}

/*
 * gettext --> barebone json
 */
function addTextLocale(locale, body, options = {}) {
  const gt = new Gettext();
  const domain = 'messages';
  const { filter, gettextDefaultCharset = 'UTF-8' } = options;

  if (body.length > 0) {
    gt.addTranslations(locale, domain, po.parse(body, gettextDefaultCharset));
  }

  if (filter) {
    const filterAsync = promisify(filter);
    return filterAsync(gt, locale);
  }

  return Promise.resolve(
    gt.catalogs[locale] && gt.catalogs[locale][domain].translations,
  );
}

function setKeysAsReference(data, options) {
  const keys = [];

  Object.keys(data).forEach((ctxt) => {
    Object.keys(data[ctxt]).forEach((key) => {
      if (data[ctxt][key].comments && data[ctxt][key].comments.reference) {
        data[ctxt][key].comments.reference.split(/\r?\n|\r|\s/).forEach((id) => {
          const x = data[ctxt][key];
          data[ctxt][id] = x;

          if (
            options.skipUntranslated
            && ((x.msgstr.length === 1 && !x.msgstr[0]) || isFuzzy(x))
          ) {
            return;
          }

          if (x.msgstr[0] === '') {
            x.msgstr[0] = x.msgid;
          }

          for (let i = 1; i < x.msgstr.length; i += 1) {
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

  keys.forEach((a) => {
    const c = a[0];
    const k = a[1];

    delete data[c][k];
  });
}

/*
 * barebone json --> i18next json
 */
function parseJSON(locale, data = {}, options = {}) {
  const separator = options.keyseparator || '##';
  const json = {};
  const ctxSeparator = options.ctxSeparator || '_';

  Object.keys(data).forEach((m) => {
    const context = data[m];

    Object.keys(context).forEach((key) => {
      let targetKey = key;
      let appendTo = json;

      if (key.length === 0) {
        // delete if msgid is empty.
        // this might be the header.
        delete context[key];
        return;
      }

      if (options.skipUntranslated && isFuzzy(context[key])) {
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
          x += 1;
        }
      }

      if (m !== '' && !options.ignoreCtx) targetKey = `${targetKey}${ctxSeparator}${m}`;

      if (options.persistMsgIdPlural) {
        // eslint-disable-next-line camelcase
        const { msgid, msgid_plural } = context[key];

        // eslint-disable-next-line camelcase
        if (msgid_plural && msgid !== msgid_plural) targetKey = `${msgid}|#|${msgid_plural}`;
      }

      const newValues = getGettextValues(context[key], locale, targetKey, options);

      Object.assign(appendTo, newValues);
    });
  });

  return Promise.resolve(json);
}

function getGettextValues(value, locale, targetKey, options) {
  const values = value.msgstr;
  const isPlural = !!value.msgid_plural;
  if (!isPlural) {
    return emptyOrObject(targetKey, values[0], options);
  }

  const ext = plurals.getRule(locale);
  const gettextValues = {};

  for (let i = 0; i < values.length; i += 1) {
    const pluralSuffix = getI18nextPluralExtension(ext, i);
    const pkey = targetKey + pluralSuffix;

    Object.assign(gettextValues, emptyOrObject(pkey, values[i], options));
  }

  return gettextValues;
}

/*
 * helper to get plural suffix
 */
function getI18nextPluralExtension(ext, i) {
  if (ext && ext.nplurals === 2) {
    return i === 0 ? '' : '_plural';
  }
  return `_${i}`;
}

function toArrayIfNeeded(value, { splitNewLine }) {
  return value.indexOf('\n') > -1 && splitNewLine ? value.split('\n') : value;
}

function emptyOrObject(key, value, options) {
  if (options.skipUntranslated && !value) {
    // empty string or other falsey
    return {};
  }

  return { [key]: toArrayIfNeeded(value, options) };
}

function isFuzzy(translation) {
  return !!translation.comments && translation.comments.flag === 'fuzzy';
}

module.exports = gettextToI18next;
