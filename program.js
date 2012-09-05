#!/usr/bin/env node

var program = require('commander')
  , converter = require("./lib/gettextWrapper")
  , colors = require("colors");

// test calls:

// node index.js -l es -s ./testfiles/utf8.po
// node index.js -l es -s ./testfiles/utf8.po -t ./testfiles/translation.es.json

// program
program
  .version('0.0.1')
  .option('-s, --source [path]', 'Specify path to read from')
  .option('-t, --target [path]', 'Specify path to write to', '')
  .option('-l, --language [domain]', 'Specify the language code, eg. \'en\'')
  .parse(process.argv);

if (program.source && program.language) {
	console.log('\nstarting converting'.red);

	converter.gettextToI18next(program.language, program.source, program.target, function(err) {
		if (err) {
			console.log('\nfailed writing file\n\n'.red);
		} else {
			console.log('\nfile written\n\n'.green);
		}
	});
} else {
	console.log('\nat least call with argument -l and -t.'.red);
	console.log('(call program with argument -h for help.)\n\n');
}

// expose to the world
module.exports = converter;


