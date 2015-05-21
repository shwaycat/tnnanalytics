var util = require("util"),
    _ = require('underscore'),
    twitter = require('twitter'),
    async = require('async'),
    debug = require('debug')('cadence:twitter:direct_message'),
    AbstractType = require("../abstract_type"),
    SOURCE_NAME = 'Twitter',
    DOC_SOURCE = 'twitter',
    DOC_TYPE = 'direct_message',
    DELTA_FIELDS = [],
    keystone = require('keystone');

/**
 * Twitter Direct-Message
 * @class
 * @augments AbstractType
 */
function DirectMessage(id, obj) {
  AbstractType.call(this, "Twitter", id, obj);
  this.doc_source = DOC_SOURCE;
  this.doc_type = DOC_TYPE;
}

util.inherits(DirectMessage, AbstractType);

/**
 * Get a DirectMessage
 * @param {string} id
 * @param {esDirectMessageCallback} callback
 */
DirectMessage.findOne = function(id, callback) {
  keystone.elasticsearch.get({
    index: keystone.get('elasticsearch index'),
    type: DOC_SOURCE,
    id: id
  }, function(err, res) {
    if (err && !res.found) return callback(null, null);
    if (err) return callback(err);

    callback(null, new DirectMessage(id, res._source))
  });
}

DirectMessage.pull = function(user, maxID, callback) {
  debug("pulling Direct Messags for user id %s", user.id);

  if (_.isFunction(maxID)) {
    callback = maxID;
    maxID = undefined;
  }

  var client = new twitter({
        consumer_key: process.env.TWITTER_API_KEY,
        consumer_secret: process.env.TWITTER_API_SECRET,
        access_token_key: user.services.twitter.accessToken,
        access_token_secret: user.services.twitter.refreshToken
      }),
      params = {count: 200, include_entities: 0};

  // We've made a query already, let's not get anything before that DM
  if (user.services.twitter.direct_messageSinceID && user.services.twitter.direct_messageSinceID != '' ) {
    params.since_id = user.services.twitter.direct_messageSinceID;
  }

  if(maxID) {
    params.max_id = maxID;
    delete params.since_id;
  }

  client.get('direct_messages', params, function(err, messages, response) {
    if(err && err[0]['code'] == 88) {
      debug('Rate limit exceeded for Direct Messages');
      setTimeout(cb, 20*60*1000);
    } else {
      if (err) {
        console.error("Error pulling direct-messages");
        return callback(err);
      }
      if (messages.length == 0) {
        debug("No Direct Messages found.");
        return callback();
      }

      debug('%s direct-messages for user %s', messages.length, user.id);

      async.eachLimit(messages, 5, function(message, next) {
        DirectMessage.process(user, message, next);
      }, function(err) {
        if (err) {
          return callback(err)
        } else {
          debug("updating direct_messageSinceId for %s to %s", user.id, messages[0].id_str);
          user.set('services.twitter.direct_messageSinceID', messages[0].id_str);
          user.save(function(err) {
            if(err) return callback(err);
            return callback(null, messages);          
          });
        }
      });
    }
  });
}

/**
 * Pull direct messages from Twitter
 * @param {User} user - Keystone user to pull from Twitter fro
 * @param {esDirectMessagePullCallback} callback
 */
DirectMessage.pullAll = function(user, callback){
  var maxID = null;
  debug("pulling ALL Direct Messages for user id %s", user.id);

  async.doWhilst(
    function(cb) {
      DirectMessage.pull(user, maxID, function(err, tweets) {

        if(err && err[0]['code'] == 88) {
          debug('Rate limit exceeded for Direct Messages');
          setTimeout(cb, 20*60*1000);
        } else {
          if(err) return cb(err);

          plucked = _.pluck(tweets, 'id');
          minimum = _.min(plucked);

          if(maxID == minimum) {
            maxID = null;
          } else {
            maxID = minimum;
          }
          cb();
        }
      });
    },
    function() {
      return maxID;
    },
    callback
  );
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
 * Processes a DirectMessage and saves it if applicable.
 * @param {user} user - Keystone user with twitter to link to direct-messages
 * @param {message} - A raw DirectMessage
 * @param {callback} - Callback for after processing is complete
 */
DirectMessage.process = function(user, message, callback) {
  DirectMessage.findOne(message.id_str, function(err, foundMessage) {
    if (err) return callback(err);

    if(foundMessage) {
      debug("duplicate direct_message %s", foundMessage.id);
      callback();
    } else {
      var directMessage = new DirectMessage(message.id_str);
      directMessage.populateFields(user, message);
      directMessage.create(function(err, res) {
        if (err) return callback(err);

        debug("created direct message %s", directMessage.id);
        callback();
      });
    }
  });
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

/**
 * Adds appropriate data to DirectMessage from a raw DirectMessage object.
 * @param {object} rawMessage - A raw direct message from a stream or rest API
 */
DirectMessage.prototype.populateFields = function(user, rawMessage) {
  _.extend(this, {
    doc_text: rawMessage.text,
    user_id: rawMessage.sender.id_str,
    user_name: rawMessage.sender.screen_name,
    user_lang: rawMessage.sender.lang,
    cadence_user_id: user.id,
    timestamp: new Date(rawMessage.created_at)
  });
}
module.exports = DirectMessage
