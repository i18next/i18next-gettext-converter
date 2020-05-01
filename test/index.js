const path = require('path');
const { expect } = require('chai');
const { readFileSync } = require('fs');

const {
  i18nextToPo,
  i18nextToPot, // eslint-disable-line no-unused-vars
  i18nextToMo,
  gettextToI18next,
} = require('..');

const testFiles = {
  en: {
    utf8: './test/_testfiles/en/translation.utf8.po',
    utf8_expected_mo: './test/_testfiles/en/translation.utf8.mo',
    utf8_expected: './test/_testfiles/en/translation.utf8.json',
    utf8_msgid: './test/_testfiles/en/translation.utf8_msgid.po',
    utf8_msgid_expected: './test/_testfiles/en/translation.utf8_msgid.json',
    latin13: './test/_testfiles/en/translation.latin13.po',
    latin13_expected: './test/_testfiles/en/translation.latin13.json',
    unfiltered: './test/_testfiles/en/translation.unfiltered.po',
    unfiltered_no_comments:
      './test/_testfiles/en/translation.unfiltered_no_comments.po',
    unfiltered_no_match:
      './test/_testfiles/en/translation.unfiltered_no_match.po',
    filtered: './test/_testfiles/en/translation.filtered.json',
    filtered_no_comments:
      './test/_testfiles/en/translation.filtered_no_comments.json',
    untranslated: './test/_testfiles/en/translation.untranslated.po',
    untranslated_expected: './test/_testfiles/en/translation.untranslated.json',
    untranslated_skipped:
      './test/_testfiles/en/translation.untranslated_skipped.json',
    fuzzy: './test/_testfiles/en/translation.fuzzy.po',
    fuzzy_expected: './test/_testfiles/en/translation.fuzzy.json',
    fuzzy_skipped: './test/_testfiles/en/translation.fuzzy_skipped.json',
    empty: './test/_testfiles/en/translation.empty.po',
    missing: './test/_testfiles/en/translation.missing.po',
    bad_format: './test/_testfiles/en/translation.bad_format.po.js',
    persist_plural_id_json:
      './test/_testfiles/en/translation.persist-msgid_plural.json',
    persist_plural_id_po:
      './test/_testfiles/en/translation.persist-msgid_plural.po',
  },

  de: {
    utf8: './test/_testfiles/de/translation.utf8.po',
    utf8_expected: './test/_testfiles/de/translation.utf8.json',
    utf8_msgid: './test/_testfiles/de/translation.utf8_msgid.po',
    utf8_msgid_expected: './test/_testfiles/de/translation.utf8_msgid.json',
    utf8_msgid_not_fully_translated:
      './test/_testfiles/de/translation.utf8_msgid_not_fully_translated.po',
    utf8_msgid_not_fully_translated_expected:
      './test/_testfiles/de/translation.utf8_msgid_not_fully_translated.json',
  },

  ru: {
    utf8: './test/_testfiles/ru/translation.utf8.po',
    utf8_expected: './test/_testfiles/ru/translation.utf8.json',
    utf8_2: './test/_testfiles/ru/translation2.utf8.po',
    utf8_2_expected: './test/_testfiles/ru/translation2.utf8.json',
    utf8_msgid_not_fully_translated:
      './test/_testfiles/ru/translation.utf8_msgid_not_fully_translated.po',
    utf8_msgid_not_fully_translated_expected:
      './test/_testfiles/ru/translation.utf8_msgid_not_fully_translated.json',
  },

  ja: {
    utf8: './test/_testfiles/ja/translation.utf8.po',
    utf8_expected: './test/_testfiles/ja/translation.utf8.json',
  },
};

/**
 * Test filter; removes all translations with a code comment that does
 * not include the string '/frontend/'
 *
 * @param gt
 * @param locale
 * @param callback
 * @private
 */
function testFilter(gt, locale, callback) {
  const clientSideSource = '/frontend/';
  const domain = 'messages';
  const { translations } = gt.catalogs[locale][domain];
  gt.setLocale(locale); // Needed for when getComment is called

  Object.keys(translations).forEach((ctxt) => {
    Object.keys(translations[ctxt]).forEach((key) => {
      const comment = gt.getComment('messages', ctxt, key);
      if (comment) {
        if (
          comment.reference
          && comment.reference.indexOf(clientSideSource) === -1
        ) {
          delete translations[ctxt][key];
        }
      }
    });
  });

  callback(null, translations);
}

function requireTestFile(file) {
  return require(path.join('..', file)); // eslint-disable-line global-require,import/no-dynamic-require
}

describe('i18next-gettext-converter', () => {
  describe('gettextToI18next', () => {
    it('should convert a utf8 PO files to JSON', () => Promise.all([
      expect(gettextToI18next('en', readFileSync(testFiles.en.utf8)).then(JSON.parse))
        .to.become(requireTestFile(testFiles.en.utf8_expected)),
      expect(gettextToI18next('en_us', readFileSync(testFiles.en.utf8), {
        splitNewLine: true,
      }).then(JSON.parse)).to.become(requireTestFile(testFiles.en.utf8_expected)),
      expect(gettextToI18next('de', readFileSync(testFiles.de.utf8), {
        splitNewLine: true,
      }).then(JSON.parse)).to.become(requireTestFile(testFiles.de.utf8_expected)),
      expect(gettextToI18next('ru', readFileSync(testFiles.ru.utf8), {
        splitNewLine: true,
      }).then(JSON.parse)).to.become(requireTestFile(testFiles.ru.utf8_expected)),
      expect(gettextToI18next('ja', readFileSync(testFiles.ja.utf8), {
        splitNewLine: true,
      }).then(JSON.parse)).to.become(requireTestFile(testFiles.ja.utf8_expected)),
    ]));

    it('should convert a latin13 PO files to JSON, for a given domain', () =>
      expect(gettextToI18next('en', readFileSync(testFiles.en.latin13), {
        splitNewLine: true,
      }).then(JSON.parse)).to.become(requireTestFile(testFiles.en.latin13_expected)));

    it('should filter incoming PO translations if a filter function is passed to options', () =>
      // Should filter all but the col* keys
      expect(gettextToI18next('en', readFileSync(testFiles.en.unfiltered), {
        filter: testFilter,
      }).then(JSON.parse)).to.become(requireTestFile(testFiles.en.filtered)));

    it('should pass all keys unfiltered, when the PO has no comments', () =>
      // Should filter none of the keys
      expect(gettextToI18next(
        'en',
        readFileSync(testFiles.en.unfiltered_no_comments),
        {
          splitNewLine: true,
          filter: testFilter,
        },
      ).then(JSON.parse)).to.become(requireTestFile(testFiles.en.filtered_no_comments)));

    it('should return an empty JSON file if nothing matches the given filter', () =>
      // Should filter all the keys
      expect(gettextToI18next('en', readFileSync(testFiles.en.unfiltered_no_match), {
        splitNewLine: true,
        filter: testFilter,
      }).then(JSON.parse)).to.become({}));

    it('should convert a utf8 PO file with msgid as an original string to a JSON file', () => Promise.all([
      expect(gettextToI18next('en', readFileSync(testFiles.en.utf8_msgid), {
        splitNewLine: true,
        keyasareference: true,
      }).then(JSON.parse)).to.become(requireTestFile(testFiles.en.utf8_msgid_expected)),
      expect(gettextToI18next('de', readFileSync(testFiles.de.utf8_msgid), {
        splitNewLine: true,
        keyasareference: true,
      }).then(JSON.parse)).to.become(requireTestFile(testFiles.de.utf8_msgid_expected)),
    ]));

    it('should fill in the original English strings if missing - convert a utf8 PO file with msgid as original string to a JSON file', () => Promise.all([
      expect(gettextToI18next(
        'de',
        readFileSync(testFiles.de.utf8_msgid_not_fully_translated),
        {
          splitNewLine: true,
          keyasareference: true,
        },
      ).then(JSON.parse)).to.become(requireTestFile(
        testFiles.de.utf8_msgid_not_fully_translated_expected,
      )),
      expect(gettextToI18next(
        'ru',
        readFileSync(testFiles.ru.utf8_msgid_not_fully_translated),
        {
          splitNewLine: true,
          keyasareference: true,
        },
      ).then(JSON.parse)).to.become(requireTestFile(
        testFiles.ru.utf8_msgid_not_fully_translated_expected,
      )),
    ]));

    it('should skip empty values appropriately', () => Promise.all([
      expect(gettextToI18next('en', readFileSync(testFiles.en.untranslated)).then(JSON.parse))
        .to.become(requireTestFile(testFiles.en.untranslated_expected)),
      expect(gettextToI18next('en', readFileSync(testFiles.en.untranslated), {
        skipUntranslated: true,
      }).then(JSON.parse)).to.become(requireTestFile(testFiles.en.untranslated_skipped)),
      expect(gettextToI18next('en', readFileSync(testFiles.en.untranslated), {
        keyasareference: true,
        skipUntranslated: true,
      }).then(JSON.parse)).to.become(requireTestFile(testFiles.en.untranslated_skipped)),
    ]));

    it('should skip fuzzy values appropriately', () => Promise.all([
      expect(gettextToI18next('en', readFileSync(testFiles.en.fuzzy)).then(JSON.parse))
        .to.become(requireTestFile(testFiles.en.fuzzy_expected)),
      expect(gettextToI18next('en', readFileSync(testFiles.en.fuzzy), {
        skipUntranslated: true,
      }).then(JSON.parse)).to.become(requireTestFile(testFiles.en.fuzzy_skipped)),
      expect(gettextToI18next('en', readFileSync(testFiles.en.fuzzy), {
        keyasareference: true,
        skipUntranslated: true,
      }).then(JSON.parse)).to.become(requireTestFile(testFiles.en.fuzzy_skipped)),
    ]));

    // -- Error States & Invalid Data --

    describe('error states', () => {
      it('should output an empty JSON file if the given PO exists but is empty', () => gettextToI18next('en', readFileSync(testFiles.en.empty), {
        splitNewLine: true,
      }).then((result) => {
        expect(JSON.parse(result)).to.deep.equal({});
      }));

      it('should throw a syntax error when passed an invalid PO', () =>
        expect(() => gettextToI18next('en', readFileSync(testFiles.en.bad_format), {
          splitNewLine: true,
        })).to.throw(SyntaxError, /Error parsing PO data/));
    });
  });

  describe('i18nextToGettext', () => {
    it('should convert a JSON file to utf8 PO', () => Promise.all([
      expect(i18nextToPo('en', readFileSync(testFiles.en.utf8_expected), {
        splitNewLine: true,
        noDate: true,
      })).to.become(readFileSync(testFiles.en.utf8).slice(0, -1)), // TODO: figure out last character
      expect(i18nextToPo('de', readFileSync(testFiles.de.utf8_expected), {
        splitNewLine: true,
        noDate: true,
      })).to.become(readFileSync(testFiles.de.utf8).slice(0, -1)), // TODO: figure out last character
      expect(i18nextToPo('ru', readFileSync(testFiles.ru.utf8_2_expected), {
        splitNewLine: true,
        noDate: true,
      })).to.become(readFileSync(testFiles.ru.utf8_2).slice(0, -1)), // TODO: figure out last character
      expect(i18nextToPo('ja', readFileSync(testFiles.ja.utf8_expected), {
        splitNewLine: true,
        noDate: true,
      })).to.become(readFileSync(testFiles.ja.utf8).slice(0, -1)), // TODO: figure out last character
    ]));

    it('should convert a JSON file to utf8 PO with msgid as an original string', () => Promise.all([
      expect(i18nextToPo('en', readFileSync(testFiles.en.utf8_msgid_expected), {
        splitNewLine: true,
        noDate: true,
        base: readFileSync(testFiles.en.utf8_msgid_expected),
        keyasareference: true,
      })).to.become(readFileSync(testFiles.en.utf8_msgid).slice(0, -1)),
      expect(i18nextToPo('de', readFileSync(testFiles.de.utf8_msgid_expected), {
        splitNewLine: true,
        noDate: true,
        base: readFileSync(testFiles.en.utf8_msgid_expected),
        keyasareference: true,
      })).to.become(readFileSync(testFiles.de.utf8_msgid).slice(0, -1)),
    ]));

    it('should convert a JSON file to utf8 MO', () =>
      expect(i18nextToMo('en', readFileSync(testFiles.en.utf8_expected), {
        splitNewLine: true,
        noDate: true,
      })).to.become(readFileSync(testFiles.en.utf8_expected_mo)));

    it('should return correct nplurals for Hebrew', () => i18nextToPo('he', '{}').then((result) => {
      const oneLine = result
        .toString()
        .replace(/\n/g, ' ')
        .replace(/"/g, '');
      expect(oneLine).to.include(
        'Plural-Forms: nplurals=4; plural=(n===1 ? 0 : n===2 ? 1 : (n<0 || n>10) &&  n%10==0 ? 2 : 3)',
      );
    }));

    describe('should return the correct plural forms for Portuguese', () => {
      [
        ['pt-PT', 'plural=(n != 1)'], // pt-PT = European Portuguese = nplurals=2; plural=(n != 1);
        ['pt-BR', 'plural=(n > 1)'], // pt-BR = Brazillian Portuguese = nplurals=2; plural=(n > 1);
        ['pt-br', 'plural=(n > 1)'], // pt-BR === pt-br
        ['pt', 'plural=(n > 1)'], // pt = Portuguese (catch all) == pt-BR == plural=(n > 1);
      ].forEach(([code, plural]) => {
        it(`${code} should have ${plural}`, () =>
          expect(i18nextToPo(code, '{}').then((result) => result.toString()))
            .to.eventually.include(`Plural-Forms: nplurals=2; ${plural}`));
      });
    });
  });

  describe('the functions', () => {
    it('should not require options or callback', () => {
      i18nextToPo('en', readFileSync(testFiles.en.utf8_expected));
    });
  });

  // this is basically working non i18next format eg. rails-i18n using gettext
  describe('persisting msgid_plural', () => {
    it('should convert to json merging the ids', () => {
      expect(gettextToI18next('en', readFileSync(testFiles.en.persist_plural_id_po), {
        persistMsgIdPlural: true,
      }).then(JSON.parse)).to.become(requireTestFile(testFiles.en.persist_plural_id_json));
    });

    it('should convert to po splitting the ids', () =>
      expect(i18nextToPo('en', readFileSync(testFiles.en.persist_plural_id_json), {
        persistMsgIdPlural: true,
        noDate: true,
        ctxSeparator:
        '_ is default but we set it to something that is never found!!!',
      })).to.become(readFileSync(testFiles.en.persist_plural_id_po).slice(0, -1)));
  });
});
