var util = require('util'),
    _ = require('underscore'),
    gplus = require('./gplus'),
    keystone = require('keystone'),
    async = require('async'),
    debug = require('debug')('cadence:googleplus:comment'),
    AbstractType = require('../abstract_type'),
    SOURCE_NAME = 'GooglePlus',
    DOC_SOURCE = 'googleplus',
    DOC_TYPE = 'comment',
    DELTA_FIELDS = [ ];

var request = require('request');


/**
 * GooglePlus Comment
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

    callback(null, makeCommentFromHit(res));
  });
}

function makeCommentFromHit(hit) {
  var result = new Comment(hit._id, hit._source);
  result.timestamp = new Date(result.timestamp);
  return result;
}

/**
 * Pull GooglePlus Comment
 * @param {User} user
 * @param {function} callback
 */
Comment.pull = function(user, callback) {
  var requestOpts = gplus.requestOpts(user, 'people', user.services.google.profileId, 'activities', 'public', {
    maxResults: 100
  });

  debug("pulling comments for user id %s", user.id);


  gplus.pager('next', requestOpts, function(comment, next) {
    // debug("%j", comment);

    Comment.process(user, comment, next);
  }, callback);

};



// alias
Comment.pullAll = function(user, callback) { console.log('pull all???'); callback(); } //Comment.pull;

/**
 * Adds appropriate data to Comment from a raw comment object.
 * @param {object} user
 */
Comment.prototype.populateFields = function(user, comment) {
  _.extend(this, {
    user_id: user.services.google.profileId,
    user_name: user.services.google.username,
    cadence_user_id: user.id,
    replies: comment.object.replies.totalItems,
    plusoners: comment.object.plusoners.totalItems,
    resharers: comment.object.resharers.totalItems,
    timestamp: new Date()
  });
}

Comment.process = function(user, comment, callback) {
  Comment.findOne(comment.id, function(err, esComment) {
    if (err) return callback(err);

    if(esComment) {
      debug('duplicate comment');
      callback();

    } else {
      var newComment = new Comment(comment.id);
      newComment.populateFields(user, comment);
      newComment.create(function(err) {
        if (err) return callback(err);

        debug("created G+ comment %s", newComment.id);
        callback();
      });
    }
  });
}



/**
 * The object for building a link to the object (text and href)
 */
Comment.prototype.emailLinkObject = function(opts) {
  return {
    text: this.emailLinkText(),
    href: 'http://plus.google.com/' + opts.user.services.google.profileId
  };
};

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
};

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
    user_id: user.services.google.profileId
  };
  body[key] = value;

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

module.exports = Comment;
