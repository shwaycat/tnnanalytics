require('dotenv').load()

var keystone = require('../keystone-setup')(),
    debug = require('debug')('pull'),
    User = keystone.list('User'),
    async = require('async'),
    _ = require('underscore'),
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

      User.model.findConnected(sourceKey, function(err, users) {
        if (err) {
          return nextDocType(err);
        }

        var docType = sourceType[docTypeKey];

        async.eachSeries(users, function(user, nextUser) {
          docType.pullAll(user, nextUser)
        }, nextDocType)
      });
    }, nextSourceType);
  }, done);
});
