var templates = require('handlebars').templates,
    utils = require('./utils'),
    shows = require('./shows'),
    ui = require('./ui'),
    jsonp = require('jsonp'),
    datelib = require('datelib'),
    flattr = require('flattr'),
    _ = require('underscore')._,
    url = require('url');


exports.home = function (head, req) {




    start({code: 200, headers: {'Content-Type': 'text/html'}});



        var row, rows = [];
        while (row = getRow()) {
            var promo_images = row.value.config.promo_images || {};
            row.promo_image = promo_images.small;
            row.short_description = utils.truncateParagraph(
                row.value.config.description,
                120
            );
            row.title = utils.app_title(row.value.config);
            rows.push(row);
        }

        utils.show( {
            title: 'App Garden',
            app_settings : this.app_settings,
            baseURL : '',
            db_name : req.info.db_name,
            content: templates['home.html']({
                app_settings : this.app_settings,
                rows: rows,
                baseURL : ''
            })
        });
};

exports.category_page = function (head, req) {
    start({code: 200, headers: {'Content-Type': 'text/html'}});

    var row, rows = [];
    while (row = getRow()) {
        var promo_images = row.value.config.promo_images || {};
        row.promo_image = promo_images.small;
        row.short_description = utils.truncateParagraph(
            row.value.config.description,
            120
        );
        row.title = utils.app_title(row.value.config);
        rows.push(row);
    }

    utils.show({
        title: req.query.category,
        baseURL : '../',
        app_settings : this.app_settings,
        content: templates['category_page.html']({
            rows: rows,
            app_settings : this.app_settings,
            title: utils.toSentenceCase(req.query.category),
            category: req.query.category,
            baseURL : '../'
        })
    });

};


exports.app_details = function (head, req) {
    start({code: 200, headers: {'Content-Type': 'text/html'}});

    var row, rows = [];
    while (row = getRow()) {
        rows.push(row);
    }

    var id = rows[0].id;
    var meta = rows[0].value;




    if (!rows.length) {
        return shows.not_found(null, req);
    }
    var ldesc = meta.config.long_description;
    var title = utils.app_title(meta.config);
    var flattr_link = null;
    if (flattr.hasFlattr(meta)) {
        var flattr_details = flattr.createFlattrDetailsFromKanso(meta, utils.flattr_url(req, id));
        flattr_link = flattr.generateFlatterLinkHtml(flattr_details);
    }

    var cfg = meta.config;
    var screenshots = cfg.screenshots.map(function (s) {
        return {src: '../_db/' + id + '/' + s};
    });
    screenshots[0].active = true;

    var onload = '';
    if (meta.config.url) {
        var details = url.parse(meta.config.url);
        if (details.hostname === 'github.com') {
            var git_commit = '';
            if (meta.git && meta.git.commit) {
                git_commit = meta.git.commit;
            }

            onload = 'ui.check_github("' +  details.pathname.substr(1) + '", "'+ git_commit +'")';
        }
    }

    utils.show ({
        title: 'App: ' + title,
        baseURL : '../',
        app_settings : this.app_settings,
        onload : onload,
        content: templates['app_details.html']({
            baseURL : '../',
            app_settings : this.app_settings,
            meta: meta,
            id: id,
            title: title,
            long_description_paragraphs: ldesc.split('\n\n'),
            screenshots : screenshots,
            screenshots_many : (screenshots.length > 1),
            icon_96: meta.config.icons['96'],
            updated: datelib.prettify(meta.push_time),
            install_script_url: utils.install_script_url(req, id),
            flattr_link : flattr_link
        })
    });

};

exports.app_details_install = function (head, req) {
    start({code: 200, headers: {'Content-Type': 'text/html'}});

    var row, rows = [];
    while (row = getRow()) {
        rows.push(row);
    }

    var id = rows[0].id;
    var meta = rows[0].value;


    if (!rows.length) {
        return shows.not_found(null, req);
    }

    var title = utils.app_title(meta.config);


    utils.show ({
        title: 'App: ' + title,
        baseURL : '../../',
        app_settings : this.app_settings,
        onload : 'ui.showInstallChoices();',
        content: templates['app_details_install.html']({
            baseURL : '../../',
            app_settings : this.app_settings,
            meta: meta,
            id: id,
            title: title,
            icon_96: meta.config.icons['96'],
            updated: datelib.prettify(meta.push_time),
            install_script_url: utils.install_script_url(req, id)
        })
    });


};
exports.app_details_install_couch = function (head, req) {
    start({code: 200, headers: {'Content-Type': 'text/html'}});

    var row, rows = [];
    while (row = getRow()) {
        rows.push(row);
    }

    var id = rows[0].id;
    var meta = rows[0].value;


    if (!rows.length) {
        return shows.not_found(null, req);
    }

    var title = utils.app_title(meta.config);


    utils.show({
        title: 'App: ' + title,
        app_settings : this.app_settings,
        baseURL : '../../',
        onload: 'ui.couch_install_page()',
        content: templates['app_details_manual_install.html']({
            meta: meta,
            app_settings : this.app_settings,
            id: id,
            title: title,
            baseURL : '../../',
            icon_96: meta.config.icons['96'],
            updated: datelib.prettify(meta.push_time),
            install_script_url: utils.install_script_url(req, id)
        })
    });

};
exports.user_page = function (head, req) {
    start({code: 200, headers: {'Content-Type': 'text/html'}});

    var row, rows = [];
    while (row = getRow()) {
        var promo_images = row.value.config.promo_images || {};
        row.promo_image = promo_images.small;
        row.short_description = utils.truncateParagraph(
            row.value.config.description,
            120
        );
        row.title = utils.app_title(row.value.config);
        rows.push(row);
    }
    utils.show({
        title: req.query.user,
        app_settings : this.app_settings,
        baseURL : '../',
        content: templates['user_page.html']({
            rows: rows,
            app_settings : this.app_settings,
            title: utils.toSentenceCase(req.query.user),
            user: req.query.user,
            baseURL : '../'
        })
    });

};

exports.app_versions = function(head, req) {
    var row = [];
    var result = {};
    while (row = getRow()) {
        var version;
        if (row.value.config && row.value.config.version) {
            result[row.id] = row.value.config.version;
        }
        else if (row.value.version) {
            result[row.id] = row.value.version;
        }
    }
    var result =  jsonp.response(req.query.callback, result);
    start({code: result.code, headers: result.headers});
    send(result.body);
}


exports.intersection = function (head, req) {

    var extraKeys = [];
    if (req.query.key) {
        extraKeys.push(req.query.key);
    }
    if (req.query.extra_keys) {
        var split = req.query.extra_keys.split(' ');
        extraKeys = extraKeys.concat(split);
    }

    extraKeys = _.uniq(_.map(extraKeys, function(key) {return key.toLowerCase()}));

    var realJson = true;
    if (req.query.streamJson) {
        realJson = false;
    }

    start({'headers' : {'Content-Type' : 'application/json'}});
    if (realJson) send('[\n');
    var count = 0;
    var row;
    while ((row = getRow())) {

        var doc_intersection = _.intersection(row.value.keywords, extraKeys);
        if (doc_intersection.length == extraKeys.length) {
            var pre = '';
            if (count++ > 0 && realJson) pre = ',';
            send(pre + JSON.stringify(row.value) + '\n');
        }
    }
    if (realJson) send(']');
}