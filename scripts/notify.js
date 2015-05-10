require('dotenv').load()

var keystone = require('../keystone-setup')(), 
    debug = require('debug')('notify'),
    User = keystone.list('User'),
    async = require('async'),
    _ = require('underscore'),
    connectES = require('../lib/connect_es'),
    errorHandling = require('../lib/errorHandling'),
    sources = {
      facebook: require('../lib/sources/facebook'),
      twitter: require('../lib/sources/twitter')
    };

require('../lib/keystone-script')(connectES, function(done) {
  User.model.findAccountRoots(function(err, users) {
    if (err) {
      return errorHandling.sendSNS("error", err, done(err));
    }

    async.eachSeries(users, function(user, next) {
      console.info("Notifying for user %s", user.id)

      user.getAlertDocuments(function(err, res) {
        if (err) return next(err);
        if (res.hits.total == 0) return next();

        debug("User: %s Hits: %s", user.id, res.hits.total);

        var bulkUpdates = [],
            links = [];

        res.hits.hits.forEach(function(hit) {
          var docType = sources[hit._source.doc_source][hit._source.doc_type],
              obj = new docType(hit._id, hit._source)

          links.push( obj.emailLinkObject({ user: user }) )

          bulkUpdates.push(
            { update: _.pick(hit, "_index", "_type", "_id") },
            { doc: { 
                isNotified: true,
                alertState: "new"
              } 
            }
          )
        });

        user.sendNotificationEmail(links, function(err, info) {
          if (err) return next(err);

          keystone.elasticsearch.bulk({
            body: bulkUpdates
          }, function (err, resp) {
            if (err) {
              console.error("Error updating ES documents to notified state for user %s", user.id)
              return next(err)
            }
            next();
          });

        });
      });
    }, function(err) {
        if (err) return errorHandling.sendSNS("error", err, done);
        else done();
    });
  });
});