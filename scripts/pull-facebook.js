require('dotenv').load();

var keystone = require('../keystone-setup')(),
    debug = require('debug')('cadence:pull'),
    User = keystone.list('User'),
    async = require('async'),
    _ = require('underscore'),
    errorHandling = require('../lib/errorHandling'),
    connectES = require('../lib/connect_es'),
    facebookSource = require('../lib/sources/facebook');

require('../lib/keystone-script')(connectES, function(done) {
  async.eachSeries(_.keys(facebookSource), function(docTypeKey, nextDocType) {
    console.info("Pulling from Facebook: %s", docTypeKey);

    User.model.findAccountRoots(function(err, users) {
      if (err) return nextDocType(err);

      var docType = facebookSource[docTypeKey];

      async.eachSeries(users, function(user, nextUser) {
        console.info("Pulling for user %s", user.id);
        debug("User: %j", user);
        docType.pullAll(user, nextUser);
      }, nextDocType);
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
