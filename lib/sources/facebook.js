var util = require("util")
  , _ = require('underscore')
  , AbstractType = require("./abstract")

/**
 * @namespace
 * @prop {Message} message - Message constructor
 * @prop {Post} post - Post constructor
 * @prop {Comment} comment - Comment constructor
 */
module.exports = {
  message: require('./facebook/message'),
  post: require('./facebook/post'),
  comment: require('./facebook/comment')
}
