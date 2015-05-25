require('dotenv').load();

var argv = require('minimist')(process.argv.slice(2)),
    keystone = require('../keystone-setup')(),
    debug = require('debug')('cadence:pull:youtube'),
    User = keystone.list('User'),
    async = require('async'),
    errorHandling = require('../lib/errorHandling'),
    connectES = require('../lib/connect_es'),
    youtubeSource = require('../lib/sources/youtube');

function pullType(docType) {
  return function(callback) {
    User.model.findAccountRoots(function(err, users) {
      if (err) return callback(err);

      async.eachSeries(users, function(user, nextUser) {
        console.info("Pulling for user %s", user.id);

        if(argv.all) {
          debug("Pull all");
          docType.pullAll(user, nextUser);
        } else {
          debug("Pull latest");
          docType.pull(user, nextUser);
        }
      }, callback);
    });
  };
}

require('../lib/keystone-script')(connectES, function(done) {
  async.auto({
    // subscriberCount: pullType(youtubeSource.subscriberCount),
    // video: pullType(youtubeSource.video)
    comment: pullType(youtubeSource.comment)
  }, function(err) {
    if (err) {
      errorHandling.logError(err);
      errorHandling.sendSNS('error', err, done);
    } else {
      done();
    }
  });
});
