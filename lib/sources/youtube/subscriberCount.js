var util = require('util'),
    _ = require('underscore'),
    yt = require('./yt'),
    keystone = require('keystone'),
    async = require('async'),
    debug = require('debug')('cadence:youtube:subscriberCount'),
    AbstractType = require('../abstract_type'),
    SOURCE_NAME = 'YouTube',
    DOC_SOURCE = 'youtube',
    DOC_TYPE = 'subscriberCount',
    DELTA_FIELDS = [ 'subscriberCount' ];

/**
 * YouTube SubscriberCount
 * @class
 * @augments AbstractType
 */
function SubscriberCount(id, obj) {
  AbstractType.call(this, SOURCE_NAME, id, obj);
  this.doc_source = DOC_SOURCE;
  this.doc_type = DOC_TYPE;
}

util.inherits(SubscriberCount, AbstractType);

/**
 * Get a SubscriberCount
 * @param {string} id
 * @param {esSubscriberCountCallback} callback
 */
SubscriberCount.findOne = function(id, callback) {
  keystone.elasticsearch.get({
    index: keystone.get('elasticsearch index'),
    type: DOC_SOURCE,
    id: id
  }, function(err, res) {
    if (err && !res.found) return callback(null, null);
    if (err) return callback(err);

    callback(null, makeSubscriberCountFromHit(res));
  });
}

function makeSubscriberCountFromHit(hit) {
  var result = new SubscriberCount(hit._id, hit._source);
  result.timestamp = new Date(result.timestamp);
  return result;
}

/**
 * Pull Instgram SubscriberCount
 * @param {User} user
 * @param {function} callback
 */
SubscriberCount.pull = function(user, callback) {
  var requestOpts = yt.requestOpts(user, 'channels', {
    part: 'contentDetails,snippet,statistics',
    id: user.services.googleplus.youtubeChannelID,
  });

  debug("pulling subscriberCount for user id %s", user.id);

  yt.request(requestOpts, function(err, body) {
    if(err) return callback(err);

    if(body.items[0]) {

      if(body.items[0].contentDetails.relatedPlaylists.uploads && user.services.googleplus.youtubeChannelUploadPlaylistID != body.items[0].contentDetails.relatedPlaylists.uploads) {

        user.services.googleplus.youtubeChannelUploadPlaylistID = body.items[0].contentDetails.relatedPlaylists.uploads;
        user.save(function(err) {
          if (err) return callback(err);

          SubscriberCount.process(user, body.items[0], callback);
        })


      } else {
        SubscriberCount.process(user, body.items[0], callback);
      }
    } else {
      debug('Panic!');
      callback();
    }
  });

};

// alias
SubscriberCount.pullAll = SubscriberCount.pull;

/**
 * Adds appropriate data to SubscriberCount from a raw youTubeChannel object.
 * @param {object} rawInstgramUser - A raw youtube user from a stream or rest API
 */
SubscriberCount.prototype.populateFields = function(user, youTubeChannel) {
  _.extend(this, {
    user_id: user.services.googleplus.profileId,
    user_name: user.services.googleplus.username,
    cadence_user_id: user.id,
    subscriberCount: youTubeChannel.statistics.subscriberCount,
    timestamp: new Date()
  });
}

SubscriberCount.process = function(user, youTubeChannel, callback) {
  SubscriberCount.findOne(youTubeChannel.id, function(err, subscriberCount) {
    if (err) return callback(err);

    if(subscriberCount) {
      subscriberCount.modifyByDelta(function(err) {
        if (err) return callback(err);

        var series = [];
        DELTA_FIELDS.forEach(function(fieldName) {
          if(youTubeChannel['statistics'][fieldName] != subscriberCount[fieldName]) {
            subscriberCount.createDelta(user, fieldName, youTubeChannel['statistics'][fieldName], function(err, res){
              debug('Delta created for %s', fieldName);
              return callback(err, res);
            });
          } else {
            return callback();
          }
        })
      });

    } else {
      var subscriberCount = new SubscriberCount(youTubeChannel.id);
      subscriberCount.populateFields(user, youTubeChannel);
      subscriberCount.create(function(err) {
        if (err) return callback(err);

        debug("created subscriber count %s", youTubeChannel.id);
        callback();
      });
    }
  });
}



/**
 * The object for building a link to the object (text and href)
 */
SubscriberCount.prototype.emailLinkObject = function(opts) {
  return {
    text: this.emailLinkText(),
    href: 'https://youtube.com/' + opts.user.services.youtube.username
  };
};

/**
 * Creates the SubscriberCount in Elasticsearch
 */
SubscriberCount.prototype.create = function(callback) {
  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback);
};

/**
 * Creates a delta for the SubscriberCount in Elasticsearch
 * @param {string} key - Field name
 * @param {string} value - New value for the field
 * @param {Date} [timestamp=now] - Date/time of the change
 * @param {esCreateCallback} callback
 */
SubscriberCount.prototype.createDelta = function(user, key, value, timestamp, callback) {
  if (_.isFunction(timestamp)) { // default timestamp
    callback = timestamp;
    timestamp = new Date();
  }

  var body = {
    original_id: this.id,
    timestamp: timestamp,
    cadence_user_id: user.id,
    user_id: user.services.googleplus.profileId
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
 * Modify the SubscriberCount by the latest delta
 * @param {esSubscriberCountCallback} callback
 */
SubscriberCount.prototype.modifyByDelta = function(callback) {
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

module.exports = SubscriberCount;
