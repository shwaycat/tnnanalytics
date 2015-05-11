var util = require("util"),
    _ = require('underscore'),
    twitter = require('twitter'),
    async = require('async'),
    debug = require('debug')('cadence:twitter:tweets'),
    AbstractType = require("../abstract_type"),
    SOURCE_NAME = 'Twitter',
    DOC_SOURCE = 'twitter',
    DOC_TYPE = 'tweet',
    DELTA_FIELDS = [ 'retweet_count', 'favorite_count', 'reply_count' ],
    keystone = require('keystone'),
    mxm = require('../../mxm-utils.js');

/**
 * Twitter Tweet
 * @class
 * @augments AbstractType
 */
function Tweet(id, obj) {
  AbstractType.call(this, "Twitter", id, obj);
  this.doc_source = DOC_SOURCE;
  this.doc_type = DOC_TYPE;
}

util.inherits(Tweet, AbstractType);

/**
 * Get a Tweet
 * @param {string} id
 * @param {esTweetCallback} callback
 */
Tweet.findOne = function(id, callback) {
  keystone.elasticsearch.get({
    index: keystone.get('elasticsearch index'),
    type: DOC_SOURCE,
    id: id
  }, function(err, res) {
    if (err && !res.found) return callback(null, null);
    if (err) return callback(err);

    callback(null, new Tweet(id, res._source));

  });
}

/**
 * Pull One Twitter Tweet By ID
 * @param {User} user - Keystone user to pull from Twitter for
 * @param {esTweetPullCallback} callback
 */
Tweet.pullOne = function(user, tweet_id_str, callback) {
  debug("pulling one tweet %s", tweet_id_str);
  var client = new twitter({
      consumer_key: process.env.TWITTER_API_KEY,
      consumer_secret: process.env.TWITTER_API_SECRET,
      access_token_key: user.services.twitter.accessToken,
      access_token_secret: user.services.twitter.refreshToken
    }),
    params = {
      id: tweet_id_str
    };

  client.get('statuses/show', params, function(err, tweet) {
    if (err) return callback(err);

    var newTweet = new Tweet(tweet.id_str);

    newTweet.populateFields(user, tweet);
    newTweet.create(function(err, res, status) {
      if (err) return callback(err);

      debug("created tweet %s", newTweet.id);
      callback();
    });
  });
}

/**
 * Pull Twitter Tweets
 * @param {User} user - Keystone user to pull from Twitter fro
 * @param {esTweetPullCallback} callback
 */
Tweet.pull = function(user, maxID, callback) {
  debug("pulling tweets for user id %s", user.id);

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
      params = {
        count: 200,
        include_rts: 1
      };

  // We've made a query already, let's not get anything before that DM
  if (user.services.twitter.tweetSinceID && user.services.twitter.tweetSinceID != '' ) {
    params.since_id = user.services.twitter.tweetSinceID;
  }

  if(maxID) {
    params.max_id = maxID;
    delete params.since_id;
  }

  client.get('statuses/user_timeline', params, function(err, tweets, response) {
    if (err) {
      console.error("Error loading user timeline");
      return callback(err);
    }
    if (tweets.length == 0) {
      debug("No tweets found.");
      return callback();
    }

    debug('%s tweets for user %s', tweets.length, user.id);

    async.eachLimit(tweets, 5, function(tweet, next) {
      Tweet.process(user, tweet, next);
    }, function(err) {
      if (err) {
        return callback(err);
      } else {
        if(params.since_id) {       
          debug("updating tweetSinceId for %s to %s", user.id, tweets[0].id_str);
          user.set('services.twitter.tweetSinceID', tweets[0].id_str);
          user.save(function(err) {
            if(err) return callback(err);
            return callback(null, tweets);          
          });
        } else {
          return callback(null, tweets);
        }
      }
    }); //end eachLimit
  }); //end client.get
}

Tweet.pullAll = function(user, callback) {
  var maxID = null;
  debug("pulling ALL tweets for user id %s", user.id);

  async.doWhilst(
    function(cb) {
      Tweet.pull(user, maxID, function(err, tweets) {
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
 */
Tweet.prototype.emailLinkObject = function(opts) {
  return {
    text: this.emailLinkText(),
    href: 'http://twitter.com/' + this.user_name + '/status/' + this.id
  };
}

/**
 * Processes a Tweet and saves it or creates a delta if applicable.
 * @param {user} user - Keystone user with twitter to link to direct-messages
 * @param {tweet} - A raw Tweet (tweet object)
 * @param {callback} - Callback for after processing is complete
 */
Tweet.process = function(user, tweet, callback) {
  Tweet.findOne(tweet.id_str, function(err, foundTweet) {
    if(err) return callback(err);

    if(foundTweet) {

      foundTweet.modifyByDelta(function(err){
        if (err) return callback(err);

        var series = [];
        DELTA_FIELDS.forEach(function(fieldName) {

          if(foundTweet[fieldName] != tweet[fieldName]) {
            series.push(function(callback) {
              foundTweet.createDelta(fieldName, tweet[fieldName], function(err, res) {
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
      var outgoingTweet = new Tweet(tweet.id_str);
      outgoingTweet.populateFields(user, tweet);
      outgoingTweet.create(function(err, res, status) {
        if (err) return callback(err);

        debug("created tweet %s", outgoingTweet.id);
        callback();
      });
    }
  });
}

/**
 * Creates the Tweet in Elasticsearch
 */
Tweet.prototype.create = function(callback) {
  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback);
}

/**
 * Adds appropriate data to Tweet from a raw Tweet object.
 * @param {object} rawTweet - A raw tweet from a stream or rest API
 */
Tweet.prototype.populateFields = function(user, rawTweet) {

  if(rawTweet.retweeted_status) {
    this.isRetweet = true;
  }

  _.extend(this, {
    doc_text: rawTweet.text,
    user_id: rawTweet.user.id_str,
    user_name: rawTweet.user.screen_name,
    user_lang: rawTweet.user.lang,
    cadence_user_id: user.id,
    favorite_count: rawTweet.favorite_count,
    retweet_count: rawTweet.retweet_count,
    timestamp: new Date(rawTweet.created_at)
  });
}

/**
 * Creates a delta for the Tweet in Elasticsearch
 * @param {string} key - Field name
 * @param {string} value - New value for the field
 * @param {Date} [timestamp=now] - Date/time of the change
 * @param {esCreateCallback} callback
 */
Tweet.prototype.createDelta = function(key, value, timestamp, callback) {
  if (_.isFunction(timestamp)) { // default timestamp
    callback = timestamp;
    timestamp = new Date();
  }

  var body = {
    original_id: this.id,
    timestamp: timestamp
  };
  body[key] = value;

  debug("create tweet delta %s", this.id);

  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source + '_delta',
    body: body
  }, callback);
}

/**
 * Modify the Tweet by the latest delta
 * @param {esTweetCallback} callback
 */
Tweet.prototype.modifyByDelta = function(callback) {
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
};

module.exports = Tweet;
