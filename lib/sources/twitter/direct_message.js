var util = require("util"),
    _ = require('underscore'),
    twitter = require('twitter'),
    async = require('async'),
    debug = require('debug')('twitter:direct_message'),
    AbstractType = require("../abstract_type"),
    keystone = require('keystone');

/**
 * Twitter Direct-Message
 * @class
 * @augments AbstractType
 */
function DirectMessage(id, obj) {
  AbstractType.call(this, "Twitter", id, obj);
  this.doc_source = "twitter";
  this.doc_type = "direct_message";
}

util.inherits(DirectMessage, AbstractType);

/**
 * Pull direct messages from Twitter
 */
DirectMessage.pull = function(user, callback) {
  debug("pulling for user id %s", user.id);

  var client = new twitter({
        consumer_key: process.env.TWITTER_API_KEY,
        consumer_secret: process.env.TWITTER_API_SECRET,
        access_token_key: user.services.twitter.accessToken,
        access_token_secret: user.services.twitter.refreshToken
      }),
      params = {count: 200, include_entities: 0};

  // We've made a query already, let's not get anything before that DM
  if (user.services.twitter.dmSinceId && user.services.twitter.dmSinceId != '' ) {
    params.since_id = user.services.twitter.dmSinceId;
  }

  client.get('direct_messages', params, function(err, messages, response) {
  // client.get('statuses/mentions_timeline', params, function(err, tweets, response) {
    if (err) {
      console.error("Error pulling direct-messages");
      return callback(err);
    }
    if (messages.length == 0) {
      return callback();
    }

    debug('%s direct-messages for user %s', messages.length, user.id);

    async.eachLimit(messages, 5, function(message, next) {
      var directMessage = new DirectMessage(message.id_str);
      _.extend(directMessage, {
        doc_text: message.text,
        user_id: message.sender.id_str,
        user_name: message.sender.screen_name,
        user_lang: message.sender.lang,
        cadence_user_id: user.id,
        time_stamp: message.created_at
      });

      directMessage.create(function(err, res) {

        if (err) {
          if(res.status == 409) {
            console.log('DUPLICATES');
            next(null, res);
          } else {
            next(err);
          }
        } else {
          debug("created direct message %s", directMessage.id);
          next();
        }
      });
    }, function(err) {
      if (err) {
        return callback(err)
      } else {
        debug("updating dmSinceId for %s to %s", user.id, messages[0].id_str);
        user.set('services.twitter.dmSinceId', messages[0].id_str);
        user.save(callback);
      }
    })
  })
}

/**
 * The object for building a link to the object (text and href)
 * @param {Object} opts - options
 * @param {User} opts.user - Keystone user with twitter to link to direct-messages
 */
DirectMessage.prototype.emailLinkObject = function(opts) {
  return {
    text: this.emailLinkText(),
    href: 'https://twitter.com/'+ opts.user.services.twitter.username
  };
}

/**
 * Creates the DM in Elasticsearch
 */
DirectMessage.prototype.create = function(callback) {
  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback);
}

module.exports = DirectMessage
