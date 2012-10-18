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
            var dir;
            if (dirname.indexOf(domain) === dirname.length - domain.length) {
                dir = path.join(dirname);
                target = path.join(dirname, filename + '.po');
            } else {
                dir = path.join(dirname, domain);
                target = path.join(dirname, domain, filename + '.po');
            }
            
            if (!fs.statSync(dir)) fs.mkdirSync(dir);
        }

        self.flattenI18nextJSON(source, options, function(err, flat) {
            //self.writeFile('./' + path.join(dirname, filename + '_tmp.json'), JSON.stringify(flat, null, 4), function(){});

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

        var ext = plurals.rules[domain.split('-')[0]];

        console.log('\n    <-> parsing data to gettext format'.cyan);

        for (var m in data) {
            var kv = data[m];

            if (kv.plurals) {
                var pArray = [];
                pArray.splice(this.getGettextPluralPosition(ext, '-1'), 0, kv.value);
                for (var i = 0, len = kv.plurals.length; i < len; i++) {
                    var plural = kv.plurals[i];
                    pArray.splice(this.getGettextPluralPosition(ext, plural.pluralNumber), 0, plural.value);

                    gt.setTranslation(domain, kv.context, kv.key, pArray);
                }
            } else {
                gt.setTranslation(domain, kv.context, kv.key, kv.value);
            }
        }

        callback(null, gt);
    },

    /* helper to get plural suffix
     *
     */
    getGettextPluralPosition: function(ext, suffix) {

        if (ext) {
            if (ext.numbers.length === 2) {
                if (suffix === '-1') {
                    suffix = '1';
                } else if (suffix === '1') {
                    suffix = '2';
                }
            }

            for (var i = 0, len = ext.numbers.length; i < len; i++) {
                if (ext.numbers[i].toString() === suffix) {
                    return i;
                }
            }
        }

        return -1;
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
            var dir;
            if (dirname.indexOf(domain) === dirname.length - domain.length) {
                dir = path.join(dirname);
                target = path.join(dirname, filename + '.json');
            } else {
                dir = path.join(dirname, domain);
                target = path.join(dirname, domain, filename + '.json');
            }

            if (!fs.statSync(dir)) fs.mkdirSync(dir);
        }

        self.addTextDomain(domain, source, function(err, data) {
            // console.log(data);

            self.parseJSON(domain, data, options, function(err, json) {
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
    parseJSON: function(domain, data, options, callback) {
        var separator = options.keyseparator || '##';

        console.log('\n    <-> parsing data to i18next json format'.cyan);
        var json = {};

        var toArrayIfNeeded = function(value) {
            var ret = value;
            if (ret.indexOf('\n') > -1) ret = ret.split('\n');
            return ret;
        };

        for (var m in data) {
            var context = data[m];

            for (var key in context) {
                var appendTo = json
                  , targetKey = key;

                if (key.indexOf(separator) > -1) {
                    var keys = key.split(separator);

                    var x = 0;
                    while (keys[x]) {
                        if (x < keys.length - 1) {
                            appendTo[keys[x]] = appendTo[keys[x]] || {};
                            appendTo = appendTo[keys[x]];
                        } else {
                            targetKey = keys[x];
                        }
                        x++;
                    }
                }

                var values = context[key];

                if (m !== '') key = key + '_' + m;

                if (values.length === 1) {
                    appendTo[targetKey] = toArrayIfNeeded(values[0]);
                } else {
                    var ext = plurals.rules[domain.split('-')[0]];

                    for (var i = 0, len = values.length; i < len; i++) {
                        var pluralSuffix = this.getI18nextPluralExtension(ext, i);
                        var pkey = targetKey + pluralSuffix;

                        appendTo[pkey] = toArrayIfNeeded(values[i]);
                    }
                }
            }

        }

        callback(null, json);
    },

    /* helper to get plural suffix
     *
     */
    getI18nextPluralExtension: function(ext, i) {

        if (ext) {
            var number = ext.numbers[i];
            if (ext.numbers.length === 2) {
                if (number === 2) { 
                    number = 1; // is basic plural
                } else if (number === 1) {
                    number = -1; // is singular
                }
                return number > 0 ? '' : '_plural';
            } else {
                return number === 1 ? '' : '_plural_' + number; // suffix all but singular
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