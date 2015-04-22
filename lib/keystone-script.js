var keystone = require('keystone')
  , debug = require('debug')('keystone:script')
  , debugMongo = require('debug')('keystone:core:connect_mongo')
  , async = require('async')

function connectMongo(done) {
  debugMongo('connecting to mongo');

  var mongoConnectionOpen = false;

  // support replica sets for mongoose
  if (keystone.get('mongo replica set')){
    debugMongo('setting up mongo replica set');
    var replicaData = keystone.get('mongo replica set');
    var replica = '';

    var credentials = (replicaData.username && replicaData.password) ? replicaData.username + ':' + replicaData.password + '@' : '';

    replicaData.db.servers.forEach(function (server) {
      replica += 'mongodb://' + credentials + server.host + ':' + server.port + '/' + replicaData.db.name + ',';
    });

    var options = {
      auth: { authSource: replicaData.authSource },
      replset: {
        rs_name: replicaData.db.replicaSetOptions.rs_name,
        readPreference: replicaData.db.replicaSetOptions.readPreference
      }
    };

    debugMongo('connecting to replicate set');
    keystone.mongoose.connect(replica, options);

  } else {
    debugMongo('connecting to mongo');
    keystone.mongoose.connect(keystone.get('mongo'));

  }

  keystone.mongoose.connection.on('error', debug)
    .on('open', function() {
      debugMongo('mongo connection open');
      mongoConnectionOpen = true;
      done()
    });
}


module.exports = function(callbacks_) {
  var callbacks = Array.prototype.slice.call(arguments)
  callbacks.unshift(connectMongo)

  debug("Starting")

  async.series(callbacks, function(err, results) {
    debug("Done")
    if (err) {
      console.error(err)
      process.exit(1)
    } else {
      keystone.get('mongoose').disconnect(function() {
        console.log("Done")
      })
    }
  })
}
