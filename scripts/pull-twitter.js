require('dotenv').load();

var argv = require('minimist')(process.argv.slice(2)), 
    keystone = require('../keystone-setup')(),
    debug = require('debug')('cadence:pull'),
    User = keystone.list('User'),
    async = require('async'),
    _ = require('underscore'),
    errorHandling = require('../lib/errorHandling'),
    connectES = require('../lib/connect_es'),
    twitterSource = require('../lib/sources/twitter');

require('../lib/keystone-script')(connectES, function(done) {
  async.eachSeries(_.keys(twitterSource), function(docTypeKey, nextDocType) {
    console.info("Pulling from Twitter: %s", docTypeKey);

    User.model.findAccountRoots(function(err, users) {
      if (err) return nextDocType(err);

      var docType = twitterSource[docTypeKey];

      async.eachSeries(users, function(user, nextUser) {
        console.info("Pulling for user %s", user.id);

        if(argv.all) {
          debug("Pull all");
          docType.pullAll(user, nextUser);  
        } else {
          debug("Pull latest");
          docType.pull(user, nextUser);
        }
        
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

//[ { message: 'Rate limit exceeded', code: 88 } ]
