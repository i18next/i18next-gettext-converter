var fs = require('fs')
  , path = require('path')
  , chai = require('chai')
  , expect = chai.expect
  , wrapper = require('../lib/gettextWrapper');

// Test PO files
var testFiles = {
	utf8: './test/_data/po/utf8.po',
	latin13: './test/_data/po/latin13.po',
	utf8_unfiltered: './test/_data/po/utf8_unfiltered.po',
	utf8_unfiltered_no_comments: './test/_data/po/utf8_unfiltered_no_comments.po',
	utf8_unfiltered_no_match: './test/_data/po/utf8_unfiltered_no_match.po',
	missing: './test/_data/po/missing.po',
	empty: './test/_data/po/empty.po',
	bad_format: './test/_data/po/bad_format.po.js'
};

// Expected JSON results
var expectedResults = {
	translation: require('./_data/json/translation.et.json'),
	filtered_translation: require('./_data/json/translation.et.filtered.json')
};

// Test filter; removes all translations with a code comment that does
// not include the string '/frontend/'
function _filter(gt, domain, callback) {
	var clientSideSource = '/frontend/';
	var err;

	gt.listKeys(domain).forEach(function(key) {
		var comment = gt.getComment(domain, "", key);
		if (comment) {
			if (comment.code && comment.code.indexOf(clientSideSource) === -1) {
				gt.deleteTranslation(domain, "", key);
			}
		}
	});

	callback(err, gt._domains[gt._textdomain]._translationTable);
}

describe('the gettext wrapper', function() {

	describe('toJSON processing', function() {

		it('should convert a utf8 PO files to JSON, for a given domain', function(next) {

			var output = './test/_tmp/utf8.json';

			if (fs.existsSync(output)) {
				fs.unlinkSync(output);
			}

			// English
			wrapper.gettextToI18next('en', testFiles.utf8, output, {quiet: true}, function(){
				var result = require(path.join('..', output));
				expect(result).to.deep.equal(expectedResults.translation);
				fs.unlinkSync(output);
				next();
			});
		});

		it('should convert a latin13 PO files to JSON, for a given domain', function(next) {

			var output = './test/_tmp/latin13.json';

			if (fs.existsSync(output)) {
				fs.unlinkSync(output);
			}

			// French
			wrapper.gettextToI18next('fr', testFiles.latin13, output, {quiet: true}, function(){
				var result = require(path.join('..', output));
				expect(result).to.deep.equal(expectedResults.translation);
				fs.unlinkSync(output);
				next();
			});
		});

		it('should filter incoming PO translations if a filter function is passed to options', function(next) {
			var output = './test/_tmp/utf8_filtered.json';

			if (fs.existsSync(output)) {
				fs.unlinkSync(output);
			}

			var options = {
				quiet: true,
				filter: _filter
			};

			// Should filter all but the col* keys
			wrapper.gettextToI18next('en', testFiles.utf8_unfiltered, output, options, function(){
				var result = require(path.join('..', output));
				expect(result).to.deep.equal(expectedResults.filtered_translation);
				fs.unlinkSync(output);
				next();
			});
		});

		it('should pass all keys unfiltered, when the PO has no comments', function(next) {
			var output = './test/_tmp/utf8_filtered_no_comments.json';

			if (fs.existsSync(output)) {
				fs.unlinkSync(output);
			}

			var options = {
				quiet: true,
				filter: _filter
			};

			// Should filter none of the keys
			wrapper.gettextToI18next('en', testFiles.utf8_unfiltered_no_comments, output, options, function(){
				var result = require(path.join('..', output));
				expect(result).to.deep.equal(expectedResults.translation);
				fs.unlinkSync(output);
				next();
			});
		});

		it('should return an empty JSON file if nothing matches the given filter', function(next) {
			var output = './test/_tmp/utf8_filtered_no_match.json';

			if (fs.existsSync(output)) {
				fs.unlinkSync(output);
			}

			var options = {
				quiet: true,
				filter: _filter
			};

			// Should filter all the keys
			wrapper.gettextToI18next('en', testFiles.utf8_unfiltered_no_match, output, options, function(){
				var result = require(path.join('..', output));
				expect(result).to.deep.equal({});
				fs.unlinkSync(output);
				next();
			});
		});

		// -- Error States & Invalid Data --

		describe('error states', function() {

			it('should output an empty JSON file if the given PO does not exist', function(next) {
				var output = './test/_tmp/missing.json';

				if (fs.existsSync(output)) {
					fs.unlinkSync(output);
				}

				wrapper.gettextToI18next('en', testFiles.missing, output, {quiet: true}, function(err){
					var result = require(path.join('..', output));
					expect(result).to.deep.equal({});
					fs.unlinkSync(output);
					next();
				});
			});

			it('should output an empty JSON file if the given PO exists but is empty', function(next) {
				var output = './test/_tmp/empty.json';

				if (fs.existsSync(output)) {
					fs.unlinkSync(output);
				}

				wrapper.gettextToI18next('en', testFiles.empty, output, {quiet: true}, function(){
					var result = require(path.join('..', output));
					expect(result).to.deep.equal({});

					fs.unlinkSync(output);
					next();
				});
			});

			it('should output an empty JSON file if passed something other than a PO', function(next) {
				var output = './test/_tmp/bad_format.json';

				if (fs.existsSync(output)) {
					fs.unlinkSync(output);
				}

				wrapper.gettextToI18next('en', testFiles.bad_format, output, {quiet: true}, function(){
					var result = require(path.join('..', output));
					expect(result).to.deep.equal({});

					fs.unlinkSync(output);
					next();
				});
			});
		});
	});
});