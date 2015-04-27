var util = require("util"),
    _ = require('underscore'),
    twitter = require('twitter'),
    async = require('async'),
    debug = require('debug')('twitter:tweets'),
    AbstractType = require("../abstract_type"),
    keystone = require('keystone');

/**
 * Twitter Tweet
 * @class
 * @augments AbstractType
 */
function Tweet(id, obj) {
  AbstractType.call(this, "Twitter", id, obj);
  this.doc_source = "twitter";
  this.doc_type = "tweet";
  if (this.user_handle) {
    this.user_name = this.user_handle;
  }
}

util.inherits(Tweet, AbstractType);

/**
 * Pull Twitter Tweets
 */
Tweet.pull = function(user, callback) {
  debug("pulling for user id %s", user.id);

  var client = new twitter({
        consumer_key: process.env.TWITTER_API_KEY,
        consumer_secret: process.env.TWITTER_API_SECRET,
        access_token_key: user.services.twitter.accessToken,
        access_token_secret: user.services.twitter.refreshToken
      }),
      params = { count: 200, include_rts: 1 };

  // We've made a query already, let's not get anything before that tweet
  if (user.services.twitter.tweet_sinceId && user.services.twitter.tweet_sinceId != '') {
    params.since_id = user.services.twitter.tweet_sinceId;
  }

  client.get('statuses/mentions_timeline', params, function(err, tweets, response) {
    if (err) {
      console.error("Error loading mentions timeline");
      return callback(err);
    }
    if (tweets.length == 0) {
      return callback();
    }

    debug('%s tweets for user %s', tweets.length, user.id);

    async.eachLimit(tweets, 5, function(tweet, next) {
      var mention = new Tweet(tweet.id_str);
      _.extend(mention, {
        doc_text: tweet.text,
        user_id: tweet.user.id_str,
        user_name: tweet.user.screen_name,
        user_lang: tweet.user.lang,
        cadence_user_id: user.id,
        time_stamp: tweet.created_at
      });
      mention.create(function(err, res) {
        if (err) {
          //TODO test for and ignore duplicate creation
          next(err);
        } else {
          debug("created mention %s", mention.id);
          next();
        }
      })
    }, function(err) {
      if (err) {
        return callback(err);
      } else {
        debug("updating sinceId for %s to %s", user.id, tweets[0].id_str);
        user.set('services.twitter.sinceId', tweets[0].id_str);
        user.save(callback);
      }
    })
  })
}

/**
 * The object for building a link to the object (text and href)
 */
Tweet.prototype.emailLinkObject = function(opts) {
  return {
    text: this.emailLinkText(),
    href: 'https://twitter.com/' + this.user_name + '/status/' + this.id
  };
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

module.exports = Tweet
