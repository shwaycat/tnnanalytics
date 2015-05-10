var util = require("util"),
    _ = require('underscore'),
    twitter = require('twitter'),
    async = require('async'),
    debug = require('debug')('cadence:twitter:mention'),
    AbstractType = require("../abstract_type"),
    SOURCE_NAME = 'Twitter',
    DOC_SOURCE = 'twitter',
    DOC_TYPE = 'mention',
    DELTA_FIELDS = [],
    keystone = require('keystone'),
    Tweet = require('./tweet'),
    Country = keystone.list('Country');

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
    if (err && !res.found) return callback(null, null);
    if (err) return callback(err);

    callback(null, new Mention(id, res._source))
  });
}

/**
 * Pull Twitter Mentions
 * @param {User} user - Keystone user to pull from Twitter fro
 * @param {esMentionPullCallback} callback
 */
Mention.pull = function(user, maxID, callback) {
  debug("pulling mentions for user id %s", user.id);

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

  if(maxID) {
    params.max_id = maxID;
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

    async.eachSeries(tweets, function(tweet, next) {

      Mention.process(user, tweet, next);

    }, function(err) {
      if (err) {
        return callback(err);
      } else {
        callback(null, tweets);
      }
    }); //end eachLimit
  }); //end client.get
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
 * Processes a Mention and saves it if applicable.
 * @param {user} user - Keystone user with twitter to link to direct-messages
 * @param {mention} - A raw Mention (tweet object)
 * @param {callback} - Callback for after processing is complete
 */
Mention.process = function(user, mention, callback) {
  Mention.findOne(mention.id_str, function(err, foundMention) {
    if (err) return callback(err);

    if(foundMention) {
      foundMention.modifyByDelta(function(err) {
        if (err) return callback(err);

        debug("duplicate mention %s", foundMention.id);
        var series = [];
        DELTA_FIELDS.forEach(function(fieldName) {
          if(foundMention[fieldName] != mention[fieldName]) {
            series.push(function(callback) {
              foundMention.createDelta(fieldName, mention[fieldName], function(err, res) {
                callback(err, res);
              });
            });
          }
        });

        if(series.length) {
          async.series(series, function(err, results) {
            callback(err, results);
          });

        } else {
          callback();
        }
      });
    } else {
      var newMention = new Mention(mention.id_str);
      newMention.populateFields(user, mention, function(err) {
        if(err) return callback(err);

        newMention.create(function(err, res) {
          if (err) return callback(err);

          debug("created mention %s", newMention.id);
          callback();
        });
      });
    }
  });
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

function processReply(user, rawReply, callback) {
  Tweet.findOne(rawReply.in_reply_to_status_id_str, function(err, tweet) {
    if (err) return callback(err);
    if (tweet) {
      tweet.modifyByDelta(function(err, tweet) {
        if(err) return callback(err);

        reply_count = tweet.reply_count;
        if(!reply_count) {
          reply_count = 1;
        } else {
          reply_count++;
        }
        tweet.createDelta('reply_count', reply_count, new Date(rawReply.created_at), callback);
      });
    } else {
      Tweet.pullOne(user, rawReply.in_reply_to_status_id_str, function(err) {
        if (err && err[0] && _.contains([144, 179], err[0].code)) {
          console.warn("Unable to get tweet %s: %j", rawReply.in_reply_to_status_id_str, err[0]);
          return callback();
        }
        if (err) return callback(err);

        processReply(user, rawReply, callback);
      });
    }
  });
}

/**
 * Adds appropriate data to Mention from a raw Mention object.
 * @param {object} rawMention - A raw mention from a stream or rest API
 */
Mention.prototype.populateFields = function(user, rawMention, callback) {
  var self = this;

  if(rawMention.in_reply_to_status_id_str) {
    processReply(user, rawMention, function(err) {
      if (err) callback(err);
      actuallyPopulateFields(user, self, rawMention);

      if (!self.location) return callback();

      Country.model.findByPoint(self.location, function(err, country) {
        if (err) return callback(err);
        if (country) {
          self.country = country.code;
        }
        callback();
      });
    });
  } else {
    actuallyPopulateFields(user, self, rawMention);

    if (!self.location) return callback();

    Country.model.findByPoint(self.location, function(err, country) {
      if (err) return callback(err);
      if (country) {
        self.country = country.code;
      }
      callback();
    });
  }
};

function actuallyPopulateFields(user, mention, rawMention) {
  var location = {};

  if(rawMention.coordinates) {
    location.lon = rawMention.coordinates.coordinates[0];
    location.lat = rawMention.coordinates.coordinates[1];
  } else {
    location = null;
  }
  _.extend(mention, {
    doc_text: rawMention.text,
    user_id: rawMention.user.id_str,
    user_name: rawMention.user.screen_name,
    user_lang: rawMention.user.lang,
    cadence_user_id: user.id,
    location: location,
    timestamp: new Date(rawMention.created_at)
  });
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
      query: {
        filtered: {
          filter: {
            term: { original_id: this.id }
          }
        }
      },
      aggregations: {
        deltas: {
          filters: {
            filters: _.map(DELTA_FIELDS, function(fieldName) {
              return { exists: { field: fieldName } };
            })
          },
          aggregations: {
            last_delta: {
              top_hits: {
                sort: [
                  { _timestamp: { order: 'desc' } }
                ],
                size: 1
              }
            }
          }
        }
      }
    }
  }, function(err, res) {
    if (err) return callback(err);

    DELTA_FIELDS.forEach(function(fieldName, i) {
      var delta = res.aggregations.deltas.buckets[i].last_delta.hits.hits[0];
      if(delta) {
        self[fieldName] = delta._source[fieldName];
      }
    });

    callback(null, self);
  });
}

module.exports = Mention
