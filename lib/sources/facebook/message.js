var util = require('util'),
    _ = require('underscore'),
    fb = require('./fb'),
    keystone = require('keystone'),
    async = require('async'),
    debug = require('debug')('cadence:facebook:message'),
    AbstractType = require('../abstract_type'),
    SOURCE_NAME = 'Facebook',
    DOC_SOURCE = 'facebook',
    DOC_TYPE = 'message';

/**
 * Facebook Message
 * @class
 * @augments AbstractType
 */
function Message(id, obj) {
  AbstractType.call(this, SOURCE_NAME, id, obj);
  this.doc_source = DOC_SOURCE;
  this.doc_type = DOC_TYPE;
}

util.inherits(Message, AbstractType);

function makeMessageFromHit(hit) {
  var result = new Message(hit._id, hit._source);
  result.timestamp = new Date(result.timestamp);
  return result;
}

/**
 * Get the latest Message
 * @param {User} user
 * @param {esMentionCallback} callback
 */
Message.findLatest = function(user, callback) {
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

    callback(null, makeMessageFromHit(res.hits.hits[0]));
  });
};

/**
 * Pull Facebook Messages
 * @param {User} user
 * @param {function} callback
 */
Message.pull = function(user, callback) {
  var pageID = user.services.facebook.pageID,
      requestOpts;

  Message.findLatest(user, function(err, latestMessage) {
    if (err) return callback(err);

    var sinceVal = Math.floor(latestMessage.timestamp.getTime()/1000);

    fb.getPageAccessToken(user, function(err, pageAccessToken) {
      if (err) return callback(err);

      requestOpts = fb.requestOpts(user, pageID, 'conversations', {
        fields: 'messages.since('+sinceVal+')',
        since: sinceVal,
        access_token: pageAccessToken
      });

      debug("pulling new message for user id %s, page %s", user.id, user.services.facebook.pageID);

      fb.pager('next', requestOpts, function(obj, next) {
        if (!obj) return next('stop');
        if (!obj.messages || !obj.messages.data || obj.messages.data.length == 0) return next();

        async.eachSeries(obj.messages.data, function(msgObj, nextMessage) {
          if (msgObj.from.id == pageID) return nextMessage();

          var message = new Message(msgObj.id, {
                timestamp: new Date(msgObj.created_time),
                cadence_user_id: user.id,
                doc_text: msgObj.message,
                doc_source: DOC_SOURCE,
                user_id: msgObj.from.id,
                user_name: msgObj.from.name
              });

          message.create(function(err, res, status) {
            if (err && status == 409) return nextMessage(null, null);
            if (err) return nextMessage(err);

            debug("created message %s", message.id);
            nextMessage();
          });
        }, next);
      }, callback);
    });
  });
};

/**
 * Pull all available Facebook Messages
 * @param {User} user
 * @param {function} callback
 */
Message.pullAll = function(user, callback) {
  var pageID = user.services.facebook.pageID,
      requestOpts;

  fb.getPageAccessToken(user, function(err, pageAccessToken) {
    if (err) return callback(err);

    requestOpts = fb.requestOpts(user, pageID, 'conversations', {
      fields: 'messages',
      access_token: pageAccessToken
    });

    debug("pulling all messages for user id %s, page %s", user.id, user.services.facebook.pageID);

    fb.pager('next', requestOpts, function(obj, next) {
      if (!obj) return next('stop');
      if (!obj.messages || !obj.messages.data || obj.messages.data.length == 0) return next();

      async.eachSeries(obj.messages.data, function(msgObj, nextMessage) {
        if (msgObj.from.id == pageID) return nextMessage();

        var message = new Message(msgObj.id, {
              timestamp: new Date(msgObj.created_time),
              cadence_user_id: user.id,
              doc_text: msgObj.message,
              user_id: msgObj.from.id,
              user_name: msgObj.from.name
            });

        message.create(function(err, res, status) {
          if (err && status == 409) return nextMessage(null, null);
          if (err) return nextMessage(err);

          debug("created message %s", message.id);
          nextMessage();
        });
      }, next);
    }, callback);
  });
};

/**
 * The object for building a link to the object (text and href)
 */
Message.prototype.emailLinkObject = function(opts) {
  return {
    text: this.emailLinkText(),
    href: 'https://facebook.com/' + opts.user.services.facebook.pageID + '/messages/'
  };
};

/**
 * Creates the Message in Elasticsearch
 */
Message.prototype.create = function(callback) {
  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback);
};

module.exports = Message;
