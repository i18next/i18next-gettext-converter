var Gettext = require("node-gettext")
  , plurals = require("./plurals")
  , flatten = require("./flatten")
  , fs = require("fs")
  , path = require("path")
  , colors = require("colors")
  , mkdirp = require('mkdirp');

var gt = new Gettext();

module.exports = {

    process: function(domain, source, target, options, callback) {
        var ext = path.extname(source);

        if (options.plurals) {
                var plurals_path = path.join(process.cwd(), options.plurals);
                plurals.rules = require(plurals_path);
                if (!options.quiet) console.log(('\nuse custom plural forms ' + plurals_path + '\n').blue);
        }

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

        if(!fs.existsSync(target)){
            mkdirp.sync(path.dirname(target));
        }

        var dirname = path.dirname(source)
          , ext = path.extname(source)
          , filename = path.basename(source, ext);

        if(!fs.existsSync(target)){
          mkdirp.sync(path.dirname(target));
        }

        if (!target) {
            var dir;
            if (dirname.lastIndexOf(domain) === dirname.length - domain.length) {
                dir = path.join(dirname);
                target = path.join(dirname, filename + '.po');
            } else {
                dir = path.join(dirname, domain);
                target = path.join(dirname, domain, filename + '.po');
            }

            if (!fs.statSync(dir)) fs.mkdirSync(dir);

        }

        self.i18nextToGettextData(domain, source, target, options, function(err, data) {
            self.writeFile(target, data, options, callback);
        });
    },

    i18nextToGettextData: function(domain, source, target, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }

        var self = this;

        self.flattenI18nextJSON(source, options, function(err, flat) {
            self.parseGettext(domain, flat, options, function(err, gt) {
                var data = path.extname(target) === '.po' ? gt.compilePO(domain) : gt.compileMO(domain);
                if (typeof callback === 'function') {
                    callback(err, data);
                }
            });
        });
    },

    /* i18next json --> flat json
     *
     */
    flattenI18nextJSON: function(source, options, callback) {
        if (!options.quiet) console.log(('\n    --> reading file from: ' + source));

        fs.readFile(source, function(err, body) {
            if(err) {
                if (typeof callback === 'function') {
                    callback(err);
                }
                return;
            }

            var flat = flatten.flatten(JSON.parse(body), options);
            if (typeof callback === 'function') {
                callback(null, flat);
            }
        });
    },

    /* flat json --> gettext
     *
     */
    parseGettext: function(domain, data, options, callback) {
        var gt = new Gettext();
        gt.addTextdomain(domain, '');

        var ext = plurals.rules[domain.replace('_', '-').split('-')[0]];

        if (!options.quiet) console.log('\n    <-> parsing data to gettext format'.cyan);

        for (var m in data) {
            var kv = data[m];

            if (kv.plurals) {
                var pArray = [];

                for (var i = 0, len = kv.plurals.length; i < len; i++) {
                    var plural = kv.plurals[i];
                    pArray.splice(this.getGettextPluralPosition(ext, plural.pluralNumber), 0, plural.value);
                }
                pArray.splice(this.getGettextPluralPosition(ext, kv.pluralNumber), 0, kv.value);

                gt.setTranslation(domain, kv.context, kv.key, pArray);
            } else {
                gt.setTranslation(domain, kv.context, kv.key, kv.value);
            }
        }
        if (typeof callback === 'function') {
            callback(null, gt);
        }
    },

    /* helper to get plural suffix
     *
     */
    getGettextPluralPosition: function(ext, suffix) {
        if (ext) {
            // if (ext.numbers.length === 2) {
            //     if (suffix === '-1') { // regular plural
            //         suffix = '1';
            //     } else if (suffix === '1') { // singular
            //         suffix = '2';
            //     }
            // }

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

        if(!fs.existsSync(target)){
            mkdirp.sync(path.dirname(target));
        }

        if (!target) {
            var dir;
            if (dirname.lastIndexOf(domain) === dirname.length - domain.length) {
                dir = path.join(dirname);
                target = path.join(dirname, filename + '.json');
            } else {
                dir = path.join(dirname, domain);
                target = path.join(dirname, domain, filename + '.json');
            }

            if (!fs.statSync(dir)) fs.mkdirSync(dir);
        }

        self.gettextToI18nextData(domain, source, options, function(err, data) {
            self.writeFile(target, data, options, callback);
        });
    },

    gettextToI18nextData: function(domain, source, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }

        var self = this;

        self.addTextDomain(domain, source, options, function(err, data) {
            self.parseJSON(domain, data, options, function(err, json) {
                var jsonData = JSON.stringify(json, null, 4);
                if (typeof callback === 'function') {
                   callback(err, jsonData);
                }
            });
        });
    },

    /* gettext --> barebone json
     *
     */
    addTextDomain: function(domain, source, options, callback) {
        if (!options.quiet) console.log(('\n    --> reading file from: ' + source));

        fs.readFile(source, function(err, body) {
            if(err) {
                if (typeof callback === 'function') {
                    callback(err);
                }

                return;
            }

            gt.addTextdomain(domain, body);

            if (options.filter) {
                options.filter(gt, domain, callback);
            } else {
                if (typeof callback === 'function'){
                    callback(null, gt._domains[domain]._translationTable);
                }
            }
        });
    },

    /* barebone json --> i18next json
     *
     */
    parseJSON: function(domain, data, options, callback) {
        var separator = options.keyseparator || '##';

        if (!options.quiet) console.log('\n    <-> parsing data to i18next json format'.cyan);
        var json = {};

        var toArrayIfNeeded = function(value) {
            var ret = value;
            if (ret.indexOf('\n') > -1 && options.splitNewLine) ret = ret.split('\n');
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

                if (m !== '') targetKey = targetKey + '_' + m;

                if (values.length === 1) {
                    appendTo[targetKey] = toArrayIfNeeded(values[0]);
                } else {
                    var ext = plurals.rules[domain.replace('_', '-').split('-')[0]];

                    for (var i = 0, len = values.length; i < len; i++) {
                        var pluralSuffix = this.getI18nextPluralExtension(ext, i);
                        var pkey = targetKey + pluralSuffix;

                        appendTo[pkey] = toArrayIfNeeded(values[i]);
                    }
                }
            }

        }
        if (typeof callback === 'function'){
            callback(null, json);
        }
    },

    /* helper to get plural suffix
     *
     */
    getI18nextPluralExtension: function(ext, i) {
        if (ext) {
            var number = ext.numbers[i];
            if (ext.numbers.length === 2) {
                if (ext.numbers.length === 2) {
                    // germanic like en
                    if (ext.numbers[0] === 2) {
                        if (number === 2) {
                            number = 1; // singular
                        } else if (number === 1) {
                            number = -1; // regular plural
                        }
                    }
                    // romanic like fr
                    else if (ext.numbers[0] === 1) {
                        if (number === 2) {
                            number = -1; // regular plural
                        } else if (number === 1) {
                            number = 1; // singular
                        }
                    }
                }
                return number > 0 ? '' : '_plural';
            } else {
                return '_' + number;
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
    writeFile: function(target, data, options, callback) {
        if (!options.quiet) console.log(('\n    <-- writing file to: ' + target));
        fs.writeFile(target, data, function(err) {
            if (typeof callback === 'function') {
                callback(err);
            }
        });
    }
};
