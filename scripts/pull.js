require('dotenv').load();

var keystone = require('../keystone-setup')(),
    debug = require('debug')('cadence:pull'),
    User = keystone.list('User'),
    async = require('async'),
    _ = require('underscore'),
    errorHandling = require('../lib/errorHandling'),
    connectES = require('../lib/connect_es'),
    sources = {
      // facebook: require('../lib/sources/facebook'),
      twitter: require('../lib/sources/twitter')
    };

require('../lib/keystone-script')(connectES, function(done) {
  async.eachSeries(_.keys(sources), function(sourceKey, nextSourceType) {
    var sourceType = sources[sourceKey];

    async.eachSeries(_.keys(sourceType), function(docTypeKey, nextDocType) {
      console.info("Pulling from %s:%s", sourceKey, docTypeKey);

      User.model.findAccountRoots(function(err, users) {
        if (err) return nextDocType(err);

        var docType = sourceType[docTypeKey];

        async.eachSeries(users, function(user, nextUser) {
          console.info("Pulling for user %s", user.id);
          debug("User: %j", user);
          docType.pullAll(user, nextUser);
        }, nextDocType);
      });
    }, function(err) {
      if (err) {
        errorHandling.logError(err);
        errorHandling.sendSNS('error', err, nextSourceType);
      } else {
        nextSourceType();
      }
    });
  }, function(err) {
    if (err) {
      errorHandling.logError(err);
      errorHandling.sendSNS('error', err, done);
    } else {
      done();
    }
  });
});

//[ { message: 'Rate limit exceeded', code: 88 } ]
