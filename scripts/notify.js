require('dotenv').load();

var argv = require('minimist')(process.argv.slice(2));

if (argv.help || argv.h) {
  var w = console.log;
  w("Usage: node scripts/notify.js [options]");
  w("\nOptions:");
  w("  -E,--no-email   Do not send keyword alert emails.");
  w("  -s STATE,--alert-state=STATE");
  w("                  Use the given initial STATE for un-notified objects.");
  w("                  Possible values: new (default), open, closed");
  w("  -h,--help       Show this help message.");
  process.exit(0);
}

var argvAlertState = argv['alert-state'] || argv.s,
    argvNoEmail = argv.email === false || argv.E === true,
    ALERT_STATE = argvAlertState || "new",
    SEND_EMAIL = !argvNoEmail;

if (['new', 'open', 'closed', 'benign'].indexOf(ALERT_STATE) == -1) {
  console.error("Invalid alert-state: %s\n\tmust be new, open, or closed", argvAlertState);
  process.exit(1);
}

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
      youtube: require('../lib/sources/youtube'),
      googleplus: require('../lib/sources/googleplus')
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
                alertState: ALERT_STATE
              }
            }
          );
        });
        nextBatch();
      }, function(err) {
        if (err) return next(err);
        if (!links.length) return next();

        debug("User %s - %s notifications", user.id, links.length);

        var tasks = [
              function(cb) {
                user.sendNotificationEmail(links, cb);
              },
              function(cb) {
                keystone.elasticsearch.bulk({ body: bulkUpdates }, cb);
              }
            ];

        if (!SEND_EMAIL) {
          tasks.splice(0, 1); // remove the send-email function from tasks
        }

        async.series(tasks, function(err) {
          if (err) {
            console.error("Error for user %s", user.id);
          }
          next(err);
        });
      });
    }, function(err) {
      if (err) return errorHandling.sendSNS("error", err, done);
      done();
    });
  });
});
