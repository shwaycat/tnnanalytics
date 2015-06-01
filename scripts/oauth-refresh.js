require('dotenv').load();

var keystone = require('../keystone-setup')(),
    debug = require('debug')('cadence:oauth-refresh'),
    _ = require('underscore'),
    async = require('async'),
    User = keystone.list('User'),
    authServices = require('../lib/auth'),
    errorHandling = require('../lib/errorHandling');

require('../lib/keystone-script')(function(done) {
  var tasks = {};

  _.each(authServices, function(authService, key) {
    if (!authService.refreshAccessToken) return;

    tasks[key] = function(callback) {
      console.info("Refreshing %s tokens", key);

      var count = 0;
      User.model.findAccountRoots(function(err, users) {
        if (err) return callback(err);

        users = _.filter(users, function(u) { return u.services[key].isConfigured; });

        async.eachSeries(users, function(user, nextUser) {
          if (user.services[key].tokenExpiresAt) {
            var expiresAt = user._.services[key].tokenExpiresAt.moment().clone();
            if (expiresAt.subtract(5, 'minutes').isAfter(new Date())) {
              return nextUser();
            }
          }

          authService.refreshAccessToken(user, function(err) {
            if (err) return nextUser(err);
            nextUser();
          });
        }, function(err) {
          callback(err, count);
        });
      });
    };
  });

  async.parallel(tasks, function(err, results) {
    debug("Results: %j", results);
    if (err) {
      errorHandling.logError(err);
      errorHandling.sendSNS('error', err, done);
    }
    done();
  });
});
