var Gettext = require("node-gettext")
  , GettextParser = require("gettext-parser")
  , plurals = require("./plurals")
  , flatten = require("./flatten")
  , fs = require("fs")
  , path = require("path")
  , colors = require("colors")
  , mkdirp = require('mkdirp');

module.exports = {

    process: function(domain, source, target, options, callback) {
        callback = cleanCallback(options, callback);
        options = cleanOptions(options);
        var ext = path.extname(source);

        if (options.plurals) {
                var plurals_path = path.join(process.cwd(), options.plurals);
                plurals.rules = require(plurals_path);
                if (!options.quiet) console.log(('\nuse custom plural forms ' + plurals_path + '\n').blue);
        }

        if (ext === '.mo' || ext === '.po' || ext === '.pot') {
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
        callback = cleanCallback(options, callback);
        options = cleanOptions(options);

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
            self.writeFile(target, data + '\n', options, callback);
        });
    },

    i18nextToGettextData: function(domain, source, target, options, callback) {
        callback = cleanCallback(options, callback);
        options = cleanOptions(options);

        var self = this;

        self.flattenI18nextJSON(source, options, function(err, flat) {
	    var f = function(err, data) {
                var res = (path.extname(target) === '.po' || path.extname(target) === '.pot') ? GettextParser.po.compile(data) : GettextParser.mo.compile(data);
                callback(err, res);
            };
	    if (options.base) {
		self.flattenI18nextJSON(options.base, options, function(err, bflat) {
		    Object.keys(bflat).forEach(function(key) {
			if (flat[key]) {
			    if (flat[key].plurals) {
				var ext = plurals.rules[domain.replace('_', '-').split('-')[0]];
				var pArray = [];

				for (var i = 0, len = flat[key].plurals.length; i < len; i++) {
				    var plural = flat[key].plurals[i];
				    pArray.splice(self.getGettextPluralPosition(ext, plural.pluralNumber), 0, plural.value);
				}
				pArray.splice(self.getGettextPluralPosition(ext, flat[key].pluralNumber), 0, flat[key].value);
				bflat[key].translated_value = (path.extname(target) === '.pot') ? "" : pArray;
			    } else {
				bflat[key].translated_value = (path.extname(target) === '.pot') ? "" : flat[key].value;
			    }
			}
		    });
		    self.parseGettext(domain, bflat, options, f);
		});
	    } else {
		self.parseGettext(domain, flat, options, f);
	    }
        });
    },

    /* i18next json --> flat json
     *
     */
    flattenI18nextJSON: function(source, options, callback) {
        callback = cleanCallback(options, callback);
        options = cleanOptions(options);
        if (!options.quiet) console.log(('\n    --> reading file from: ' + source));

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
    parseGettext: function(domain, data, options, callback) {
        callback = cleanCallback(options, callback);
        options = cleanOptions(options);
	var out = {
	    "charset": "utf-8",
	    "headers": {
		"project-id-version": options.project || "i18next-conv",
		"mime-version": "1.0",
		"content-type": "text/plain; charset=utf-8",
		"content-transfer-encoding": "8bit",
	    },
	    "translations": {}
	};

        var ext = plurals.rules[domain.replace('_', '-').split('-')[0]];
	var trans = {};
	var plural_func = '' + ext.plurals;

	out['headers']['plural-forms'] = 'nplurals=' + ext.numbers.length + '; plural=' + plural_func.replace(/^function \(n\) \{ return Number/, '').replace(/; }$/, '');
	if (!options.noDate) {
	    out['headers']['pot-creation-date'] = new Date().toISOString();
	    out['headers']['po-revision-date'] = new Date().toISOString();
	}
	if (options.language)
	    out['headers']['language'] = options.language;
        if (!options.quiet) console.log('\n    <-> parsing data to gettext format'.cyan);

	var delkeys = [];

        for (var m in data) {
            var kv = data[m];

            if (kv.plurals) {
                var pArray = [];

                for (var i = 0, len = kv.plurals.length; i < len; i++) {
                    var plural = kv.plurals[i];
                    pArray.splice(this.getGettextPluralPosition(ext, plural.pluralNumber), 0, plural.value);
                }
                pArray.splice(this.getGettextPluralPosition(ext, kv.pluralNumber), 0, kv.value);

		if (typeof trans[kv.context] !== "object") trans[kv.context] = {}
		if (options.keyasareference) {
		    if (typeof trans[kv.context][kv.value] === "object") {
			// same context and msgid. this could theorically be merged.
			trans[kv.context][kv.value].comments.reference.push(kv.key);
		    } else {
			trans[kv.context][kv.value] = {"msgctxt": kv.context, "msgid": pArray[0], "msgid_plural": pArray.slice(1, pArray.length), "msgstr": kv.translated_value, "comments": {reference: [kv.key]}};
		    }
		    if (kv.key !== kv.value)
			delkeys.push([kv.context, kv.key]);
		} else {
		    trans[kv.context][kv.key] = {"msgctxt": kv.context, "msgid": kv.key, "msgid_plural": kv.key, "msgstr": pArray};
		}
            } else {
		if (typeof trans[kv.context] !== "object") trans[kv.context] = {}
		if (options.keyasareference) {
		    if (typeof trans[kv.context][kv.value] === "object") {
			// same context and msgid. this could theorically be merged.
			trans[kv.context][kv.value].comments.reference.push(kv.key);
		    } else {
			trans[kv.context][kv.value] = {"msgctxt": kv.context, "msgid": kv.value, "msgstr": kv.translated_value, "comments": {reference: [kv.key]}};
		    }
		    if (kv.key != kv.value)
			delkeys.push([kv.context, kv.key]);
		} else {
		    trans[kv.context][kv.key] = {"msgctxt": kv.context, "msgid": kv.key, "msgstr": kv.value};
		}
            }
        }
	delkeys.forEach(function(a) {
	    var c = a[0];
	    var k = a[1];
	    delete trans[c][k];
	});
	// re-format reference comments to be able to compile with gettext-parser...
	Object.keys(trans).forEach(function(ctxt) {
	    Object.keys(trans[ctxt]).forEach(function(id) {
		if (trans[ctxt][id].comments && trans[ctxt][id].comments.reference)
		    trans[ctxt][id].comments.reference = trans[ctxt][id].comments.reference.join("\n");
	    });
	});
	out["translations"] = trans;
        callback(null, out);
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
        callback = cleanCallback(options, callback);
        options = cleanOptions(options);

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
        callback = cleanCallback(options, callback);
        options = cleanOptions(options);

        var self = this;

        self.addTextDomain(domain, source, options, function(err, data) {
	    if (options.keyasareference) {
		var keys = [];

		Object.keys(data).forEach(function(ctxt) {
		    Object.keys(data[ctxt]).forEach(function(key) {
			if (data[ctxt][key].comments && data[ctxt][key].comments.reference) {
			    data[ctxt][key].comments.reference.split(/\r?\n|\r/).forEach(function(id) {
				var x = data[ctxt][key];
				data[ctxt][id] = x;
				x.msgid = id;
				if (id !== key)
				    keys.push([ctxt, key]);
			    });
			}
		    });
		});
		keys.forEach(function(a) {
		    var c = a[0];
		    var k = a[1];

		    delete data[c][k];
		});
	    }
            self.parseJSON(domain, data, options, function(err, json) {
                var jsonData = JSON.stringify(json, null, 4);
                callback(err, jsonData);
            });
        });
    },

    /* gettext --> barebone json
     *
     */
    addTextDomain: function(domain, source, options, callback) {
	var gt = new Gettext();
        callback = cleanCallback(options, callback);
        options = cleanOptions(options);
        if (!options.quiet) console.log(('\n    --> reading file from: ' + source));

        fs.readFile(source, function(err, body) {
            if(err) {
                callback(err);
                return;
            }

	    if (body.length > 0)
		gt.addTextdomain(domain, body);

            if (options.filter) {
                options.filter(gt, domain, callback);
            } else {
                callback(null, gt.domains[gt._normalizeDomain(domain)] && gt.domains[gt._normalizeDomain(domain)].translations);
            }
        });
    },

    /* barebone json --> i18next json
     *
     */
    parseJSON: function(domain, data, options, callback) {
        callback = cleanCallback(options, callback);
        options = cleanOptions(options);
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

		if (key.length === 0) {
		    // delete if msgid is empty.
		    // this might be the header.
		    delete context[key]
		    continue;
		}
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

                var values = context[key].msgstr;

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
        callback(null, json);
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
        callback = cleanCallback(options, callback);
        options = cleanOptions(options);
        if (!options.quiet) console.log(('\n    <-- writing file to: ' + target));
        fs.writeFile(target, data, function(err) {
            callback(err);
        });
    }
};


function cleanCallback (options, callback) {
    if (typeof options === 'function')
        callback = options;
    return callback || noop;
}

function cleanOptions (options) {
    if (typeof options === 'function')
        options = {};
    return options || {};
}

function noop () {}
