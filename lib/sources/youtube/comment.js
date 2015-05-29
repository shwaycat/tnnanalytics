var util = require("util"),
    _ = require('underscore'),
    async = require('async'),
    debug = require('debug')('cadence:youtube:comment'),
    AbstractType = require("../abstract_type"),
    SOURCE_NAME = 'YouTube',
    DOC_SOURCE = 'youtube',
    DOC_TYPE = 'comment',
    keystone = require('keystone'),
    yt = require('./yt'),
    mxm = require('../../mxm-utils.js'),
    DELTA_FIELDS = [ ];

/**
 * YouTube Comment
 * @class
 * @augments AbstractType
 */
function Comment(id, obj) {
  AbstractType.call(this, SOURCE_NAME, id, obj);
  this.doc_source = DOC_SOURCE;
  this.doc_type = DOC_TYPE;
}

util.inherits(Comment, AbstractType);

/**
 * Get a Comment
 * @param {string} id
 * @param {esCommentCallback} callback
 */
Comment.findOne = function(id, callback) {
  keystone.elasticsearch.get({
    index: keystone.get('elasticsearch index'),
    type: DOC_SOURCE,
    id: id
  }, function(err, res) {
    if (err && !res.found) return callback(null, null);
    if (err) return callback(err);

    callback(null, new Comment(id, res._source));

  });
}

function makeCommentFromHit(hit) {
  var result = new Comment(hit._id, hit._source);
  result.timestamp = new Date(result.timestamp);
  return result;
}

/**
 * Get the latest Comment
 * @param {User} user
 * @param {esCommentCallback} callback
 */
Comment.findLatest = function(user, callback) {
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

    callback(null, makeCommentFromHit(res.hits.hits[0]));
  });
};

/**
 * Pull YouTube Comments
 * @param {User} user - Keystone user to pull from YouTube for
 * @param {esCommentPullCallback} callback
 */
Comment.pull = function(user, callback) {
  debug("pulling comment for user id %s", user.id);
  var commentIDs = [];

  if(user.services.googleplus.youtubeChannelID) {

    var requestOpts = yt.requestOpts(user, 'commentThreads', {
      part: 'snippet,replies',
      allThreadsRelatedToChannelId: user.services.googleplus.youtubeChannelID,
      maxResults: 100,
      fields: 'items(id,replies(comments(id,snippet(channelId,videoId,parentId,textDisplay,authorDisplayName,authorChannelId,publishedAt,updatedAt))),snippet(topLevelComment(id,snippet(channelId,videoId,textDisplay,authorDisplayName,authorChannelId,publishedAt,updatedAt)))),nextPageToken'
    });

    yt.pager('next', requestOpts, function(commentThread, next) {

      Comment.process(user, commentThread.snippet.topLevelComment, function(err) {
        if(err) return next(err);

        if(commentThread.replies) {
          async.eachLimit(commentThread.replies, 5, function(reply, nextReply) {
            debug(reply);

            Comment.process(user, reply, nextReply);
          }, next);
        } else {
          next();
        }
      })

    }, function() {
      debug("Callback for comment pager.");
      callback();
    });


  } else {
    debug('Oops. Channel ID Required.');
    callback();
  }
}

/**
 * Pull ALL YouTube Comment
 * @param {User} user - Keystone user to pull from YouTube for
 * @param {esCommentPullCallback} callback
 */
Comment.pullAll = Comment.pull;

/**
 * The object for building a link to the object (text and href)
 */
Comment.prototype.emailLinkObject = function(opts) {
  return {
    text: this.emailLinkText(),
    href: "http://www.youtube.com/watch?v=" + this.videoID + "&lc=" + (this.parentID || this.id)
  };
}

/*
 * Processes a Comment and saves it or creates a delta if applicable.
 * @param {user} user - Keystone user with twitter to link to direct-messages
 * @param {comment} - A raw Comment (comment object)
 * @param {callback} - Callback for after processing is complete
 */ 
Comment.process = function(user, comment, callback) {
  Comment.findOne(comment.id, function(err, esComment) {
    if(err) return callback(err);

    if(esComment) {
      debug('Comment Exists');
      if(esComment.timestamp.toISOString() != comment.snippet.updatedAt) {
        keystone.elasticsearch.update({
          index: keystone.get('elasticsearch index'),
          type: 'youtube', 
          id: esComment.id,
          body: {
            doc: {
              doc_text: comment.snippet.textDisplay,
              alertState: null,
              isNotified: null,
              timestamp: comment.snippet.updatedAt
            }
          }
        }, function (err, response) {
          if(err) return callback(err);

          debug("Updated comment %s", esComment.id);
          callback();
        });
      } else {
        debug("Ignore duplicate comment");
        callback();
      }


    } else {
      var newComment = new Comment(comment.id);
      newComment.populateFields(user, comment);
      newComment.create(function(err, res, status) {
        if (err) return callback(err);

        debug("created comment %s", newComment.id);
        callback();
      });
    }
  });
}

/**
 * Creates the Comment in Elasticsearch
 */
Comment.prototype.create = function(callback) {
  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback);
}


/**
 * Adds appropriate data to Comment from a raw Comment object.
 * @param {object} rawComment - A raw tweet from a stream or rest API
 */
Comment.prototype.populateFields = function(user, rawComment) {
  _.extend(this, {
    doc_text: rawComment.snippet.textDisplay,
    parentID: rawComment.snippet.parentId,
    videoID: rawComment.snippet.videoId,
    channelID: rawComment.snippet.channelId,
    cadence_user_id: user.id,
    // user_id: rawComment.snippet.authorChannelId.value,
    user_name: rawComment.snippet.authorDisplayName,
    timestamp: new Date(rawComment.snippet.publishedAt)
  });
}

/**
 * Creates a delta for the Comment in Elasticsearch
 * @param {string} key - Field name
 * @param {string} value - New value for the field
 * @param {Date} [timestamp=now] - Date/time of the change
 * @param {esCreateCallback} callback
 */
Comment.prototype.createDelta = function(user, key, value, timestamp, callback) {
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

  debug("create Comment delta %s", this.id);

  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source + '_delta',
    body: body
  }, callback);
}

/**
 * Modify the Comment by the latest delta
 * @param {esCommentCallback} callback
 */
Comment.prototype.modifyByDelta = function(callback) {
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

module.exports = Comment;
