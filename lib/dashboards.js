var url = require('url'),
    path = require('path'),
    cookies = require('cookies'),
    _ = require('underscore')._;


var  dutils = {
    getBaseURL : function(req) {
        return '.';
    }
}

exports.default_url = 'http://localhost:5984/dashboard/_design/dashboard/_rewrite/';
exports._dashboard_urls = [];


exports.getURLs = function () {
    return _.uniq(exports._dashboard_urls);
};

exports.detectLocal = function () {
    if (_.indexOf(exports._dashboard_urls, exports.default_url) === -1) {
        $.ajax({
            url: exports.default_url + '_info?callback=?',
            dataType: 'json',
            jsonp: true,
            success: function (data) {
                if (data.dashboard) {
                    exports.add(exports.default_url);
                }
            }
        });
    }
};

exports.readCookie = function () {
    var value = cookies.readBrowserCookie('_dashboard_urls');
    if (value) {
        var durls = JSON.parse(unescape(value));
        exports._dashboard_urls = _.uniq(exports._dashboard_urls.concat(durls));
    }
};

exports.updateCookie = function () {
    cookies.setBrowserCookie(null, {
        name: '_dashboard_urls',
        value: JSON.stringify(exports._dashboard_urls),
        path: dutils.getBaseURL()
    });
};

exports.add = function (url) {
    exports._dashboard_urls.unshift(url);
    exports._dashboard_urls = _.uniq(exports._dashboard_urls);
    exports.updateCookie();
};

exports.init = function () {
    exports.readCookie();
    exports.detectLocal();
    // detect 'dashboard' param in URL
    var parts = url.parse(window.location.toString(), true);
    if (parts.query && parts.query.dashboard) {
        exports.add(parts.query.dashboard);
    }
};

exports.installURL = function (dashboard_url, app_url) {
    var parts = url.parse(dashboard_url, true);
    parts.pathname = path.join(parts.pathname, 'install');
    parts.query.app_url = app_url;
    return url.format(parts);
};

exports.friendlyName = function(dashboard_url) {
    var details = url.parse(dashboard_url);
    if (details.hostname === '0.0.0.0' || details.hostname === '127.0.0.1' || details.hostname === 'localhost') {
        return 'Your Computer';
    }
    return details.hostname;
}


exports.moveToTop = function (url) {
    exports._dashboard_urls = _.without(exports._dashboard_urls, url)
    exports.add(url);
};

exports.checkDashboardForKnownProviders = function(dashboard_url, known_providers) {
    if (!known_providers) return null;
    var d_host = url.parse(dashboard_url).host;
    var provider = null;
    _.each(known_providers, function(p){
        if (!p.rootURL) return;
        var parts = url.parse(p.rootURL);
        if (d_host.indexOf(parts.host) > 0) provider = p;
    });
    return provider;
}