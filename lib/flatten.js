      
module.exports = {

    flatten: function(input, options) {
        var flat = {}
          , separator = options.keyseparator || '##';


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
                var ctxKey = key;
                if (key.indexOf('_plural') > -1) {
                    ctxKey = ctxKey.substring(0, key.indexOf('_plural'));
                    if (ctxKey.indexOf('_') > -1) context = ctxKey.substring(ctxKey.lastIndexOf('_') + 1, ctxKey.length);
                }
                else if (key.indexOf('_') > -1) {
                    context = ctxKey.substring(ctxKey.lastIndexOf('_') + 1, ctxKey.length);
                }
                else {
                    context = "";
                }

                if (context === key) context = '';

                if (context !== '') key = key.replace('_' + context, '');

                // append or recurse
                if (typeof value === 'string') {
                    kv = { 
                        //id: key.replace(new RegExp(' ', 'g'), ''),
                        key: key,
                        value: value,
                        isPlural: key.indexOf('_plural') > -1,
                        context: context
                    };
                    appendTo[kv.key + kv.context] = kv;
                } else if (Object.prototype.toString.apply(value) === '[object Array]') {
                    kv = { 
                        //id: key.replace(new RegExp(' ', 'g'), ''),
                        key: key,
                        value: value.join('\n'),
                        isArray: true,
                        isPlural: key.indexOf('_plural') > -1,
                        context: context
                    };
                    appendTo[kv.key + kv.context] = kv;
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
                var parts = kv.key.split('_plural');

                var single = flat[parts[0] + kv.context];
                kv.pluralNumber = parts[1].replace('_', '');
                if (kv.pluralNumber === '') kv.pluralNumber = '1';

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