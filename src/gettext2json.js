import { promisify } from 'util';

import Gettext from 'node-gettext';
import { po } from 'gettext-parser';
import { js2i18next } from 'gettext-converter';

export default function gettextToI18next(locale, body, options = {}) {
  return addTextLocale(locale, body, options)
    .then((translations) => js2i18next({ translations }, { ...options }))
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
