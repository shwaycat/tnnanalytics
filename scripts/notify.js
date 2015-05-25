require('dotenv').load();

var keystone = require('../keystone-setup')(),
    debug = require('debug')('notify'),
    User = keystone.list('User'),
    async = require('async'),
    _ = require('underscore'),
    connectES = require('../lib/connect_es'),
    errorHandling = require('../lib/errorHandling'),
    sources = {
      facebook: require('../lib/sources/facebook'),
      twitter: require('../lib/sources/twitter'),
      instagram: require('../lib/sources/instagram'),
      youtube: require('../lib/sources/youtube')
    };

require('../lib/keystone-script')(connectES, function(done) {
  User.model.findAccountRoots(function(err, users) {
    if (err) {
      return errorHandling.sendSNS("error", err, done(err));
    }

    async.eachSeries(users, function(user, next) {
      console.info("Notifying for user %s", user.id);

      var bulkUpdates = [],
          links = [];

      user.getAlertDocuments(function(hits, nextBatch) {
        if (!hits.length) return nextBatch();

        _.each(hits, function(hit) {
          var docType = sources[hit._source.doc_source][hit._source.doc_type],
              obj = new docType(hit._id, hit._source);

          links.push( obj.emailLinkObject({ user: user }) );

          bulkUpdates.push(
            { update: _.pick(hit, "_index", "_type", "_id") },
            { doc: {
                isNotified: true,
                alertState: "new"
              }
            }
          );
        });
        nextBatch();
      }, function(err) {
        if (err) return next(err);
        if (!links.length) return next();

        debug("User %s - %s notifications", user.id, links.length);

        user.sendNotificationEmail(links, function(err) {
          if (err) return next(err);

          keystone.elasticsearch.bulk({
            body: bulkUpdates
          }, function (err) {
            if (err) {
              console.error("Error updating ES documents to notified state for user %s", user.id);
              return next(err);
            }
            next();
          });
        });
      });
    }, function(err) {
      if (err) return errorHandling.sendSNS("error", err, done);
      done();
    });
  });
});
