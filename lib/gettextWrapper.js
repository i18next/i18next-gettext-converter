var Gettext = require("node-gettext")
  , plurals = require("./plurals")
  , flatten = require("./flatten")
  , fs = require("fs")
  , path = require("path")
  , colors = require("colors");

var gt = new Gettext();

module.exports = {

    process: function(domain, source, target, options, callback) {
        var ext = path.extname(source);

        if (ext === '.mo' || ext === '.po') {
            return this.gettextToI18next(domain, source, target, options, callback);
        }

        if (ext === '.json') {
            return this.i18nextToGettext(domain, source, target, options, callback);
        }

    },

    /***************************
    *
    * I18NEXT JSON --> GETTEXT
    *
    ***************************/
    i18nextToGettext: function(domain, source, target, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }

        var self = this;

        var dirname = path.dirname(source)
          , ext = path.extname(source)
          , filename = path.basename(source, ext);

        if (!target) {
            target = path.join(dirname, domain, filename + '.po');

            var dir = path.join(dirname, domain);
            if (!fs.statSync(dir)) fs.mkdirSync(dir);
        }

        self.flattenI18nextJSON(source, options, function(err, flat) {
            self.parseGettext(domain, flat, function(err, gt) {

                var data = path.extname(target) === '.po' ? gt.compilePO(domain) : gt.compileMO(domain);

                self.writeFile(target, data, callback);
            });
        });
    },

    /* i18next json --> flat json
     *
     */
    flattenI18nextJSON: function(source, options, callback) {
        var self = this;

        console.log(('\n    --> reading file from: ' + source));
        fs.readFile(source, function(err, body) {
            if(err) {
                callback(err);
                return;
            }

            var flat = flatten.flatten(JSON.parse(body), options);

            callback(null, flat);
        });
    },

    /* flat json --> gettext
     *
     */
    parseGettext: function(domain, data, callback) {
        var gt = new Gettext();
        gt.addTextdomain(domain, '');

        for (var i = 0, len = data.length; i < len; i++) {
            var kv = data[i];
            gt.setTranslation(domain, kv.context, kv.key, kv.value);
        }

        callback(null, gt);
    },

    /***************************
    *
    * GETTEXT --> I18NEXT JSON
    *
    ***************************/
    gettextToI18next: function(domain, source, target, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }

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

    /* gettext --> barebone json
     *
     */
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

    /* barebone json --> i18next json
     *
     */
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
                    var ext = plurals.rules[domain.split('-')[0]];

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

    /* helper to get plural suffix
     *
     */
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
    },


    /***************************
    *
    * SHARED
    *
    ***************************/
    writeFile: function(target, data, callback) {

        console.log(('\n    <-- writting file to: ' + target));
        fs.writeFile(target, data, function(err) {
            callback(err);
        });

    }

};