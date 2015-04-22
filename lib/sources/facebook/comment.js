var util = require("util")
   , _ = require('underscore')
   , request = require('request')
   , async = require('async')
   , debug = require('debug')('facebook:comment')
   , AbstractType = require("../abstract_type")

/**
 * Facebook Comment
 * @class
 * @augments AbstractType
 */
function Comment(id, obj) {
  AbstractType.call(this, "Facebook", id, obj)
  this.doc_source = "facebook"
  this.doc_type = "post"
}

util.inherits(Comment, AbstractType)

/**
 * Pull Facebook Posts
 */
Comment.pull = function(user, callback) {
  debug("pulling for user id %s", user.id)
}

/**
 * The object for building a link to the object (text and href)
 */
Comment.prototype.emailLinkObject = function(opts) {
  var idParts = this.id.split("_")
  return {
    text: this.emailLinkText(),
    href: 'https://www.facebook.com/permalink.php?story_fbid=' + idParts[0]+ '&id=' + this.root_id + '&comment_id=' + idParts[1]
  }
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
  }, callback)
}

module.exports = Comment
