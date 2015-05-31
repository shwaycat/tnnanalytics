var util = require('util'),
    async = require('async'),
    _ = require('underscore'),
    fb = require('./fb'),
    keystone = require('keystone'),
    debug = require('debug')('cadence:facebook:comment'),
    AbstractType = require("../abstract_type"),
    Post = require('./post'),
    SOURCE_NAME = 'Facebook',
    DOC_SOURCE = 'facebook',
    DOC_TYPE = 'comment';

/**
 * Facebook Comment
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
};

/**
 * Pull all available Facebook Comments
 * @param {User} user
 * @param {function} callback
 */
Comment.pullAll = function(user, callback) {
  debug("pulling all comments for user id %s, page %s", user.id, user.services.facebook.pageID);

  Post.eachBatch(user, function(posts, nextBatch) {
    async.eachSeries(posts, function(post, nextPost) {
      debug("pulling comments for post %s", post.id);

      var requestOpts = fb.requestOpts(user, post.id, 'comments', {
            fields: 'message,created_time,from',
            filter: 'stream'
          });

      fb.pager('next', requestOpts, function(obj, next) {
        if (!obj) return next('stop');

        if (!obj.from) {
          obj.from = { id: "unknown", name: "Unknown" };
        }

        var comment = new Comment(obj.id, {
              timestamp: new Date(obj.created_time),
              cadence_user_id: user.id,
              doc_text: obj.message,
              doc_source: DOC_SOURCE,
              user_id: obj.from.id,
              user_name: obj.from.name
            });

        comment.create(function(err, res, status) {
          if (err && status == 409) return next(null, null);
          if (err) return next(err);

          debug("created post comment %s", comment.id);
          next();
        });
      }, nextPost);
    }, nextBatch);
  }, callback);
};

// alias
Comment.pull = Comment.pullAll;

/**
 * The object for building a link to the object (text and href)
 * @returns {Object} object with text and href
 */
Comment.prototype.emailLinkObject = function() {
  return {
    text: this.emailLinkText(),
    href: 'https://www.facebook.com/' + this.postID() + '?comment_id=' + this.commentID()
  };
};

/**
 * Creates the Comment in Elasticsearch
 * @param {esCreateCallback} callback
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
 * Get the Facebook Post ID.
 * @returns {String} Facebook Post ID
 */
Comment.prototype.postID = function() {
  return this.id.split("_")[0];
};

/**
 * Get the Facebook Comment ID without the Post ID prefix.
 * @returns {String} Facebook Comment ID
 */
Comment.prototype.commentID = function() {
  return this.id.split("_")[1];
};

module.exports = Comment;
