var templates = require('duality/templates'),
    dutils = require('duality/utils'),
    utils = require('./utils'),
    popup = require('./popup'),
    dashboards = require('./dashboards'),
    db = require('db'),
    url = require('url'),
    path = require('path'),
    _ = require('underscore')._;


exports.preloadImage = function (src, callback) {
    var img = $('<img>').attr({ src: src });
    img.load(function () { callback(null, this); });
    img.error(callback);
    return img;
};

exports.loadScreenshots = function (id, meta, req) {
    var cfg = meta.config;
    var screenshots = cfg.screenshots.map(function (s) {
        return {src: dutils.getBaseURL(req) + '/_db/' + id + '/' + s};
    });

    // fade in loading after delay set on css transition
    $('#screenshot_container .loading').css({opacity: 1});

    // preload first image
    exports.preloadImage(screenshots[0].src, function (err, img) {
        if (err) {
            return console.error(err);
        }
        $('#screenshot_container').html(
            templates.render('screenshots.html', req, {
                screenshots: screenshots
            })
        );
        screenshots = _.map(screenshots, function (s, i) {
            function updateTop(img) {
                var h = img.height;
                if (h === 0) {
                    // probably not loaded yet
                    $(img).parents('li').css({marginTop: 0});
                }
                else {
                    s.top = Math.max(400 - h, 0) / 2;
                    $(img).parents('li').css({marginTop: s.top});
                }
            }
            var img = $('#screenshots li img').get(i);
            $(img).load(function () {
                updateTop(this);
            });
            updateTop(img);
            s.left = $('#screenshots ul').position().left - (i * 680);
            return s;
        });

        var curr = 0;

        // show or hide next and prev buttons depending on position
        function toggleBtns() {
            if (screenshots.length <= 1) {
                $('#screenshots .prev').hide();
                $('#screenshots .next').hide();
            }
            if (curr === 0) {
                $('#screenshots .prev').hide();
                $('#screenshots .next').show();
            }
            else if (curr === screenshots.length - 1) {
                $('#screenshots .prev').show();
                $('#screenshots .next').hide();
            }
            else {
                $('#screenshots .prev').show();
                $('#screenshots .next').show();
            }
        }

        // update active screenshot nav position
        function updateNav() {
            $('#screenshot_nav li').removeClass('active');
            var li = $('#screenshot_nav li')[curr];
            $(li).addClass('active');
        }

        function update(val) {
            if (val !== undefined) {
                curr = val;
            }
            $('#screenshots ul').css({
                left: screenshots[curr].left + 'px'
            });
            toggleBtns();
            updateNav();
        }
        update();

        $('#screenshot_nav li').each(function (i) {
            $(this).click(function () {
                update(i);
            });
        });

        $('#screenshot_container .next').click(function () {
            if (curr < screenshots.length - 1) {
                update(curr + 1);
            }
        });
        $('#screenshot_container .prev').click(function () {
            if (curr > 0) {
                update(curr - 1);
            }
        });
    });
};


exports.addCategories = function (req, el) {
    var current_category = req.query.category;
    var duality = require('duality/core');
    var appdb = db.use(duality.getDBURL());
    var q = {
        reduce: true,
        group_level: 1
    };
    if (exports.category_cache && exports.category_cache_total) {
        var categories = exports.category_cache;
        var total_apps = exports.category_cache_total;
        $(el).replaceWith(
            templates.render('category_list.html', req, {
                categories: categories,
                total_apps: total_apps,
                current_category: current_category
            })
        );
    }
    appdb.getView('garden', 'apps_by_category', q, function (err, data) {
        var total_apps = 0, categories = [];
        _.each(data.rows, function (r) {
            if (r.key === 'total') {
                total_apps = r.value;
            }
            else {
                categories.push({
                    key: r.key[0],
                    name: utils.toSentenceCase(r.key[0]),
                    count: r.value
                });
            }
        });
        if (JSON.stringify(categories) !== JSON.stringify(exports.category_cache) ||
            exports.category_cache_total !== total_apps) {

            exports.category_cache = categories;
            exports.category_cache_total = total_apps;
            $(el).replaceWith(
                templates.render('category_list.html', req, {
                    categories: categories,
                    total_apps: total_apps,
                    current_category: current_category
                })
            );
        }
    });
};

/**
 * Add syntax highlighting to the page using highlight.js (hljs)
 */

exports.syntaxHighlight = function () {
    $('pre > code').each(function () {
        if (this.className) {
            // has a code class
            $(this).html(hljs.highlight(this.className, $(this).text()).value);
        }
    });
};


exports.showInstallPopup = function (req, id) {
    var loc = window.location.toString();
    var dashboard_urls = _.map(dashboards.getURLs(), function (url, i) {
        return {id: i, url: url};
    });

    var content = templates.render('install_popup_content.html', req, {
        create_dashboard_url: 'http://garden20.com/?app_url=' + escape(loc)
    });
    popup.closeAll();
    var el = popup.open(req, {
        content: content,
        width: 900,
        height: 300
    });
    if (dashboard_urls.length > 0) {
            exports.createDefaultInstructions(el, req, id);
    } else {
        exports.showOtherOptionsPopup(req, id);
    }
};

exports.showOtherOptionsPopup = function (req, id) {
    var loc = window.location.toString();
    var dashboard_urls = _.map(dashboards.getURLs(), function (url, i) {
        return {id: i, url: url};
    });

    var content = templates.render('install_popup_content.html', req, {
        create_dashboard_url: 'http://garden20.com/?app_url=' + escape(loc)
    });
    popup.closeAll();
    var el = popup.open(req, {
        content: content,
        width: 900,
        height: 300
    });
    if (dashboard_urls.length > 0) {
        $('.note-actions', el).prepend(
            '<a href="#" class="btn backbtn">&lt; Back</a>'
        );
    }

    $('#manual_install img').click(function (ev) {
        $('.note-actions .backbtn').remove();
        exports.createManualInstructions(el, req, id);
    });
    $('#install_to_dashboard img').click(function (ev) {
        $('.note-actions .backbtn').remove();
        exports.createDashboardInstructions(el, req, id);
    });
    $('#create_dashboard').click(function (ev) {
    });
    $('.note-actions .backbtn', el).click(function (ev) {
        ev.preventDefault();
        $('.note-actions .backbtn').remove();
        exports.createDefaultInstructions(el, req, id);
        return false;
    });


}



exports.createManualInstructions = function (el, req, id) {
    $('.note-inner', el).html(
        templates.render('install_popup_manual.html', req, {
            install_script_url: utils.install_script_url(req, id)
        })
    );
    $('.note-actions', el).prepend(
        '<a href="#" class="btn backbtn">&lt; Back</a>' +
        '<a href="#" class="btn primary">Done</a>'
    );
    $('.note-actions .primary', el).click(function (ev) {
        ev.preventDefault();
        popup.close(el);
        return false;
    });
    $('.note-actions .backbtn', el).click(function (ev) {
        ev.preventDefault();
        exports.showOtherOptionsPopup(el, req, id);
        return false;
    });
};

exports.createDefaultInstructions = function (el, req, id) {
    var dashboard_urls = _.map(dashboards.getURLs(), function (url, i) {
        return {id: i, url: url};
    });

    $('.note-inner', el).html(
        templates.render('install_popup_default.html', req, {
            dashboard_urls: dashboard_urls
        })
    );
    $('.note-actions', el).prepend(
        '<a href="#" class="btn backbtn">Other Options</a>' +
        '<a href="#" class="btn primary">Install</a>'
    );
    $('.note-actions .primary', el).click(function (ev) {
        ev.preventDefault();
        var durl = dashboard_urls[0].url;
        window.open(dashboards.installURL(durl, window.location.toString()));
        popup.close(el);
        return false;
    });
    $('.note-actions .backbtn', el).click(function (ev) {
        ev.preventDefault();
        exports.showOtherOptionsPopup(req, id);
        return false;
    });
};


exports.createDashboardInstructions = function (el, req, id) {
    $('.note-inner', el).html(
        templates.render('install_popup_dashboard.html', req, {
            dashboard_urls: _.map(dashboards.getURLs(), function (url, i) {
                return {id: i, url: url};
            })
        })
    );
    $('.note-actions', el).prepend(
        '<a href="#" class="btn backbtn">&lt; Back</a>' +
        '<a href="#" class="btn primary">Install</a>'
    );
    $('.note-actions .primary', el).click(function (ev) {
        ev.preventDefault();
        var durl;
        if ($('#dashboard_custom').get(0).checked) {
            durl = $('#dashboard_custom_text').val();
            dashboards.add(durl);
        }
        else {
            durl = $('input[name="dashboard_url"]:checked').val();
            dashboards.moveToTop(durl);
        }
        window.open(dashboards.installURL(durl, window.location.toString()));
        popup.close(el);
        return false;
    });
    $('.note-actions .backbtn', el).click(function (ev) {
        ev.preventDefault();
        exports.showOtherOptionsPopup(req, id);
        return false;
    });
};

exports.showInstallChoices = function(req) {

    var loc = window.location.toString();
    var app_url = loc.substring(0, loc.length -  8); // remove the trailing /install
    var g20 = 'http://garden20.com/?app_url=' + escape(app_url);

    var duality = require('duality/core');
    var baseURL = duality.getBaseURL(req);
    var appdb = db.use(duality.getDBURL());


    var dashboard_urls = [
        {
            id: 0,
            url : g20,
            name: 'Garden20',
            rootURL : 'http://garden20.com',
            img : baseURL + '/static/img/garden20.png',
            type: 'Hosted'
        }
    ];

    appdb.getView('garden', 'hosting', { include_docs: true }, function (err, data) {
        dashboard_urls = dashboard_urls.concat(_.map(data.rows, function (row, i) {
                return {
                    id: i,
                    url: row.doc.url + '?app_url=' + escape(app_url),
                    name: row.doc.name,
                    img : baseURL + '/static/img/garden20.png',
                    type: 'Hosted'
                };
        }));
        dashboard_urls = dashboard_urls.concat(_.map(dashboards.getURLs(), function (url, i) {
            var provider = dashboards.checkDashboardForKnownProviders(url, dashboard_urls);
            var dash =  {
                id: i,
                url:  dashboards.installURL(url, app_url),
                name: url,
                type: 'Dashboard'
            };
            if (provider) {
                dash.type = 'Hosted';
                dash.img  = provider.img;
                if (i == 0) dash.primary = true;
            } else {
                // if this is not a localhost, and it is the first.
                if ((url.indexOf('localhost') < 0)) {
                    if (i == 0) dash.primary = true;
                }
            }

            return dash;
        }));


        dashboard_urls.push({
            id: 'other',
            url: 'other',
            name: 'Enter URL...',
            img : baseURL + '/static/img/install_to_dashboard.png',
            type: 'Dashboard',
            other: true,
            advanced : true
        });


        dashboard_urls.push({
            id: 'couch',
            url: 'couch_install',
            name: 'CouchDB manual install',
            img : baseURL + '/static/img/couch.png',
            type: 'Couch',
            advanced : true
        });

        $('.install_where tbody').html(
            templates.render('own_garden_option.html', req, {
                dashboard_urls: dashboard_urls
            })
        );

        $('.install_where table tr').click(function(){
            $('input[type="radio"]', this).attr('checked','checked');

        });

        $('.advanced-toggle').click(function(){
            var $me = $(this);
            if ($me.hasClass('showing')){
                $me.removeClass('showing').text('Show Advanced Locations');
                $('.advanced-row').hide();
            } else {
                $me.addClass('showing').text('Hide Advanced Locations');
                $('.advanced-row').show();
            }
            return false;
        });


        $('button.next').click(function(){

           var radio = $('input[type="radio"]:checked');
           var tr = radio.closest('tr');
           var url = radio.val();
           if (url == 'other') {
               var durl = $('#other-url').css('box-shadow', 'none').css('border', '0').val();
               dashboards.add(durl);
               url = dashboards.installURL(durl, app_url);
           }


           $(this).hide();


           $('.install_where table th').hide(300, function(){
                $('.install_where table tr').each(function(){
                    if ( $(this).is(tr) ) return;
                    $(this).hide(200, function(){
                        $('.install_where table td.radio').hide(100, function(){
                            $('.install_where table').css('border','0');
                            $('.please-wait').show();
                            setTimeout(function(){
                                window.location = url;
                            }, 1000);

                        })

                    });
                });
           });




        });

    });






}