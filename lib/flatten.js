      
module.exports = {

    flatten: function(input, options) {
        var flat = []
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
                    ctxKey = ctxKey.replace(new RegExp('_plural_*', 'g'), '');
                    ctxKey = ctxKey.replace(new RegExp('_plural', 'g'), '');
                }
                if (ctxKey.indexOf('context_') > -1) {
                    context = 'context' + ctxKey.substring(ctxKey.lastIndexOf('_'), ctxKey.length);
                } else {
                    context = ctxKey.substring(ctxKey.lastIndexOf('_'), ctxKey.length);
                }
                if (context === key) context = '';

                // append or recurse
                if (typeof value === 'string') {
                    kv = { 
                        //id: key.replace(new RegExp(' ', 'g'), ''),
                        key: key,
                        value: value,
                        isPlural: key.indexOf('_plural') > -1,
                        context: context
                    };
                    appendTo.push(kv);
                } else if (Object.prototype.toString.apply(value) === '[object Array]') {
                    kv = { 
                        //id: key.replace(new RegExp(' ', 'g'), ''),
                        key: key,
                        value: value.join('\n'),
                        isArray: true,
                        isPlural: key.indexOf('_plural') > -1,
                        context: context
                    };
                    appendTo.push(kv);
                } else {
                    recurse(appendTo, value, key);
                }
            }

        }

        recurse(flat, input, '');

        return flat;

        // // flatten
        // for (lng in store) {
        //     node = store[lng];
        //     flat[lng] = {};

        //     for (ns in node) {
        //         flat[lng][ns] = new Collections.Resources();

        //         recurse(lng, ns, flat[lng][ns], node[ns], '');
        //     }
        // }


        // // add keys from unspecific, fallback
        // function merge(lng, lngs) {
        //     for (var i = 0, len = lngs.length; i < len; i++) {
        //         if (lngs[i] === lng) continue;

        //         var source = flat[lngs[i]];
        //         var target = flat[lng];

        //         for (var ns in source) {
        //             var sNS = source[ns];
        //             var tNS = target[ns] || new Collections.Resources();

        //             sNS.each(function(res) {
        //                 if (!tNS.get(res.id) && 
        //                     res.get('fallback').lng === res.get('lng')) {
        //                     tNS.push({
        //                         id: res.id,
        //                         key: res.get('key'),
        //                         lng: lng,
        //                         ns: ns,
        //                         isArray: res.get('isArray'),
        //                         fallback: {
        //                             value: res.get('value'),
        //                             lng: lngs[i],
        //                             isArray: res.get('isArray')
        //                         }
        //                     });
        //                 }
        //             });
        //         }
        //     }
        // }

        // for (lng in flat) { 
        //     merge(lng, this._toLanguages(lng));
        // }
    }
};