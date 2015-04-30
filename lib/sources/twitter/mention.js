var util = require("util"),
    _ = require('underscore'),
    twitter = require('twitter'),
    async = require('async'),
    debug = require('debug')('twitter:mention'),
    AbstractType = require("../abstract_type"),
    SOURCE_NAME = 'Twitter',
    DOC_SOURCE = 'twitter',
    DOC_TYPE = 'mention',
    DELTA_FIELDS = [ 'retweets', 'favorites' ],
    keystone = require('keystone');

/**
 * Twitter Mention
 * @class
 * @param {String} id - Twitter status ID, Elasticsearch mention ID
 * @param {Object} obj - Mention properties
 * @param {String} obj.user_name
 * @param {Number} obj.retweets
 * @param {Number} obj.favorites
 * @augments AbstractType
 */
function Mention(id, obj) {
  AbstractType.call(this, SOURCE_NAME, id, obj);
  this.doc_source = DOC_SOURCE;
  this.doc_type = DOC_TYPE;
}

util.inherits(Mention, AbstractType);

/**
 * Callback from Elasticsearch which provides a Mention object.
 * @callback esMentionCallback
 * @param {Error} error
 * @param {Mention} mention
 */

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
    if (err) return callback(err);

    callback(null, new Mention(id, res._source))
  });
}

/**
 * Get a Mention, modified by the latest delta
 * @param {string} id
 * @param {esMentionCallback} callback
 */
Mention.findOneWithDelta = function(id, callback) {
  Mention.findOne(id, function(err, mention) {
    if (err) return callback(err);

    mention.modifyByDelta(callback);
  });
};

/**
 * Callback after Mentions are pulled.
 * @callback esMentionPullCallback
 * @param {Error} error
 * @see http://mongoosejs.com/docs/api.html#promise_Promise
 */

/**
 * Pull Twitter Mentions
 * @param {User} user - Keystone user to pull from Twitter fro
 * @param {esMentionPullCallback} callback
 */
Mention.pull = function(user, maxID, callback) {
  debug("pulling for user id %s", user.id);

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
      params = { count: 200, include_rts: 1 };

  // We've made a query already, let's not get anything before that tweet
  if (user.services.twitter.mentionSinceId && user.services.twitter.mentionSinceId != '') {
    params.since_id = user.services.twitter.mentionSinceId;
  }

  if(maxID) {
    params.max_id = maxID;
    delete params.since_id;
  }

  client.get('statuses/mentions_timeline', params, function(err, tweets, response) {
    if (err) {
      console.error("Error loading mentions timeline");
      return callback(err);
    }
    if (tweets.length == 0) {
      debug("No mentions found.");
      return callback();
    }

    debug('%s mentions for user %s', tweets.length, user.id);

    async.eachLimit(tweets, 5, function(tweet, next) {
      var mention = new Mention(tweet.id_str);
      _.extend(mention, {
        doc_text: tweet.text,
        user_id: tweet.user.id_str,
        user_name: tweet.user.screen_name,
        user_lang: tweet.user.lang,
        cadence_user_id: user.id,
        in_reply_to_status_id_str: tweet.in_reply_to_status_id_str,
        time_stamp: tweet.created_at
      });
      mention.create(function(err, res) {
        if (err) {
          if(res.status == 409) {
            next(null, res);
          } else {
            next(err);
          }
        } else {
          debug("created mention %s", mention.id);

          // findOneWithDelta(RETWEETED ID_STR)
          // CHECK RETWEET TOTAL
          // CREATE DELTA IF NECESSARY


          next();
        }
      })
    }, function(err) {
      if (err) {
        return callback(err);
      } else {
        if(!user.services.twitter.mentionSinceId || user.services.twitter.mentionSinceId < tweets[0].id_str) {
          debug("updating mentionSinceId for %s to %s", user.id, tweets[0].id_str);
          user.set('services.twitter.mentionSinceId', tweets[0].id_str);
          user.save(function(err) {
            if(err) {
              return callback(err);
            } else {
              return callback(null, tweets);
            }
          });
        } else {
          callback(null, tweets);
        }
      }
    })
  })
}

Mention.pullAll = function(user, callback) {
  var maxID = null;
  debug("pulling ALL mentions for user id %s", user.id);

  async.doWhilst(
    function(cb) {
      Mention.pull(user, maxID, function(err, tweets) {
        if(err) return cb(err);

        plucked = _.pluck(tweets, 'id');
        minimum = _.min(plucked);

        if(maxID == minimum) {
          maxID = null;
        } else {
          maxID = minimum;
        }
        cb();
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
 * @param {Object} [opts] - unused
 */
Mention.prototype.emailLinkObject = function(opts) {
  return {
    text: this.emailLinkText(),
    href: 'https://twitter.com/' + this.user_name + '/status/' + this.id
  };
}

/**
 * Creates the Mention in Elasticsearch
 * @param {esCreateCallback} [callback]
 */
Mention.prototype.create = function(callback) {
  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback);
}

/**
 * Creates a delta for the Mention in Elasticsearch
 * @param {string} key - Field name
 * @param {string} value - New value for the field
 * @param {Date} [timestamp=now] - Date/time of the change
 * @param {esCreateCallback} callback
 */
Mention.prototype.createDelta = function(key, value, timestamp, callback) {
  if (_.isFunction(timestamp)) { // default timestamp
    callback = timestamp;
    timestamp = new Date();
  }

  var body = {
    original_id: this.id,
    timestamp: timestamp
  };
  body[key] = value;

  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source + '_delta',
    body: body
  }, callback);
}

/**
 * Modify the Mention by the latest delta
 * @param {esMentionCallback} callback
 */
Mention.prototype.modifyByDelta = function(callback) {
  var self = this;

  keystone.elasticsearch.search({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source + '_delta',
    body: {
      filter: {
        term: { original_id: this.id }
      },
      aggregations: {
        deltas: {
          filters: {
            filters: _.map(DELTA_FIELDS, function(fieldName) {
              return { exists: { field: fieldName } };
            })
          }
        },
        aggregations: {
          last_delta: {
            top_hits: {
              sort: [
                { timestamp: { order: 'desc' } }
              ],
              size: 1
            }
          }
        }
      }
    }
  }, function(err, res) {
    if (err) return callback(err);

    DELTA_FIELDS.forEach(function(fieldName, i) {
      var delta = res.aggregations.deltas.buckets[i].last_delta.hits.hits[0];
      self[fieldName] = delta._source[fieldName];
    });

    callback(null, self);
  });
}

module.exports = Mention
