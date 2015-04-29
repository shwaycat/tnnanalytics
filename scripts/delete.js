require('dotenv').load()

var argv = require('minimist')(process.argv.slice(2));

if(!argv.help) {
    var keystone = require('../keystone-setup')(),
        debug = require('debug')('delete'),
        User = keystone.list('User'),
        async = require('async'),
        _ = require('underscore'),
        connectES = require('../lib/connect_es');


  require('../lib/keystone-script')(connectES, function(done) { 

    buildUsers(function(err, users) {

      if(err) {
        return done(err);
      }

      var series = buildSeries();

      async.applyEach(series, users, done);

    });

  });
} else {
  return showHelp();
}

function buildUsers(callback) {
  if(argv.u) {
    // Perform actions on given user
    User.model.findByEmail(argv.u, callback);

  } else {
    // Perform actions on all users
    User.model.find({}, callback);
  }
}

function buildSeries() {
  var series = [];
  if(argv && hasArgs()) {

    if(argv['twitter-all']) {
      series.push(deleteDocsByType('direct_message'));
      series.push(deleteDocsByType('mention'));
      series.push(deleteDocsByType('tweet'));
    } else {
      if(argv['twitter-direct_messages']) {
        series.push(deleteDocsByType('direct_message'));
      }

      if(argv['twitter-mentions']) {
        series.push(deleteDocsByType('mention'));
      }

      if(argv['twitter-tweets']) {
        series.push(deleteDocsByType('tweet'));
      }
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

function showHelp() {
  console.log('');
  console.log('');
  console.log('Usage: node delete.js <commands> <options>');
  console.log('');
  console.log('<commands>');
  console.log('--help                           Show this dialog');
  console.log('');
  console.log('--twitter-all                    Delete all Twitter objects and reset all sinceIds');
  console.log('--twitter-direct_messages        Delete all Twitter direct_messages and reset direct_messagesinceId');
  console.log('--twitter-mentions               Delete all Twitter mentions and reset mentionSinceId');
  console.log('--twitter-tweets                 Delete all Twitter tweets and reset tweetSinceId');
  console.log('');
  console.log('<options>');
  console.log('--u <user email>                 Perform commands on specified user.')
  console.log('');
  console.log('');  
}
