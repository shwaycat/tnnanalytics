require('dotenv').load()

var argv = require('minimist')(process.argv.slice(2)),
    keystone = require('../keystone-setup')(),
    debug = require('debug')('delete'),
    User = keystone.list('User'),
    async = require('async'),
    _ = require('underscore'),
    connectES = require('../lib/connect_es');

require('../lib/keystone-script')(connectES, function(done) { 

  buildUsers(function(err, users) {
    debug('POST Build Users: %j', users);
    if(err) {
      return done(err);
    }

    var series = buildSeries();

    async.applyEach(series, users, done);

  });

});

function buildUsers(callback) {
  if(argv.u) {
    // Perform actions on given user
    debug("argv.u: %j", argv.u);
    User.model.findByEmail(argv.u, callback);

  } else {
    // Perform actions on all users
    User.model.find({}, callback);
  }
}

function buildSeries() {
  var series = [];
  if(argv && hasArgs()) {

    // if(argv['twitter-dm']) {
    //   series.push(deleteTwitterDirectMessages(callback));
    // }

    if(argv['twitter-mentions']) {
      series.push(deleteDocsByType('mention'));
    }

    return series;

  } else {
    return false;
  }

}

function hasArgs() {
  if(argv) {
    if(Object.keys(argv).length > 1) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

function resetUsersLastTime(users, path, callback) {
  
  debug("resetting %s for users", path);

  var resetQuery = {};
  resetQuery[path] = null;

  User.model.update({
    '_id': {'$in': _.pluck(users, '_id')}
    },
    { '$set': resetQuery },
    { multi : true },
    callback);

}

function deleteDocsByType(doc_type) {

  return function(users, callback) {
    keystone.elasticsearch.deleteByQuery({
      index: keystone.get('elasticsearch index'),
      body: {
        query: {
          filtered: {
            filter: {
              and: [
                { 
                  term: { 
                    doc_type: doc_type
                  } 
                },
                {
                  terms: {
                    cadence_user_id: _.pluck(users, 'id')
                  } 
                }
              ]
            }
          }
        }
      }
    }, function(err, results) {
      if(err) {
        console.log('Delete Failed. Not Resetting Since Id.')
        callback(err);
      } else {
        resetUsersLastTime(users, 'services.twitter.' + doc_type + 'SinceId', callback);
      }
    });
  }
}

function deleteTwitterDirectMessages(callback) {
  keystone.elasticsearch.count({
    index: keystone.get('elasticsearch index'),
    body: {
      query: {
        term: {doc_type: 'direct_message'}
      }
    }
  }, function(err, response) {
    if (err == null && response.count > 0) {
      console.log('Direct Messages To Delete: ' + response.count);
      keystone.elasticsearch.deleteByQuery({
        index: keystone.get('elasticsearch index'),
        body: {
          query: {
            term: {doc_type: 'direct_message'}
          }
        }
      }, function (err, response) {
        callback();
      })
    } else if(err != null) {
      callback(err);
    } else {
      console.log('No Direct Messages to Delete');
      callback();
    }
  });
}

