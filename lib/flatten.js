function regexIndexOf(value, regex, startpos) {
    var indexOf = value.substring(startpos || 0).search(regex);
    return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
}

function splitValue(value, index) {
    return [value.substring(0, index), value.substring(index)];
}

module.exports = {

    flatten: function(input, options) {
        var flat = {}
          , separator = options.keyseparator || '##'
          , ctxSeparator = options.ctxSeparator || '_';

        function recurse(appendTo, obj, parentKey) {

            for (var m in obj) {
                var kv
                  , value = obj[m]
                  , key = parentKey
                  , context = '';

                if (key.length > 0) {
                    key = key + separator + m;
                } else {
                    key = m;
                }

                // get context if used
                var pluralIndex = key.indexOf('_plural');
                if (pluralIndex < 0) pluralIndex = regexIndexOf(key, /_\d+/);

                var isPlural = pluralIndex > -1;
		if (options.ignorePlurals)
		    isPlural = false;
                var number;
                if (isPlural && key.indexOf('_plural') < 0) {
                  number = parseInt(key.substring(pluralIndex + 1), 10);
                  if (number === 1) {
                    isPlural = false;
                  }
                  key = key.substring(0, pluralIndex);
                } else if (key.indexOf('_plural') > -1) {
                  number = 2;
                  key = key.substring(0, pluralIndex);
                }

                var ctxKey = key;

                if (isPlural) {
                    ctxKey = ctxKey.substring(0, pluralIndex);
                    if (ctxKey.indexOf(ctxSeparator) > -1) context = ctxKey.substring(ctxKey.lastIndexOf(ctxSeparator) + 1, ctxKey.length);
                }
                else if (key.indexOf(ctxSeparator) > -1) {
                    context = ctxKey.substring(ctxKey.lastIndexOf(ctxSeparator) + 1, ctxKey.length);
                }
                else {
                    context = "";
                }

                if (context === key) context = '';

                if (context !== '') key = key.replace(ctxSeparator + context, '');

                // append or recurse
                var appendKey = key + context;
                if (isPlural) appendKey = appendKey + '_' + number;
                if (typeof value === 'string') {
                    kv = {
                        //id: key.replace(new RegExp(' ', 'g'), ''),
                        key: key,
                        value: value,
                        isPlural: isPlural,
                        pluralNumber: isPlural ? number.toString() : '1',
                        context: context
                    };
                    appendTo[appendKey] = kv;
                } else if (Object.prototype.toString.apply(value) === '[object Array]') {
                    kv = {
                        //id: key.replace(new RegExp(' ', 'g'), ''),
                        key: key,
                        value: value.join('\n'),
                        isArray: true,
                        isPlural: isPlural,
                        pluralNumber: isPlural ? number.toString() : '1',
                        context: context
                    };
                    appendTo[appendKey] = kv;
                } else {
                    recurse(appendTo, value, key);
                }
            }

        }

        recurse(flat, input, '');

        // append plurals
        for (var m in flat) {
            var kv = flat[m];

            if (kv.isPlural) {
                var parts;
                if (kv.key.indexOf('_plural') > -1) {
                  parts = kv.key.split('_plural');
                } else {
                  parts = splitValue(kv.key, regexIndexOf(kv.key, /_\d+/));
                }

                var single = flat[kv.key + kv.context];

                if (single) {
                    single.plurals = single.plurals || [];
                    single.plurals.push(kv);

                    delete flat[m];
                }
            }
        }

        return flat;
    }
};
