const fs = require('fs');
const path = require('path');
const chai = require('chai');

const {
  i18nextToGettext,
  gettextToI18next,
} = require('../src');

const expect = chai.expect;

const testFiles = {
  en: {
    utf8: './test/_testfiles/en/translation.utf8.po',
    utf8_expected: './test/_testfiles/en/translation.utf8.json',
    utf8_msgid: './test/_testfiles/en/translation.utf8_msgid.po',
    utf8_msgid_expected: './test/_testfiles/en/translation.utf8_msgid.json',
    latin13: './test/_testfiles/en/translation.latin13.po',
    latin13_expected: './test/_testfiles/en/translation.latin13.json',
    unfiltered: './test/_testfiles/en/translation.unfiltered.po',
    unfiltered_no_comments: './test/_testfiles/en/translation.unfiltered_no_comments.po',
    unfiltered_no_match: './test/_testfiles/en/translation.unfiltered_no_match.po',
    filtered: './test/_testfiles/en/translation.filtered.json',
    filtered_no_comments: './test/_testfiles/en/translation.filtered_no_comments.json',
    empty: './test/_testfiles/en/translation.empty.po',
    missing: './test/_testfiles/en/translation.missing.po',
    bad_format: './test/_testfiles/en/translation.bad_format.po.js',
  },

  de: {
    utf8: './test/_testfiles/de/translation.utf8.po',
    utf8_expected: './test/_testfiles/de/translation.utf8.json',
    utf8_msgid: './test/_testfiles/de/translation.utf8_msgid.po',
    utf8_msgid_expected: './test/_testfiles/de/translation.utf8_msgid.json',
    utf8_msgid_not_fully_translated: './test/_testfiles/de/translation.utf8_msgid_not_fully_translated.po',
    utf8_msgid_not_fully_translated_expected: './test/_testfiles/de/translation.utf8_msgid_not_fully_translated.json',
  },

  ru: {
    utf8: './test/_testfiles/ru/translation.utf8.po',
    utf8_expected: './test/_testfiles/ru/translation.utf8.json',
    utf8_2: './test/_testfiles/ru/translation2.utf8.po',
    utf8_2_expected: './test/_testfiles/ru/translation2.utf8.json',
    utf8_msgid_not_fully_translated: './test/_testfiles/ru/translation.utf8_msgid_not_fully_translated.po',
    utf8_msgid_not_fully_translated_expected: './test/_testfiles/ru/translation.utf8_msgid_not_fully_translated.json',
  },
};


/**
 * Test filter; removes all translations with a code comment that does
 * not include the string '/frontend/'
 *
 * @param gt
 * @param domain
 * @param callback
 * @private
 */
function testFilter(gt, domain, callback) {
  const clientSideSource = '/frontend/';
  const normalizedDomain = gt._normalizeDomain(domain);
  let err;

  Object.keys(gt.domains[normalizedDomain].translations).forEach(ctxt => {
    Object.keys(gt.domains[normalizedDomain].translations[ctxt]).forEach(key => {
      const comment = gt.getComment(domain, '', key);
      if (comment) {
        if (comment.reference && comment.reference.indexOf(clientSideSource) === -1) {
          delete gt.domains[normalizedDomain].translations[ctxt][key];
        }
      }
    });
  });

  callback(err, gt.domains[normalizedDomain].translations);
}

describe('i18next-gettext-converter', () => {
  describe('gettextToI18next', () => {
    it('should convert a utf8 PO files to JSON', () =>
      Promise.all([
        gettextToI18next('en', testFiles.en.utf8, './test/_tmp/en.utf8.json', { quiet: true })
        .then(result => {
          const expected = require(path.join('..', testFiles.en.utf8_expected));
          expect(JSON.parse(result)).to.deep.equal(expected);
        }),
        gettextToI18next('en_us', testFiles.en.utf8, './test/_tmp/en_us.utf8.json', {
          quiet: true,
          splitNewLine: true,
        }).then(result => {
          const expected = require(path.join('..', testFiles.en.utf8_expected));
          expect(JSON.parse(result)).to.deep.equal(expected);
        }),
        gettextToI18next('de', testFiles.de.utf8, './test/_tmp/de.utf8.json', {
          quiet: true,
          splitNewLine: true,
        }).then(result => {
          const expected = require(path.join('..', testFiles.de.utf8_expected));
          expect(JSON.parse(result)).to.deep.equal(expected);
        }),
        gettextToI18next('ru', testFiles.ru.utf8, './test/_tmp/ru.utf8.json', {
          quiet: true,
          splitNewLine: true,
        }).then(result => {
          const expected = require(path.join('..', testFiles.ru.utf8_expected));
          expect(JSON.parse(result)).to.deep.equal(expected);
        }),
      ])
    );

    it('should convert a latin13 PO files to JSON, for a given domain', () =>
      gettextToI18next('en', testFiles.en.latin13, './test/_tmp/en.latin13.json', {
        quiet: true,
        splitNewLine: true,
      }).then(result => {
        const expected = require(path.join('..', testFiles.en.latin13_expected));
        expect(JSON.parse(result)).to.deep.equal(expected);
      })
    );

    it('should filter incoming PO translations if a filter function is passed to options', () => {
      const output = './test/_tmp/translation.filtered.json';
      const options = {
        quiet: true,
        filter: testFilter,
      };

      // Should filter all but the col* keys
      return gettextToI18next('en', testFiles.en.unfiltered, output, options)
      .then(result => {
        const expected = require(path.join('..', testFiles.en.filtered));
        expect(JSON.parse(result)).to.deep.equal(expected);
      });
    });

    it('should pass all keys unfiltered, when the PO has no comments', () => {
      const output = './test/_tmp/translation.nocomments.json';
      const options = {
        quiet: true,
        splitNewLine: true,
        filter: testFilter,
      };

      // Should filter none of the keys
      return gettextToI18next('en', testFiles.en.unfiltered_no_comments, output, options)
      .then(result => {
        const expected = require(path.join('..', testFiles.en.filtered_no_comments));
        expect(JSON.parse(result)).to.deep.equal(expected);
      });
    });

    it('should return an empty JSON file if nothing matches the given filter', () => {
      const output = './test/_tmp/translation.nomatch.json';
      const options = {
        quiet: true,
        splitNewLine: true,
        filter: testFilter,
      };

      // Should filter all the keys
      return gettextToI18next('en', testFiles.en.unfiltered_no_match, output, options)
      .then(result => {
        expect(JSON.parse(result)).to.deep.equal({});
      });
    });

    it('should convert a utf8 PO file with msgid as an original string to a JSON file', () =>
      Promise.all([
        gettextToI18next('en', testFiles.en.utf8_msgid, './test/_tmp/en.utf8_msgid.json', {
          quiet: true,
          splitNewLine: true,
          keyasareference: true,
        }).then(result => {
          const expected = require(path.join('..', testFiles.en.utf8_msgid_expected));
          expect(JSON.parse(result)).to.deep.equal(expected);
        }),
        gettextToI18next('de', testFiles.de.utf8_msgid, './test/_tmp/de.utf8_msgid.json', {
          quiet: true,
          splitNewLine: true,
          keyasareference: true,
        }).then(result => {
          const expected = require(path.join('..', testFiles.de.utf8_msgid_expected));
          expect(JSON.parse(result)).to.deep.equal(expected);
        }),
      ])
    );

    it('should fill in the original English strings if missing - convert a utf8 PO file with msgid as original string to a JSON file', () =>
      Promise.all([
        gettextToI18next('de', testFiles.de.utf8_msgid_not_fully_translated, './test/_tmp/de_utf8_msgid_not_fully_translated.json', {
          quiet: true,
          splitNewLine: true,
          keyasareference: true,
        }).then(result => {
          const expected = require(path.join('..', testFiles.de.utf8_msgid_not_fully_translated_expected));
          expect(JSON.parse(result)).to.deep.equal(expected);
        }),
        gettextToI18next('ru', testFiles.ru.utf8_msgid_not_fully_translated, './test/_tmp/ru_utf8_msgid_not_fully_translated.json', {
          quiet: true,
          splitNewLine: true,
          keyasareference: true,
        }).then(result => {
          const expected = require(path.join('..', testFiles.ru.utf8_msgid_not_fully_translated_expected));
          expect(JSON.parse(result)).to.deep.equal(expected);
        }),
      ])
    );

    // -- Error States & Invalid Data --

    describe('error states', () => {
      it('should output an empty JSON file if the given PO does not exist', () => {
        const output = './test/_tmp/translation.missing.json';

        return gettextToI18next('en', testFiles.en.missing, output, {
          quiet: true,
          splitNewLine: true,
        }).then(result => {
          expect(JSON.parse(result)).to.deep.equal({});
        });
      });

      it('should output an empty JSON file if the given PO exists but is empty', () => {
        const output = './test/_tmp/translation.empty.json';

        return gettextToI18next('en', testFiles.en.empty, output, {
          quiet: true,
          splitNewLine: true,
        }).then(result => {
          expect(JSON.parse(result)).to.deep.equal({});
        });
      });

      it('should output an empty JSON file if passed something other than a PO', () => {
        const output = './test/_tmp/translation.bad_format.json';

        return gettextToI18next('en', testFiles.en.bad_format, output, {
          quiet: true,
          splitNewLine: true,
        }).then(result => {
          expect(JSON.parse(result)).to.deep.equal({});
        });
      });
    });
  });

  describe('i18nextToGettext', () => {
    it('should convert a JSON file to utf8 PO', () =>
      Promise.all([
        i18nextToGettext('en', testFiles.en.utf8_expected, './test/_tmp/en.utf8.po', {
          quiet: true,
          splitNewLine: true,
          noDate: true,
        }).then(result => {
          const expected = fs.readFileSync(testFiles.en.utf8).slice(0, -1); // TODO: figure out last character
          expect(result).to.deep.equal(expected);
        }),
        i18nextToGettext('de', testFiles.de.utf8_expected, './test/_tmp/de.utf8.po', {
          quiet: true,
          splitNewLine: true,
          noDate: true,
        }).then(result => {
          const expected = fs.readFileSync(testFiles.de.utf8).slice(0, -1); // TODO: figure out last character
          expect(result).to.deep.equal(expected);
        }),
        i18nextToGettext('ru', testFiles.ru.utf8_2_expected, './test/_tmp/ru.utf8.po', {
          quiet: true,
          splitNewLine: true,
          noDate: true,
        }).then(result => {
          const expected = fs.readFileSync(testFiles.ru.utf8_2).slice(0, -1); // TODO: figure out last character
          expect(result).to.deep.equal(expected);
        }),
      ])
    );

    it('should convert a JSON file to utf8 PO with msgid as an original string', () =>
      Promise.all([
        i18nextToGettext('en', testFiles.en.utf8_msgid_expected, './test/_tmp/en.utf8.po', {
          quiet: true,
          splitNewLine: true,
          noDate: true,
          base: testFiles.en.utf8_msgid_expected,
          keyasareference: true,
        }).then(result => {
          const expected = fs.readFileSync(testFiles.en.utf8_msgid).slice(0, -1);
          expect(result.toString()).to.deep.equal(expected.toString());
        }),
        i18nextToGettext('de', testFiles.de.utf8_msgid_expected, './test/_tmp/de.utf8.po', {
          quiet: true,
          splitNewLine: true,
          noDate: true,
          base: testFiles.en.utf8_msgid_expected,
          keyasareference: true,
        }).then(result => {
          const expected = fs.readFileSync(testFiles.de.utf8_msgid).slice(0, -1);
          expect(result).to.deep.equal(expected);
        }),
      ])
    );
  });

  describe('the functions', () => {
    it('should not require options or callback', () => {
      const output = './test/_tmp/en.utf8.po';
      i18nextToGettext('en', testFiles.en.utf8_expected, output);
    });
  });
});
