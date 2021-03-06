var util = require('util')
  , _ = require('underscore')
  , keystone = require('keystone')
  , User = keystone.list('User')

/**
 * AbstractType for defining types of data objects for sources
 * @class
 *
 * Attributes:
 * - doc_source: 'twitter',
 * - doc_type: 'mention',
 * - doc_text: tweet.text,
 * - user_id: tweet.user.id_str,
 * - user_handle: tweet.user.screen_name,
 * - user_lang: tweet.user.lang,
 * - cadence_user_id: user.id,
 * - isNotified: null,
 */
function AbstractType(sourceName, id, obj) {
  if (obj) {
    _.extend(this, obj);
  }
  this.id = id
  this.sourceName = sourceName
}

/**
 * The timestamp formatted for the locale
 * @returns {String}
 */
AbstractType.prototype.timestampStr = function() {
  if(this.timestamp) {
    return (new Date(this.timestamp)).toLocaleString()
  } else {
    return ""
  }
}

/**
 * The email link text
 * @returns {String}
 */
AbstractType.prototype.emailLinkText = function() {
  return util.format("%s: @%s: %s - %s", this.sourceName, this.user_name, this.doc_text,
                     this.timestampStr())
}

/**
 * The object for building a link to the object (text and href)
 * @abstract
 * @returns {Object} object with text and href
 */
AbstractType.prototype.emailLinkObject = function(opts) {
  throw new Error('must be implemented by subclass');
}

/**
 * Callback run after a documented is created in Elasticsearch.
 * @callback esCreateCallback
 * @param {Error} error
 * @param {object} response
 * @see http://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-create
 */

/**
 * Creates the Mention in Elasticsearch
 * @abstract
 * @param {esCreateCallback} callback
 */
AbstractType.prototype.create = function(callback) {
  throw new Error('must be implemented by subclass');
}
// AbstractType.prototype.create = function(callback) {
//   keystone.elasticsearch.create({
//     index: keystone.get('elasticsearch index'),
//     type: this.doc_source,
//     id: this.id,
//     body: _.omit(this, "id")
//   }, callback)
// }


// AbstractType.prototype.findUser(callback) {
//   if (this.cadence_user_id) {
//     User.model.findById(this.cadence_user_id).exec(callback)
//   } else {
//     callback(new Error("no cadence_user_id"))
//   }
// }

module.exports = AbstractType
