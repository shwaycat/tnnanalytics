var util = require("util")
  , _ = require('underscore')
  , async = require('async')

/**
 * @namespace
 * @prop {Tweet} direct_message - Tweet constructor
 * @prop {Mention} mention - Mention constructor
 * @prop {DirectMessage} direct_message - DirectMessage constructor
 */
module.exports = {
  tweet: require('./twitter/tweet.js'),
  mention: require('./twitter/mention'),
  direct_message: require('./twitter/direct_message')
}
