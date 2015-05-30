var util = require('util'),
    _ = require('underscore'),
    gplus = require('./gplus'),
    keystone = require('keystone'),
    async = require('async'),
    debug = require('debug')('cadence:googleplus:post'),
    AbstractType = require('../abstract_type'),
    SOURCE_NAME = 'Google+',
    DOC_SOURCE = 'googleplus',
    DOC_TYPE = 'post',
    DELTA_FIELDS = [ 'replies', 'plusoners', 'resharers' ];

var request = require('request');


/**
 * GooglePlus Post
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

    callback(null, makePostFromHit(res));
  });
}

function makePostFromHit(hit) {
  var result = new Post(hit._id, hit._source);
  result.timestamp = new Date(result.timestamp);
  return result;
}

/**
 * Pull Instgram Post
 * @param {User} user
 * @param {function} callback
 */
Post.pull = function(user, callback) {
  var requestOpts = gplus.requestOpts(user, 'people', 'me', 'activities', 'public', {
    maxResults: 100
  });

  debug("pulling posts for user id %s", user.id);


  gplus.pager('next', requestOpts, function(post, next) {
    // debug("%j", post);

    Post.process(user, post, next);
  }, callback);

};



// alias
Post.pullAll = Post.pull;

/**
 * Adds appropriate data to Post from a raw post object.
 * @param {object} rawInstgramUser - A raw youtube user from a stream or rest API
 */
Post.prototype.populateFields = function(user, post) {
  _.extend(this, {
    doc_text: post.object.content,
    user_id: post.actor.id,
    user_name: post.actor.displayName,
    cadence_user_id: user.id,
    replies: post.object.replies.totalItems,
    plusoners: post.object.plusoners.totalItems,
    resharers: post.object.resharers.totalItems,
    url: post.url,
    timestamp: new Date(post.published)
  });
}

Post.process = function(user, post, callback) {
  Post.findOne(post.id, function(err, esPost) {
    if (err) return callback(err);

    if(esPost) {
      esPost.modifyByDelta(function(err) {
        if (err) return callback(err);

        async.eachSeries(DELTA_FIELDS, function(fieldName, nextField) {
          if(post['object'][fieldName]['totalItems'] != esPost[fieldName]) {
            esPost.createDelta(user, fieldName, post['object'][fieldName]['totalItems'], function(err, res){
              if(err) return nextField(err);
              debug('Delta created for %s', fieldName);
              return nextField(null, res);
            });
          } else {
            return nextField();
          }
        }, callback);
      });

    } else {
      var newPost = new Post(post.id);
      newPost.populateFields(user, post);
      newPost.create(function(err) {
        if (err) return callback(err);

        debug("created G+ post %s", newPost.id);
        callback();
      });
    }
  });
}



/**
 * The object for building a link to the object (text and href)
 */
Post.prototype.emailLinkObject = function(opts) {
  return {
    text: this.emailLinkText(),
    href: this.url
  };
};

/**
 * Creates the Post in Elasticsearch
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
 * Creates a delta for the Post in Elasticsearch
 * @param {string} key - Field name
 * @param {string} value - New value for the field
 * @param {Date} [timestamp=now] - Date/time of the change
 * @param {esCreateCallback} callback
 */
Post.prototype.createDelta = function(user, key, value, timestamp, callback) {
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

module.exports = Post;
