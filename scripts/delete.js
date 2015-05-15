require('dotenv').load()

var argv = require('minimist')(process.argv.slice(2)),
    debug = require('debug')('cadence:delete');

if(!argv.help) {
    var keystone = require('../keystone-setup')(),
        User = keystone.list('User'),
        async = require('async'),
        _ = require('underscore'),
        mxm = require('../lib/mxm-utils'),
        connectES = require('../lib/connect_es');


  require('../lib/keystone-script')(connectES, function(done) {

    buildUsers(function(err, users) {

      if(err) {
        return done(err);
      }

      var series = buildSeries();

      if(series) {
        async.applyEach(series, users, done);
      } else {
        console.log('No arguments supplied. Exiting.')
        done();
      }

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

      if(argv['twitter-direct_messages'] || argv['twitter-all']) {
        series.push(deleteDocsByType('twitter', 'direct_message'));
      }

      if(argv['twitter-mentions'] || argv['twitter-all']) {
        series.push(deleteDocsByType('twitter', 'mention'));
      }

      if(argv['twitter-tweets'] || argv['twitter-all']) {
        series.push(deleteDocsByType('twitter', 'tweet'));
      }

      if(argv['twitter-followers'] || argv['twitter-all']) {
        series.push(deleteDocsByType('twitter', 'followerCount'));
      }

      if(argv['twitter-deltas'] || argv['twitter-all']) {
        series.push(deleteDeltasBySource('twitter'));
      }

      if(argv['twitter-followerCounts'] || argv['twitter-all']) {
        series.push(deleteDocsByType('twitter', 'followerCount'));
      }

      if(argv['twitter-replies'] || argv['twitter-all']) {
        series.push(resetTwitterReplies('twitter', 'replies'));
      }

      if(argv['facebook-pages'] || argv['facebook-all']) {
        series.push(deleteDocsByType('facebook', 'page'));
      }

      if(argv['facebook-posts'] || argv['facebook-all']) {
        series.push(deleteDocsByType('facebook', 'post'));
      }

      if(argv['facebook-statuses'] || argv['facebook-all']) {
        series.push(deleteDocsByType('facebook', 'status'));
      }

      if(argv['facebook-mentions'] || argv['facebook-all']) {
        series.push(deleteDocsByType('facebook', 'mention'));
      }

      if(argv['facebook-comments'] || argv['facebook-all']) {
        series.push(deleteDocsByType('facebook', 'comment'));
      }

      if(argv['facebook-messages'] || argv['facebook-all']) {
        series.push(deleteDocsByType('facebook', 'message'));
      }

      if(argv['facebook-deltas'] || argv['facebook-all']) {
        series.push(deleteDeltasBySource('facebook'));
      }

      if(argv['instgram-followerCounts'] || argv['instagram-all']) {
        series.push(deleteDocsByType('instagram', 'followerCount'));
      }

      if(argv['instgram-comments'] || argv['instagram-all']) {
        series.push(deleteDocsByType('instagram', 'comment'));
      }

      if(argv['instgram-deltas'] || argv['instagram-all']) {
        series.push(deleteDeltasBySource('instagram'));
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

// function resetUsersLastTime(path) {
//   return function(users, callback) {
//     debug("resetting %s for users", path);

//     var resetQuery = {};
//     resetQuery[path] = null;

//     User.model.update({
//       '_id': {'$in': _.pluck(users, '_id')}
//       },
//       { '$set': resetQuery },
//       { multi : true },
//       callback);
//   }

// }

function deleteDocsByType(source, doc_type) {
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
        console.log('Delete %s - %s Failed.', source, doc_type);
        callback(err);
      } else {
        console.log('Deleted %s - %s for users: %j', source, doc_type, _.pluck(users, 'id'));
        callback(err, results);
      }
    });
  }
}

function deleteDeltasBySource(source) {
  return function(users, callback) {
    keystone.elasticsearch.deleteByQuery({
      index: keystone.get('elasticsearch index'),
      body: {
        query: {
          match: {
            _type: source + "_delta"
          }
        }
      }
    }, function(err, results) {
      if(err) {
        console.error('Delete Deltas Failed.');
        callback(err);
      } else {
        console.log('Deleted %s - deltas for users: %j', source, _.pluck(users, 'id'));
        callback();
      }
    });
  }
}

function resetTwitterReplies(source, doc_type) {
  return function(users, callback) {
    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      size: 1000000000,
      type: "twitter",
      body: {
        "query": {
          "filtered": {
            "filter": {
              "and": {
                "filters": [
                  {
                    "exists": {
                      "field": "replyCounted"
                    }
                  },
                  {
                    "exists": {
                      "field": "in_reply_to_status_id_str"
                    }
                  },
                  {
                    "term": {
                      "doc_type": "mention"
                    }
                  },
                  {
                    "terms": {
                      "cadence_user_id": _.pluck(users, 'id')
                    }
                  }
                ]
              }
            }
          }
        }
      }
    }, function(err, response) {
      if(err) {
        console.log('Delete %s - %s Failed.', source, doc_type);
        callback(err);
      } else {
        var replies = mxm.objTry(response, 'hits', 'hits');
        if(replies.length) {
          bulkUpdateReplies(replies, function(err) {
            if(err) {
              console.log('Delete %s - %s Failed.', source, doc_type);
              callback(err);
            }
            console.log('Deleted %s - %s for users: %j', source, doc_type, _.pluck(users, 'id'));
            callback();
          });
        } else {
          callback();
        }
      }
    });
  }
}

function bulkUpdateReplies(docs, callback) {
  var bulkUpdates = [];

  for(i=0;i<docs.length;i++) {
    doc = docs[i];

    bulkUpdates.push({
        update: {
          _index: keystone.get('elasticsearch index'),
          _type: doc._type,
          _id: doc._id
        }
      },
      {
        doc: {
          replyCounted: null
        }
      });
  }

  keystone.elasticsearch.bulk({
    body: bulkUpdates
  }, function(err, response) {
    if (err) return callback(err);

    callback();
  });
}


function showHelp() {
  console.log('');
  console.log('Usage: node delete.js <flags> <options>');
  console.log('');
  console.log('<flags>');
  console.log('--help                           Show this dialog');
  console.log('');
  console.log('--twitter-all                    Delete all Twitter objects');
  console.log('--twitter-direct_messages        Delete all Twitter direct_messages');
  console.log('--twitter-mentions               Delete all Twitter mentions');
  console.log('--twitter-tweets                 Delete all Twitter tweets');
  console.log('--twitter-followers              Delete all Twitter followers');
  console.log('--twitter-deltas                 Delete all Twitter deltas');
  console.log('--twitter-followerCounts         Delete all Twitter FollowerCounts');
  console.log('');
  console.log('--facebook-all                   Delete all Facebook objects');
  console.log('--facebook-pages                 Delete all Facebook pages');
  console.log('--facebook-posts                 Delete all Facebook posts');
  console.log('--facebook-statuses              Delete all Facebook statuses');
  console.log('--facebook-mentions              Delete all Facebook mentions');
  console.log('--facebook-comments              Delete all Facebook comments');
  console.log('--facebook-messages              Delete all Facebook messages');
  console.log('--facebook-deltas                Delete all Facebook deltas');
  console.log('');
  console.log('--instagram-all                  Delete all Instagram objects');
  console.log('--instagram-followerCounts       Delete all Instagram FollowerCounts');
  console.log('--instagram-comments             Delete all Instagram comments');
  console.log('--instagram-deltas               Delete all Instagram deltas');
  console.log('<options>');
  console.log('--u <user email>                 Perform actions on specified user.')
  console.log('');
}
