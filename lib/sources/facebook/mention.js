var util = require('util'),
    _ = require('underscore'),
    fb = require('./fb'),
    keystone = require('keystone'),
    debug = require('debug')('cadence:facebook:mention'),
    AbstractType = require('../abstract_type'),
    SOURCE_NAME = 'Facebook',
    DOC_SOURCE = 'facebook',
    DOC_TYPE = 'mention';

/**
 * Facebook Mention
 * @class
 * @augments AbstractType
 */
function Mention(id, obj) {
  AbstractType.call(this, SOURCE_NAME, id, obj);
  this.doc_source = DOC_SOURCE;
  this.doc_type = DOC_TYPE;
}

util.inherits(Mention, AbstractType);

/**
 * Get a Mention
 * @param {string} id
 * @param {esMentionCallback} callback
 */
Mention.findOne = function(id, callback) {
  keystone.elasticsearch.get({
    index: keystone.get('elasticsearch index'),
    type: DOC_SOURCE,
    id: id
  }, function(err, res) {
    if (err && !res.found) return callback(null, null);
    if (err) return callback(err);

    callback(null, new Mention(id, res._source));
  });
};

function makeMentionFromHit(hit) {
  var result = new Mention(hit._id, hit._source);
  result.timestamp = new Date(result.timestamp);
  return result;
}

/**
 * Get the latest Mention
 * @param {User} user
 * @param {esMentionCallback} callback
 */
Mention.findLatest = function(user, callback) {
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

    callback(null, makeMentionFromHit(res.hits.hits[0]));
  });
};

/**
 * Pull Facebook Mentions
 * @param {User} user
 * @param {function} callback
 */
Mention.pull = function(user, callback) {
  var pageID = user.services.facebook.pageID,
      requestOpts;

  Mention.findLatest(user, function(err, latestMention) {
    if (err) return callback(err);

    requestOpts = fb.requestOpts(user, pageID, 'tagged', {
      fields: 'message,created_time,from',
      since: Math.floor(latestMention.timestamp.getTime()/1000)
    });

    debug("pulling new mentions for user id %s, page %s", user.id, user.services.facebook.pageID);

    fb.pager('next', requestOpts, function(obj, next) {
      if (!obj) return next('stop');

      var mention = new Mention(obj.id, {
            timestamp: new Date(obj.created_time),
            cadence_user_id: user.id,
            doc_text: obj.message,
            doc_source: DOC_SOURCE,
            user_id: obj.from.id,
            user_name: obj.from.name
          });

      mention.create(function(err, res, status) {
        if (err && status == 409) return next(null, null);
        if (err) return next(err);

        debug("created mention %s", mention.id);
        next();
      });
    }, callback);
  });
};

/**
 * Pull all available Facebook Mentions
 * @param {User} user
 * @param {function} callback
 */
Mention.pullAll = function(user, callback) {
  var pageID = user.services.facebook.pageID,
      requestOpts = fb.requestOpts(user, pageID, 'tagged', {
        fields: 'message,created_time,from'
      });

  debug("pulling all mentions for user id %s, page %s", user.id, user.services.facebook.pageID);

  fb.pager('next', requestOpts, function(obj, next) {
    if (!obj) return next('stop');

    var mention = new Mention(obj.id, {
          timestamp: new Date(obj.created_time),
          cadence_user_id: user.id,
          doc_text: obj.message,
          user_id: obj.from.id,
          user_name: obj.from.name
        });

    mention.create(function(err, res, status) {
      if (err && status == 409) return next(null, null);
      if (err) return next(err);

      debug("created mention %s", mention.id);
      next();
    });
  }, callback);
};

/**
 * The object for building a link to the object (text and href)
 * @returns {Object} object with text and href
 */
Mention.prototype.emailLinkObject = function() {
  return {
    text: this.emailLinkText(),
    href: 'https://www.facebook.com/' + this.id
  };
};

/**
 * Creates the Mention in Elasticsearch
 * @param {esCreateCallback} callback
 */
Mention.prototype.create = function(callback) {
  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback);
};

module.exports = Mention;
