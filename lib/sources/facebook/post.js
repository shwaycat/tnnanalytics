var util = require('util'),
    async = require('async'),
    _ = require('underscore'),
    fb = require('./fb'),
    keystone = require('keystone'),
    debug = require('debug')('cadence:facebook:post'),
    AbstractType = require('../abstract_type'),
    mxm = require('../../mxm-utils.js'),
    SOURCE_NAME = 'Facebook',
    DOC_SOURCE = 'facebook',
    DOC_TYPE = 'post',
    DELTA_FIELDS = [ 'likes', 'shares' ],
    DELTA_BULK_CREATE_ACTION = {
      create: {
        _index: keystone.get('elasticsearch index'),
        _type: DOC_SOURCE + '_delta'
      }
    };

/**
 * Facebook Post
 * @class
 * @augments AbstractType
 */
function Post(id, obj) {
  AbstractType.call(this, SOURCE_NAME, id, obj);
  this.doc_source = DOC_SOURCE;
  this.doc_type = DOC_TYPE;
}

util.inherits(Post, AbstractType);

/**
 * Get a Post
 * @param {string} id
 * @param {esPostCallback} callback
 */
Post.findOne = function(id, callback) {
  keystone.elasticsearch.get({
    index: keystone.get('elasticsearch index'),
    type: DOC_SOURCE,
    id: id
  }, function(err, res) {
    if (err && !res.found) return callback(null, null);
    if (err) return callback(err);

    callback(null, new Post(id, res._source));
  });
};

function makePostFromHit(hit) {
  var result = new Post(hit._id, hit._source);
  result.timestamp = new Date(result.timestamp);
  return result;
}

/**
 * Get the latest Post
 * @param {User} user
 * @param {esPostCallback} callback
 */
Post.findLatest = function(user, callback) {
  keystone.elasticsearch.search({
    index: keystone.get('elasticsearch index'),
    type: DOC_SOURCE,
    body: {
      "query": {
        "filtered": {
          "filter": {
            "and": [
              {
                "term": { "doc_type": DOC_TYPE }
              },
              {
                "term": { "cadence_user_id": user.id }
              }
            ]
          }
        }
      },
      "size": 1,
      "sort": [
        { "timestamp": "desc" }
      ]
    }
  }, function(err, res) {
    if (err) return callback(err);
    if (res.hits.hits.length != 1) return callback(null, null);

    callback(null, makePostFromHit(res.hits.hits[0]));
  });
};

/**
 * Get all the Post IDs and iterate over each one
 * @param {User} user
 * @param {function} iterator - fn(posts, nextCallback)
 * @param {function} callback - fn(err)
 */
Post.eachBatch = function(user, iterator, callback) {
  var fromIndex = 0;

  async.doWhilst(
    function(next) {
      keystone.elasticsearch.search({
        index: keystone.get('elasticsearch index'),
        type: DOC_SOURCE,
        body: {
          "query": {
            "filtered": {
              "filter": {
                "and": [
                  {
                    "term": { "doc_type": DOC_TYPE }
                  },
                  {
                    "term": { "cadence_user_id": user.id }
                  }
                ]
              }
            }
          },
          "size": 100,
          "from": fromIndex
        }
      }, function(err, res) {
        if (err) return next(err);

        if (fromIndex + res.hits.hits.length >= res.hits.total) {
          fromIndex = false;
        } else {
          fromIndex += res.hits.hits.length;
        }

        iterator(_.map(res.hits.hits, makePostFromHit), next);
      });
    },
    function() {
      return fromIndex;
    },
    callback
  );
};

/**
 * Create a body for a Post delta bulk create
 * @param {string} key - Field name
 * @param {string} value - New value for the field
 * @param {Date} [timestamp=now] - Date/time of the change
 * @return {Object} bulk create body
 */
Post.prototype.deltaBody = function(key, value, timestamp) {
  var body = {
        original_id: this.id,
        cadence_user_id: this.cadence_user_id,
        timestamp: timestamp,
        doc_type: DOC_TYPE
      };

  if (!body.timestamp) { // default timestamp
    body.timestamp = new Date();
  }

  if ('object' == typeof value) {
    _.extend(body, value);
  } else {
    body[key] = value;
  }

  return body;
};

/**
 * Creates a delta for the Post in Elasticsearch
 * @param {string} key - Field name
 * @param {string} value - New value for the field
 * @param {Date} [timestamp=now] - Date/time of the change
 * @param {esCreateCallback} callback
 */
Post.prototype.createDelta = function(key, value, timestamp, callback) {
  if (_.isFunction(timestamp)) { // default timestamp
    callback = timestamp;
    timestamp = new Date();
  }

  var body = {
        original_id: this.id,
        timestamp: timestamp,
        cadence_user_id: this.cadence_user_id
      };
  body[key] = value;
  body['doc_source'] = DOC_SOURCE;

  debug("create post delta %s", this.id);

  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source + '_delta',
    body: body
  }, callback);
};

/**
 * Pull Facebook Posts
 * @param {User} user
 * @param {function} callback
 */
Post.pull = function(user, callback) {
  var pageID = user.services.facebook.pageID,
      requestOpts;

  debug("pulling new posts for user id %s, page %s", user.id, pageID);

  async.series([
    function(done) {
      Post.findLatest(user, function(err, latestPost) {
        if (err) return callback(err);

        var opts = { fields: 'message,created_time,shares,likes.summary(true).limit(0)' };

        if (latestPost) {
          opts.since = Math.floor(latestPost.timestamp.getTime()/1000);
        }

        requestOpts = fb.requestOpts(user, pageID, 'posts', opts);

        fb.pager('next', requestOpts, function(obj, next) {
          if (!obj) return next('stop');

          var post = new Post(obj.id, {
                timestamp: new Date(obj.created_time),
                cadence_user_id: user.id,
                doc_text: obj.message,
                doc_source: DOC_SOURCE,
                likes: 0,
                shares: 0
              });

          if (obj.likes && obj.likes.summary) {
            post.likes = obj.likes.summary.total_count;
          }

          if (obj.shares) {
            post.shares = obj.shares.count;
          }

          post.create(function(err, res, status) {
            if (err && status == 409) return next(null, null);
            if (err) return next(err);

            debug("created post %s", post.id);
            next();
          });
        }, done);
      });
    },
    function(done) {
      requestOpts = fb.requestOpts(user, pageID, 'posts', {
        fields: 'shares,likes.summary(true).limit(0)',
        limit: 250
      });

      var bulkUpdater = new mxm.ElasticsearchBulkManager(100, DELTA_BULK_CREATE_ACTION);

      fb.request(requestOpts, function(err, body) {
        if(err) return done(err);

        async.eachSeries(body.data, function(data, next) {
          if (!data.shares && !data.likes.summary.total_count) return next();

          Post.findOne(data.id, function(err, post) {
            if (err) return next(err);

            post.modifyByDelta(function(err, post) {
              if (err) return next(err);

              if (data.shares && data.shares.count && data.shares.count != post.shares) {
                var sharesNew = data.shares.count - post.shares;
                if (sharesNew && sharesNew > 0) {
                  bulkUpdater.addSource(post.deltaBody('shares', sharesNew));
                }
              }

              if (data.likes && data.likes.summary && data.likes.summary.total_count &&
                  data.likes.summary.total_count != post.likes) {
                var likesNew = data.likes.summary.total_count - post.likes;
                if (likesNew && likesNew > 0) {
                  bulkUpdater.addSource(post.deltaBody('likes', likesNew));
                }
              }

              bulkUpdater.flushIfFull(next);
            });
          });
        }, function(err) {
          if (err) return done(err);
          bulkUpdater.flush(done);
        });
      });
    }
  ], callback);
};

/**
 * Pull all available Facebook Posts
 * @param {User} user
 * @param {function} callback
 */
Post.pullAll = function(user, callback) {
  var pageID = user.services.facebook.pageID,
      requestOpts = fb.requestOpts(user, pageID, 'posts', {
        fields: 'message,created_time,shares,likes.summary(true).limit(0)'
      });

  debug("pulling all posts for user id %s, page %s", user.id, user.services.facebook.pageID);

  fb.pager('next', requestOpts, function(obj, next) {
    if (!obj) return next('stop');

    var post = new Post(obj.id, {
          timestamp: new Date(obj.created_time),
          cadence_user_id: user.id,
          doc_text: obj.message,
          likes: 0,
          shares: 0
        });

    if (obj.likes && obj.likes.summary) {
      post.likes = obj.likes.summary.total_count;
    }

    if (obj.shares) {
      post.shares = obj.shares.count;
    }

    post.create(function(err, res, status) {
      if (err && status == 409) return next(null, null);
      if (err) return next(err);

      debug("created post %s", post.id);
      next();
    });
  }, function(err) {
    if (err) console.error(err);
    callback(err);
  });
};

/**
 * The object for building a link to the object (text and href)
 * @returns {Object} object with text and href
 */
Post.prototype.emailLinkObject = function() {
  var idParts = this.id.split('_');
  return {
    text: this.emailLinkText(),
    href: 'https://www.facebook.com/' + idParts[0] + '/posts/' + idParts[1]
  };
};

/**
 * The object for building a link to the object (text and href)
 * @returns {Object} object with text and href
 */
Post.prototype.embedURL = function() {
  return 'https://www.facebook.com/' + this.pageID() + '/posts/' + this.postID();
};

/**
 * Get the Facebook Page ID.
 * @returns {String} Facebook Page ID
 */
Post.prototype.pageID = function() {
  return this.id.split("_")[0];
};

/**
 * Get the Facebook Post ID without the Page ID prefix.
 * @returns {String} Facebook Post ID
 */
Post.prototype.postID = function() {
  return this.id.split("_")[1];
};

/**
 * Creates the Post in Elasticsearch
 * @param {esCreateCallback} callback
 */
Post.prototype.create = function(callback) {
  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback);
};

/**
 * Modify the Post by the latest delta
 * @param {esPostCallback} callback
 */
Post.prototype.modifyByDelta = function(callback) {
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
      aggregations: _.reduce(DELTA_FIELDS, function(aggs, fieldName) {
        aggs[fieldName] = { sum: { field: fieldName } };
        return aggs;
      }, {})
    }
  }, function(err, res) {
    if (err) return callback(err);

    _.each(DELTA_FIELDS, function(fieldName) {
      self[fieldName] += res.aggregations[fieldName].value;
    });

    callback(null, self);
  });
};

/**
 * Calculate the score (likes + shares)
 * @return {integer} score
 */
Post.prototype.score = function() {
  return (this.likes || 0) + (this.shares || 0);
};

module.exports = Post;
