var Gettext = require("node-gettext")
  , i18next = require("i18next")
  , fs = require("fs")
  , path = require("path")
  , colors = require("colors");

var gt = new Gettext();

module.exports = {

	gettextToI18next: function(domain, source, target, callback) {
		var self = this;

        var dirname = path.dirname(source)
          , ext = path.extname(source)
          , filename = path.basename(source, ext);

        if (!target) {
            target = path.join(dirname, domain, filename + '.json');

            var dir = path.join(dirname, domain);
            if (!fs.statSync(dir)) fs.mkdirSync(dir);
        }

        self.addTextDomain(domain, source, function(err, data) {
            // console.log(data);

            self.parseJSON(domain, data, function(err, json) {
                var jsonData = JSON.stringify(json, null, 4);
                // console.log(jsonData);

                self.writeFile(target, jsonData, callback);
            });
        });




	},

	addTextDomain: function(domain, source, callback) {
		var self = this;

        console.log(('\n    --> reading file from: ' + source));
		fs.readFile(source, function(err, body) {
            if(err) {
                callback(err);
                return;
            }

            gt.addTextdomain("et", body);

            callback(null, gt._domains[gt._textdomain]._translationTable);
        });
	},

    writeFile: function(target, data, callback) {

        console.log(('\n    <-- writting file to: ' + target));
        fs.writeFile(target, data, function(err) {
            callback(err);
        });

    },

    parseJSON: function(domain, data, callback) {

        console.log('\n    <-> parsing data to i18next json format'.cyan);
        var json = {};

        for (var m in data) {

            var context = data[m];

            for (var key in context) {
                var values = context[key];

                if (m !== '') key = key + '_' + m;

                if (values.length === 1) {
                    json[key] = values[0];
                } else {
                    var ext = i18next.pluralExtensions.rules[domain.split('-')[0]];

                    for (var i = 0, len = values.length; i < len; i++) {
                        var pluralSuffix = this.getPluralExtension(ext, i);
                        var pkey = key + pluralSuffix;

                        json[pkey] = values[i];
                    }
                }
            }

        }

        callback(null, json);
    },

    getPluralExtension: function(ext, i) {

        if (ext) {
            var number = ext.numbers[i];
            if (ext.numbers.length === 2) {
                if (number === 2) { 
                    number = 1;
                } else if (number === 1) {
                    number = -1;
                }
                return number > 0 ? '' : '_plural';
            } else {
                return number === 1 ? '' : '_plural_' + number;
            }
        } else {
            return i === 1 ? '' : '_plural';
        }
    }

};