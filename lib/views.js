exports.apps = {
    map: function (doc) {
        var meta = doc.couchapp || doc.kanso;
        if (!/^_design\//.test(doc._id) && meta) {
            emit([doc._id], meta);
        }
    }
};

exports.apps_by_category = {
    map: function (doc) {
        var meta = doc.couchapp || doc.kanso;
        if (!/^_design\//.test(doc._id) && meta) {
            var cfg = meta.config;
            if (cfg.categories && cfg.categories.length) {
                for (var i = 0; i < cfg.categories.length; i++) {
                    emit([cfg.categories[i]], meta);
                }
            }
            else {
                emit(['uncategorized'], meta);
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
        var meta = doc.couchapp || doc.kanso;
        if (!/^_design\//.test(doc._id) && meta) {
            emit([meta.pushed_by], meta);
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
        var meta = doc.couchapp || doc.kanso;
        if (!meta || !meta.config) return;
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
        var config = meta.config;
        var id_tokens = tokenizer.tokenize(config.name);
        var id_map = filter_junk(id_tokens);

        var desc_tokens = tokenizer.tokenize(config.description);
        var desc_map = filter_junk(desc_tokens);


        var long_description_tokens = tokenizer.tokenize(config.long_description);
        var l_desc_map = filter_junk(long_description_tokens);

        var keywords = _.union(id_map, desc_map, l_desc_map);

        var icon = config.icons["96"];
        var by = meta.pushed_by;


        var title = config.display_name || config.name;
        title = title.substr(0, 1).toUpperCase() + title.substr(1);

        _.each(keywords, function(token){
            emit(token, {
                _id : doc._id,
                name : config.name,
                display_name : title,
                description: config.description,
                keywords : keywords,
                icon_96 : icon,
                by : by
            });
        });



    }
}
