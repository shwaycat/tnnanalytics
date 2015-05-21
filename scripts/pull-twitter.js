require('dotenv').load();

var argv = require('minimist')(process.argv.slice(2)),
    keystone = require('../keystone-setup')(),
    debug = require('debug')('cadence:pull'),
    User = keystone.list('User'),
    async = require('async'),
    errorHandling = require('../lib/errorHandling'),
    connectES = require('../lib/connect_es'),
    twitterSource = require('../lib/sources/twitter');

function pullType(docType) {
  return function(callback) {
    User.model.findAccountRoots(function(err, users) {
      if (err) return callback(err);

      async.eachSeries(users, function(user, nextUser) {
        console.info("Pulling for user %s", user.id);
        debug("User: %j", user);
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
    followerCounts: pullType(twitterSource.followerCount),
    tweets: [ 'followerCounts', pullType(twitterSource.tweet) ],
    directMessages: [ 'tweets', pullType(twitterSource.direct_message) ],
    mentions: [ 'directMessages', pullType(twitterSource.mention) ],
    replies: [ 'mentions', pullType(twitterSource.reply) ]
  }, function(err) {
    if (err) {
      errorHandling.logError(err);
      errorHandling.sendSNS('error', err, done);
    } else {
      done();
    }
  });
});
