#!/usr/bin/env node

var program = require('commander')
  , converter = require("./lib/gettextWrapper")
  , colors = require("colors");

// test calls:

// gettext -> i18next
// node program.js -l es -s ./testfiles/utf8.po
// node program.js -l es -s ./testfiles/utf8.po -t ./testfiles/translation.es.json

// i18next -> gettext
// node program.js -l de -s ./testfiles/de/source.de.json 
// node program.js -l de -s ./testfiles/de/source.de.json -t ./testfiles/de/translation.de.po
// and back
// node program.js -l de -s ./testfiles/de/translation.de.po

// program
program
  .version('0.0.1')
  .option('-s, --source [path]', 'Specify path to read from')
  .option('-t, --target [path]', 'Specify path to write to', '')
  .option('-l, --language [domain]', 'Specify the language code, eg. \'en\'')
  .option('-ks, --keyseparator [path]', 'Specify keyseparator you want to use, defaults to ##', '##')
  .parse(process.argv);

if (program.source && program.language) {
	console.log('\nstart converting'.yellow);

	var options = {
		keyseparator: program.keyseparator
	};

	converter.process(program.language, program.source, program.target, options, function(err) {
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


