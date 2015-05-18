var util = require('util'),
    _ = require('underscore'),
    insta = require('./insta'),
    keystone = require('keystone'),
    async = require('async'),
    debug = require('debug')('cadence:instagram:followerCount'),
    AbstractType = require('../abstract_type'),
    SOURCE_NAME = 'Instagram',
    DOC_SOURCE = 'instagram',
    DOC_TYPE = 'followerCount',
    DELTA_FIELDS = [ 'followed_by' ];

/**
 * Instagram FollowerCount
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

    callback(null, makeFollowerCountFromHit(res));
  });
}

function makeFollowerCountFromHit(hit) {
  var result = new FollowerCount(hit._id, hit._source);
  result.timestamp = new Date(result.timestamp);
  return result;
}

/**
 * Pull Instgram FollowerCount
 * @param {User} user
 * @param {function} callback
 */
FollowerCount.pull = function(user, callback) {
  var requestOpts = insta.requestOpts(user, 'users', user.services.instagram.profileId);

    debug("pulling followerCount for user id %s", user.id);

    insta.request(requestOpts, function(err, body) {
      if(err) return callback(err);

      FollowerCount.process(user, body.data, callback);
    });

};

// alias
FollowerCount.pullAll = FollowerCount.pull;

/**
 * Adds appropriate data to FollowerCount from a raw instagramUser object.
 * @param {object} rawInstgramUser - A raw instagram user from a stream or rest API
 */
FollowerCount.prototype.populateFields = function(user, instagramUser) {
  _.extend(this, {
    user_id: instagramUser.id,
    user_name: instagramUser.screen_name,
    cadence_user_id: user.id,
    followed_by: instagramUser.counts.followed_by,
    timestamp: new Date()
  });
}

FollowerCount.process = function(user, instagramUser, callback) {
  FollowerCount.findOne(instagramUser.id, function(err, followerCount) {
    if (err) return callback(err);

    if(followerCount) {
      followerCount.modifyByDelta(function(err) {
        if (err) return callback(err);

        var series = [];
        DELTA_FIELDS.forEach(function(fieldName) {
          if(instagramUser['counts'][fieldName] != followerCount[fieldName]) {
            followerCount.createDelta(user, fieldName, instagramUser['counts'][fieldName], function(err, res){
              return callback(err, res);
            });
          } else {
            return callback();
          }
        })
      });

    } else {
      var followerCount = new FollowerCount(instagramUser.id);
      followerCount.populateFields(user, instagramUser);
      followerCount.create(function(err) {
        if (err) return callback(err);

        debug("created follower count %s", instagramUser.id);
        callback();
      });
    }
  });
}



/**
 * The object for building a link to the object (text and href)
 */
FollowerCount.prototype.emailLinkObject = function(opts) {
  return {
    text: this.emailLinkText(),
    href: 'https://instagram.com/' + opts.user.services.instagram.username
  };
};

/**
 * Creates the FollowerCount in Elasticsearch
 */
FollowerCount.prototype.create = function(callback) {
  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback);
};

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
    user_id: user.services.instagram.profileId
  };
  body[key] = value;

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

module.exports = FollowerCount;
