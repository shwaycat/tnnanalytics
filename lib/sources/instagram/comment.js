var util = require("util"),
    _ = require('underscore'),
    async = require('async'),
    debug = require('debug')('cadence:instagram:comments'),
    AbstractType = require("../abstract_type"),
    SOURCE_NAME = 'Instagram',
    DOC_SOURCE = 'instagram',
    DOC_TYPE = 'comment',
    keystone = require('keystone'),
    insta = require('./insta'),
    mxm = require('../../mxm-utils.js');

/**
 * Instagram Comment
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

/**
 * Pull Instagram Comments
 * @param {User} user - Keystone user to pull from Instagram for
 * @param {esCommentPullCallback} callback
 */
Comment.pull = function(user, media, callback) {
  debug("pulling media for user id %s", user.id);
  var requestOpts = insta.requestOpts(user, 'media/'+media.id+'/comments');

    insta.request(requestOpts, function(err, body) {
      if (err) return callback(err);
      var comments = body.data;
      async.eachLimit(comments, 5, function(comment, next) {
        Comment.process(user, media, comment, next);
      }, callback);
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
}

Comment.process = function(user, media, comment, callback) {
  Comment.findOne(comment.id, function(err, esComment) {
    // ignore any we have already logged because editing isn't possible on instagram
    if(!esComment) {
      var newComment = new Comment(comment.id);
      newComment.populateFields(user, media, comment);
      newComment.create(function(err, res, status) {
        if (err) return callback(err);

        debug("created comment %s", newComment.id);
        callback();
      });
    } else {
      debug("ignored duplicate comment %s", comment.id);
      callback();
    }

  });



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
}

/**
 * Adds appropriate data to Comment from a raw Comment object.
 * @param {object} rawComment - A raw tweet from a stream or rest API
 */
Comment.prototype.populateFields = function(user, media, rawComment) {
  _.extend(this, {
    doc_text: rawComment.text,
    user_id: rawComment.from.id,
    user_name: rawComment.from.username,
    cadence_user_id: user.id,
    url: media.link,
    timestamp: new Date(rawComment.created_time * 1000)
  });
}

module.exports = Comment;
