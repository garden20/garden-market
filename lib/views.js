exports.apps = {
    map: function (doc) {
        if (!/^_design\//.test(doc._id) && doc.kanso) {
            emit([doc._id], doc.kanso);
        }
    }
};

exports.apps_by_category = {
    map: function (doc) {
        if (!/^_design\//.test(doc._id) && doc.kanso) {
            var cfg = doc.kanso.config;
            if (cfg.categories && cfg.categories.length) {
                for (var i = 0; i < cfg.categories.length; i++) {
                    emit([cfg.categories[i]], doc.kanso);
                }
            }
            else {
                emit(['uncategorized'], doc.kanso);
            }
            emit('total', 1);
        }
    },
    reduce: function (keys, values, rereduce) {
        if (rereduce) {
            return sum(values);
        }
        return values.length;
    }
};

exports.apps_by_user = {
    map: function (doc) {
        if (!/^_design\//.test(doc._id) && doc.kanso) {
            emit([doc.kanso.pushed_by], doc.kanso);
        }
    }
};

exports.hosting = {
    map : function(doc) {
        if (doc.type && doc.type === 'hosting') {
            emit(doc.name, null);
        }
    }
}

exports.keyword_search = {
    map : function(doc) {
        if (!doc.kanso || !doc.kanso.config) return;
        var Tokenizer = require('views/lib/tokenizer');
        var _ = require('views/lib/underscore')._;

        var filter_junk = function(tokens) {
            var map = [];
            for (i in tokens) {
                var t = tokens[i];
                t = t.toLowerCase();
                // filter some junk
                if ((t.length !== 1) && (t.indexOf('_') < 0)) {
                    map.push(t);
                }
            }
            return map;
        }


        var tokenizer = new Tokenizer();
        var meta = doc.kanso.config;
        var id_tokens = tokenizer.tokenize(meta.name);
        var id_map = filter_junk(id_tokens);

        var desc_tokens = tokenizer.tokenize(meta.description);
        var desc_map = filter_junk(desc_tokens);


        var long_description_tokens = tokenizer.tokenize(meta.long_description);
        var l_desc_map = filter_junk(long_description_tokens);


        _.each(_.union(id_map, desc_map, l_desc_map), function(token){
            emit(token, null);
        });



    }
}
