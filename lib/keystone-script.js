var keystone = require('keystone'),
    util = require('util'),
    url = require('url'),
    debug = require('debug')('keystone:script'),
    debugMongo = require('debug')('keystone:core:connect_mongo'),
    async = require('async');

function connectMongo(done) {
  debugMongo('connecting to mongo');

  var mongoConnectionOpen = false;

  // support replica sets for mongoose
  if (keystone.get('mongo replica set')){
    debugMongo('setting up mongo replica set');
    var replicaData = keystone.get('mongo replica set'),
        replicaURIs = [];

    replicaData.db.servers.forEach(function(server) {
      var serverURIOpts = {
            protocol: 'mongodb',
            slashes: true,
            // auth: '',
            hostname: server.host,
            port: server.port,
            pathname: '/' + replicaData.db.name
          };

      if (replicaData.username && replicaData.password) {
        serverURIOpts.auth = replicaData.username + ':' + replicaData.password;
      }

      replicaURIs.push(url.format(serverURIOpts));
    });

    var options = {
      auth: { authSource: replicaData.authSource },
      replset: {
        rs_name: replicaData.db.replicaSetOptions.rs_name,
        readPreference: replicaData.db.replicaSetOptions.readPreference
      }
    };

    debugMongo('Mongo replica-set URIs: %j', replicaURIs);
    keystone.mongoose.connect(replicaURIs.join(","), options);
  } else {
    debugMongo('Mongo URI: %s', keystone.get('mongo'));
    keystone.mongoose.connect(keystone.get('mongo'));
  }

  keystone.mongoose.connection.on('error', debug)
    .on('open', function() {
      debugMongo('mongo connection open');
      mongoConnectionOpen = true;
      done();
    });
}


module.exports = function() {
  var callbacks = Array.prototype.slice.call(arguments);
  callbacks.unshift(connectMongo);

  console.log("Starting");

  async.series(callbacks, function(err) {
    if (err) {

      console.error("An error occurred:");

      if (util.isError(err)) {
        console.error("%s\n%s", err, err.stack);
      } else {
        console.error(err);
      }

      process.exit(1);
    } else {
      keystone.get('mongoose').disconnect(function() {
        console.log("Done");
        process.exit(0);
      });
    }
  });
};
