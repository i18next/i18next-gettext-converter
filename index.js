var program = require('commander')
  , converter = require("./lib/gettextWrapper");


// node index.js -l es -s ./testfiles/utf8.po

// program
program
  .version('0.0.1')
  .option('-s, --source [path]', 'Specify path to read from')
  .option('-l, --language [domain]', 'Specify the language code, eg. \'en\'')
  .parse(process.argv);

if (program.source) {
	converter.addTextDomain(program.language, program.source, function(err, data) {
		console.log(data);
	});
}

// expose to the world
module.exports = converter;


