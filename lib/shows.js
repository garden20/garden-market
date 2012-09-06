/**
 * Show functions to be exported from the design doc.
 */
var _ = require('underscore')._;


var templates = require('handlebars').templates,
    jsonp = require('jsonp'),
    utils = require('./utils'),
    ui = require('./ui');


exports.not_found = function (doc, req) {
    return {
        code: 404,
        title: 'Not found',
        content: templates['404.html']({})
    };
};

exports.install_script = function (doc, req) {
    return {
        code: 200,
        headers: {'Content-Type': 'text/plain'},
        body: templates.render('install.sh', req, {
            app: req.query.name,
            app_url: utils.app_url(req, req.query.name),
            open_path: utils.open_path(doc)
        })
    };
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


exports.kanso_details = function(doc, req) {

    // check for _rewrite, we assume we are on a vhost. Make the terrible assumption
    // that the vhost is the db name

    var db_path = req.info.db_name + '/_db';
    if(_.indexOf(req.requested_path, '_rewrite') >= 0) {
        // we are on the rewrite
        db_path = req.info.db_name + '/_design/market/_rewrite/_db';
    }

    return jsonp.response(req.query.callback, {
            kanso: doc.kanso,
            open_path: utils.open_path(doc),
            style : 'design-doc',  /* option for db to replicate whole db */
            db_src : utils.app_db(req, db_path),
            doc_id : doc._id,
            icon_url : utils.app_db(req, db_path) + '/' + doc._id + '/' +  doc.kanso.config.icons['96'],
            user_url : utils.user_url(req, doc.kanso.pushed_by),
            user : doc.kanso.pushed_by,
            db_path : db_path,
            requested_path :req.requested_path
    });
}
