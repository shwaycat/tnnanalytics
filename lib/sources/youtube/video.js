var util = require("util"),
    _ = require('underscore'),
    async = require('async'),
    debug = require('debug')('cadence:youtube:video'),
    AbstractType = require("../abstract_type"),
    SOURCE_NAME = 'YouTube',
    DOC_SOURCE = 'youtube',
    DOC_TYPE = 'video',
    keystone = require('keystone'),
    yt = require('./yt'),
    mxm = require('../../mxm-utils.js'),
    // Comment = require('./comment'),
    DELTA_FIELDS = [ 'viewCount', 'likeCount', 'dislikeCount', 'favoriteCount', 'commentCount' ];

/**
 * YouTube Video
 * @class
 * @augments AbstractType
 */
function Video(id, obj) {
  AbstractType.call(this, SOURCE_NAME, id, obj);
  this.doc_source = DOC_SOURCE;
  this.doc_type = DOC_TYPE;
}

util.inherits(Video, AbstractType);

/**
 * Get a Video
 * @param {string} id
 * @param {esVideoCallback} callback
 */
Video.findOne = function(id, callback) {
  keystone.elasticsearch.get({
    index: keystone.get('elasticsearch index'),
    type: DOC_SOURCE,
    id: id
  }, function(err, res) {
    if (err && !res.found) return callback(null, null);
    if (err) return callback(err);

    callback(null, new Video(id, res._source));

  });
}

function makeVideoFromHit(hit) {
  var result = new Video(hit._id, hit._source);
  result.timestamp = new Date(result.timestamp);
  return result;
}

/**
 * Get the latest Video
 * @param {User} user
 * @param {esVideoCallback} callback
 */
Video.findLatest = function(user, callback) {
  keystone.elasticsearch.search({
    index: keystone.get('elasticsearch index'),
    type: DOC_SOURCE,
    body: {
      "query": {
        "filtered": {
          "filter": {
            "and": [
              {
                "term": {
                  "doc_type": DOC_TYPE
                }
              },
              {
                "term": {
                  "cadence_user_id": user.id
                }
              }
            ]
          }
        }
      },
      "size": 1,
      "sort": [
        {
          "_timestamp": "desc"
        }
      ]
    }
  }, function(err, res) {
    if (err) return callback(err);
    if (res.hits.hits.length != 1) return callback(null, null);

    callback(null, makeVideoFromHit(res.hits.hits[0]));
  });
};

/**
 * Pull YouTube Videos
 * @param {User} user - Keystone user to pull from YouTube for
 * @param {esVideoPullCallback} callback
 */
Video.pull = function(user, callback) {
  debug("pulling video for user id %s", user.id);
  var videoIDs = [];

  if(user.services.google.youtubeChannelUploadPlaylistID) {

    var requestOpts = yt.requestOpts(user, 'playlistItems', {
      part: 'contentDetails',
      playlistId: user.services.google.youtubeChannelUploadPlaylistID,
      maxResults: 50
    });

    yt.pager('next', requestOpts, function(playlistItem, next) {
      // debug("%j", video);
      videoIDs.push(playlistItem.contentDetails.videoId);
      next();
    }, function() {
      debug("Processing %s videos for user %s", videoIDs.length, user.id);
      videoIDs = _.chain(videoIDs)
                  .groupBy(function(element, index) {
                    return Math.floor(index/50);
                  })
                  .toArray()
                  .value();
      debug(videoIDs);
      async.whilst(function() {
        return videoIDs.length;
      },
      function(cb) {
        var ids = videoIDs.shift();
        var requestOpts = yt.requestOpts(user, 'videos', {
          part: 'statistics,snippet,contentDetails',
          id: ids.toString(),
          maxResults: 50
        });

        yt.pager('next', requestOpts, function(video, next) {
          Video.process(user, video, next);
        }, cb);
      },
      callback);
    });

  } else {
    debug('Oops. Subscriber Count needs to be pulled first.');
    callback();
  }
}

/**
 * Pull ALL YouTube Video
 * @param {User} user - Keystone user to pull from YouTube for
 * @param {esVideoPullCallback} callback
 */
Video.pullAll = Video.pull;

/**
 * The object for building a link to the object (text and href)
 */
Video.prototype.emailLinkObject = function(opts) {
  return {
    text: this.emailLinkText(),
    href: "http://www.youtube.com/watch?v=" + this.id
  };
}

/**
 * Processes a Video and saves it or creates a delta if applicable.
 * @param {user} user - Keystone user with twitter to link to direct-messages
 * @param {video} - A raw Video (video object)
 * @param {callback} - Callback for after processing is complete
 */
Video.process = function(user, video, callback) {
  Video.findOne(video.id, function(err, esVideo) {
    if(err) return callback(err);

    if(esVideo) {

      esVideo.modifyByDelta(function(err){
        if (err) return callback(err);

        var series = [];

        DELTA_FIELDS.forEach(function(fieldName) {

          if(esVideo[fieldName] != video['statistics'][fieldName]) {
            series.push(function(callback) {
              esVideo.createDelta(user, fieldName, video[fieldName], function(err, res) {
                callback(err, res);
              });
            });
          }
        });

        if(series.length) {
          async.series(series, function(err, results) {
            debug('%s Deltas created for Video %s', series.length, video.id);
            callback(err, results);
          });
        } else {
          debug('No deltas created for Video %s', video.id);
          callback();
        }

      });

    } else {
      var newVideo = new Video(video.id);
      newVideo.populateFields(user, video);
      newVideo.create(function(err, res, status) {
        if (err) return callback(err);

        debug("created video %s", newVideo.id);
        callback();
      });
    }
  });
}

/**
 * Creates the Video in Elasticsearch
 */
Video.prototype.create = function(callback) {
  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback);
}


/**
 * Adds appropriate data to Video from a raw Video object.
 * @param {object} rawVideo - A raw tweet from a stream or rest API
 */
Video.prototype.populateFields = function(user, rawVideo) {
  _.extend(this, {
    doc_text: rawVideo.contentDetails.caption,
    cadence_user_id: user.id,
    viewCount: rawVideo.statistics.viewCount,
    likeCount: rawVideo.statistics.likeCount,
    dislikeCount: rawVideo.statistics.dislikeCount,
    favoriteCount: rawVideo.statistics.favoriteCount,
    commentCount: rawVideo.statistics.commentCount,
    timestamp: new Date(rawVideo.snippet.publishedAt)
  });
}

/**
 * Creates a delta for the Video in Elasticsearch
 * @param {string} key - Field name
 * @param {string} value - New value for the field
 * @param {Date} [timestamp=now] - Date/time of the change
 * @param {esCreateCallback} callback
 */
Video.prototype.createDelta = function(user, key, value, timestamp, callback) {
  if (_.isFunction(timestamp)) { // default timestamp
    callback = timestamp;
    timestamp = new Date();
  }

  var body = {
    original_id: this.id,
    timestamp: timestamp,
    cadence_user_id: user.id,
    user_id: user.services.youtube.profileId
  };
  body[key] = value;

  debug("create Video delta %s", this.id);

  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source + '_delta',
    body: body
  }, callback);
}

/**
 * Modify the Video by the latest delta
 * @param {esVideoCallback} callback
 */
Video.prototype.modifyByDelta = function(callback) {
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
              return { exists: { field: _.chain(fieldName).keys().first() } };
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
};

module.exports = Video;
