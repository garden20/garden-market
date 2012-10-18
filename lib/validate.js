module.exports = function (newDoc, oldDoc, userCtx) {

    // deleting
    if (oldDoc && newDoc._deleted) {
        for (var i = 0; i < userCtx.roles.length; i++) {
            if (userCtx.roles[i] === '_admin') {
                // admins can delete any app
                return;
            }
        }
        var old_meta = oldDoc.couchapp || oldDoc.kanso;
        if (userCtx.name !== old_meta.pushed_by) {
            throw {
                unauthorized: 'Only the uploader can delete an existing app'
            };
        }
        // don't need to further validate a deleted document!
        return;
    }
    var manifest = newDoc.couchapp || newDoc.kanso;
    // updating
    if (oldDoc && !newDoc._deleted) {
        if (manifest.pushed_by !== manifest.pushed_by) {
            throw {
                unauthorized: 'Only the uploader can update an existing app'
            };
        }
    }

    // TODO: check for other doc types here like comments etc
    if (!newDoc.type && !manifest) {
        throw {
            forbidden: 'Document is missing "kanso" or "couchapp" property\n' +
                       'Adding apps requires at least kanso 0.1.4 or erica 2.0'
        };
    }

    if (manifest) {
        if (!userCtx.name) {
            throw {unauthorized: 'You must be logged in to upload an app'};
        }
        if (!manifest.pushed_by) {
            throw {forbidden: 'Manifest missing pushed_by property'};
        }
        if (!manifest.push_time) {
            throw {forbidden: 'Manifest missing push_time property'};
        }
        if (!manifest.build_time) {
            throw {forbidden: 'Manifest missing build_time property'};
        }
        if (!manifest.config) {
            throw {forbidden: 'Manifest missing config property'};
        }
        if (!manifest.config.name) {
            throw {forbidden: 'Manifest missing config.name property'};
        }
        if (!manifest.config.description) {
            throw {forbidden: 'Manifest missing config.description property'};
        }
        if (!manifest.config.long_description) {
            throw {forbidden: 'Manifest missing config.long_description property'};
        }
        if (!manifest.config.version) {
            throw {forbidden: 'Manifest missing config.version property'};
        }
        if (!manifest.config.screenshots) {
            throw {forbidden: 'Manifest missing config.screenshots property'};
        }
        if (!manifest.config.screenshots.length) {
            throw {forbidden: 'You must provide at least one screenshot'};
        }
        if (!manifest.config.promo_images) {
            throw {forbidden: 'Missing config.promo_images property'};
        }
        if (!manifest.config.icons) {
            throw {forbidden: 'Missing config.icons property'};
        }
        if (!manifest.config.icons['16']) {
            throw {forbidden: 'Missing 16x16 icon'};
        }
        if (!manifest.config.icons['48']) {
            throw {forbidden: 'Missing 48x48 icon'};
        }
        if (!manifest.config.icons['96']) {
            throw {forbidden: 'Missing 96x96 icon'};
        }
        if (!manifest.config.icons['128']) {
            throw {forbidden: 'Missing 128x128 icon'};
        }
        if (!manifest.config.promo_images.small) {
            throw {forbidden: 'You must provide at least a small promo image'};
        }
        if (!manifest.config.categories) {
            throw {forbidden: 'Missing property config.categories'};
        }
        if (!manifest.config.categories.length) {
            throw {forbidden: 'You must provide at least one category'};
        }

    }

};
