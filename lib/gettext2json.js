import Gettext from 'node-gettext';
import { po } from 'gettext-parser';
import { js2i18next } from 'gettext-converter';
import fromCallback from 'p-from-callback';

export default function gettextToI18next(locale, body, options = {}) {
  return addTextLocale(locale, body, options)
    .then((translations) => (translations ? js2i18next({ translations }, { ...options, locale }) : {}))
    .then((json) => JSON.stringify(json, null, 4));
}

/*
 * gettext --> barebone json
 */
function addTextLocale(locale, body, options = {}) {
  const gt = new Gettext();
  const domain = 'messages';
  const {
    filter,
    gettextDefaultCharset = 'UTF-8', // eslint-disable-line unicorn/text-encoding-identifier-case
  } = options;

  if (body.length > 0) {
    gt.addTranslations(locale, domain, po.parse(body, gettextDefaultCharset));
  }

  return filter
    ? fromCallback((cb) => filter(gt, locale, cb))
    : Promise.resolve(gt.catalogs[locale]?.[domain].translations);
}
