/**
 * Show functions to be exported from the design doc.
 */
var _ = require('underscore')._;


var templates = require('handlebars').templates,
    jsonp = require('jsonp'),
    utils = require('./utils'),
    ui = require('./ui');


exports.not_found = function (doc, req) {
    return utils.base_template({
        code: 404,
        title: 'Not found',
        content: templates['404.html']({})
    });
};

exports.install_script = function (doc, req) {
    return utils.base_template({
        code: 200,
        headers: {'Content-Type': 'text/plain'},
        body: templates['install.sh']({
            app: req.query.name,
            app_url: utils.app_url(req, req.query.name),
            open_path: utils.open_path(doc)
        })
    });
};

exports.upload_app = function (doc, req) {

    return utils.base_template({
        code: 200,
        baseURL : './',
        title: 'Upload your app',
        onload : 'ui.upload_page()',
        content: templates['upload_app.html']({
            upload_url: utils.upload_url(req),
            baseURL : './'
        })
    });
};

exports.search = function(doc, req) {
    return utils.base_template({
        code: 200,
        baseURL : './',
        title: 'Search Results',
        onload : 'ui.perform_search("'+ req.query.q +'")',
        content: templates['search.html']({
            baseURL : './',
            terms : req.query.q
        })
    });
}



exports.kanso_details = function(doc, req) {

    // check for _rewrite, we assume we are on a vhost. Make the terrible assumption
    // that the vhost is the db name

    var db_path = req.info.db_name + '/_db';
    if(_.indexOf(req.requested_path, '_rewrite') >= 0) {
        // we are on the rewrite
        db_path = req.info.db_name + '/_design/market/_rewrite/_db';
    }

    var meta = doc.couchapp || doc.kanso;

    return jsonp.response(req.query.callback, {
            kanso: meta,
            open_path: utils.open_path(doc),
            style : 'design-doc',  /* option for db to replicate whole db */
            db_src : utils.app_db(req, db_path),
            doc_id : doc._id,
            icon_url : utils.app_db(req, db_path) + '/' + doc._id + '/' +  meta.config.icons['96'],
            user_url : utils.user_url(req, meta.pushed_by),
            user : meta.pushed_by,
            db_path : db_path,
            requested_path :req.requested_path
    });
}
