var util = require('util'),
    _ = require('underscore'),
    gplus = require('./gplus'),
    keystone = require('keystone'),
    async = require('async'),
    debug = require('debug')('cadence:googleplus:comment'),
    AbstractType = require('../abstract_type'),
    SOURCE_NAME = 'Google+',
    DOC_SOURCE = 'googleplus',
    DOC_TYPE = 'comment',
    DELTA_FIELDS = [ ],
    mxm = require('../../mxm-utils.js');

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
  var page = 1,
      size = 100;

  debug("pulling comments for user id %s", user.id);

  async.doWhilst(
    function(cb) {
      getPosts(user, page, size, function(err, response) {
        if(err) return cb(err);
          
        var esPosts = mxm.objTry(response, 'hits', 'hits'),
            postIDs = _.pluck(esPosts, '_id');
        
        debug('Get comments for posts: %j', postIDs);


        total = response.hits.total;
        if(!_.contains(postIDs, null) && postIDs.length && total != 0) {
          // activities/z121crqzurnigjbvm23qth0qennjwfetn/comments?

          async.eachLimit(postIDs, 10, function(postID, nextPost) {
            var requestOpts = gplus.requestOpts(user, 'activities', postID, 'comments', {
              maxResults: 500
            });

            debug('Get comments for %s ', postID);
            
            gplus.pager('next', requestOpts, function(comment, nextComment) {
              Comment.process(user, comment, nextComment);
            }, nextPost);


          }, function() {
            total = response.hits.total;

            return cb();
          });


        } else {
          return cb();
        }

      });
    },
    function() {
      if(total > size*(page+1)) {
        page++;
      } else {
        total = 0;
      }
      return total;
    },
    callback);



  // gplus.pager('next', requestOpts, function(comment, next) {
  //   // debug("%j", comment);

  //   Comment.process(user, comment, next);
  // }, callback);

};



// alias
Comment.pullAll = Comment.pull;

function getPosts(user, page, size, callback) {

  if(_.isFunction(page) || _.isFunction(size)) {
    callback = page;
    page = 1;
    size = 100;
  }

  var from = page * size;

  keystone.elasticsearch.search({
    index: keystone.get('elasticsearch index'),
    size: size,
    from: (page-1) * size,
    type: DOC_SOURCE,
    body: {
      "query": {
        "filtered": {
          "filter": {
            "and": {
              "filters": [
                {
                  "term": {
                    "doc_type": "post"
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
        }
      }
    }
  }, callback);
}

/**
 * Adds appropriate data to Comment from a raw comment object.
 * @param {object} user
 */
Comment.prototype.populateFields = function(user, comment) {
  _.extend(this, {
    doc_text: comment.object.content,
    user_id: comment.actor.id,
    user_name: comment.actor.displayName,
    url: comment.inReplyTo[0].url,
    cadence_user_id: user.id,
    timestamp: new Date(comment.published)
  });
}

Comment.process = function(user, comment, callback) {
  Comment.findOne(comment.id, function(err, esComment) {
    if (err) return callback(err);

    if(esComment) {
      debug('duplicate comment');

      if(esComment.timestamp.toISOString() != comment.updated) {
        keystone.elasticsearch.update({
          index: keystone.get('elasticsearch index'),
          type: 'googleplus', 
          id: esComment.id,
          body: {
            doc: {
              doc_text: comment.object.content,
              alertState: null,
              isNotified: null,
              timestamp: comment.updated
            }
          }
        }, function (err, response) {
          if(err) return callback(err);

          debug("Updated comment %s", esComment.id);
          callback();
        });

      } else {
        callback();
      }

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
    href: this.url
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
