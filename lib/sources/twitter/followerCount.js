var util = require("util"),
    _ = require('underscore'),
    twitter = require('twitter'),
    async = require('async'),
    debug = require('debug')('cadence:twitter:followerCount'),
    AbstractType = require("../abstract_type"),
    SOURCE_NAME = 'Twitter',
    DOC_SOURCE = 'twitter',
    DOC_TYPE = 'followerCount',
    DELTA_FIELDS = [ 'followers_count' ],
    keystone = require('keystone');

/**
 * Twitter Follower Count
 * @class
 * @augments AbstractType
 */
function FollowerCount(id, obj) {
  AbstractType.call(this, SOURCE_NAME, id, obj);
  this.doc_source = DOC_SOURCE;
  this.doc_type = DOC_TYPE;
}

util.inherits(FollowerCount, AbstractType);

/**
 * Get a FollowerCount
 * @param {string} id
 * @param {esFollowerCountCallback} callback
 */
FollowerCount.findOne = function(id, callback) {
  keystone.elasticsearch.get({
    index: keystone.get('elasticsearch index'),
    type: DOC_SOURCE,
    id: id
  }, function(err, res) {
    if (err && !res.found) return callback(null, null);
    if (err) return callback(err);

    callback(null, new FollowerCount(id, res._source))
  });
}

/**
 * Pull follower count from Twitter
 * @param {User} user - Keystone user to pull from Twitter for
 * @param {esFollowerCountPullCallback} callback
 */
FollowerCount.pullAll = function(user, callback){
  return FollowerCount.pull(user, callback);
}

FollowerCount.pull = function(user, callback) {
  debug("pulling Follower Count for %s", user.id);

  var client = new twitter({
        consumer_key: process.env.TWITTER_API_KEY,
        consumer_secret: process.env.TWITTER_API_SECRET,
        access_token_key: user.services.twitter.accessToken,
        access_token_secret: user.services.twitter.refreshToken
      }),
      params = { 
        user_id: user.services.twitter.profileId,
        screename: user.services.twitter.username
      };

  client.get('users/show', params, function(err, twitterUser, response) {
    if(err) {
      console.log("Error loading user");
      return callback(err);
    }

    if(!twitterUser) {
      console.log('No user found.');
      return callback();
    }

    debug('%s followers for %s', twitterUser.followers_count, user.id);
    
    FollowerCount.process(user, twitterUser, callback);
    
  });
}

/**
 * Adds appropriate data to FollowerCount from a raw TwitterUser object.
 * @param {object} rawTwitterUser - A raw twitter user from a stream or rest API
 */
FollowerCount.prototype.populateFields = function(user, twitterUser) {
  _.extend(this, {
    user_id: twitterUser.id_str,
    user_name: twitterUser.screen_name,
    cadence_user_id: user.id,
    followers_count: twitterUser.followers_count,
    timestamp: new Date()  
  });
}

FollowerCount.process = function(user, twitterUser, callback) {
  FollowerCount.findOne(twitterUser.id_str, function(err, followerCount) {
    if (err) return callback(err);

    if(followerCount) {
      followerCount.modifyByDelta(function(err) {
        if (err) return callback(err);

        var series = [];
        DELTA_FIELDS.forEach(function(fieldName) {
          if(twitterUser[fieldName] != followerCount[fieldName]) {
            followerCount.createDelta(user, fieldName, twitterUser[fieldName], function(err, res){
              return callback(err, res);
            });
          } else {
            return callback();
          }
        })
      });

    } else {
      var followerCount = new FollowerCount(twitterUser.id_str);
      followerCount.populateFields(user, twitterUser);
      followerCount.create(function(err) {
        if (err) return callback(err);

        debug("created follower count %s", twitterUser.id_str);
        callback();
      });
    }
  });
}

/**
 * Creates the Follower Count in Elasticsearch
 */
FollowerCount.prototype.create = function(callback) {
  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback);
}

/**
 * Creates a delta for the FollowerCount in Elasticsearch
 * @param {string} key - Field name
 * @param {string} value - New value for the field
 * @param {Date} [timestamp=now] - Date/time of the change
 * @param {esCreateCallback} callback
 */
FollowerCount.prototype.createDelta = function(user, key, value, timestamp, callback) {
  if (_.isFunction(timestamp)) { // default timestamp
    callback = timestamp;
    timestamp = new Date();
  }

  var body = {
    original_id: this.id,
    timestamp: timestamp,
    cadence_user_id: user.id,
    user_id: user.services.twitter.profileId
  };
  body[key] = value;
  body['doc_source'] = DOC_SOURCE;

  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source + '_delta',
    body: body
  }, callback);
}

/**
 * Modify the FollowerCount by the latest delta
 * @param {esFollowerCountCallback} callback
 */
FollowerCount.prototype.modifyByDelta = function(callback) {
  var self = this;

  keystone.elasticsearch.search({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source + '_delta',
    body: {
      query: {
        filtered: {
          filter: {
            term: { original_id: this.id }
          }
        }
      },
      aggregations: {
        deltas: {
          filters: {
            filters: _.map(DELTA_FIELDS, function(fieldName) {
              return { exists: { field: fieldName } };
            })
          },
          aggregations: {
            last_delta: {
              top_hits: {
                sort: [
                  { _timestamp: { order: 'desc' } }
                ],
                size: 1
              }
            }
          }
        }
      }
    }
  }, function(err, res) {
    if (err) return callback(err);

    DELTA_FIELDS.forEach(function(fieldName, i) {
      var delta = res.aggregations.deltas.buckets[i].last_delta.hits.hits[0];
      if(delta) {
        self[fieldName] = delta._source[fieldName];
      }
    });

    callback(null, self);
  });
}

module.exports = FollowerCount
