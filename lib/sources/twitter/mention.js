var util = require("util")
   , _ = require('underscore')
   , twitter = require('twitter')
   , async = require('async')
   , debug = require('debug')('twitter:mention')
   , AbstractType = require("../abstract_type")

/**
 * Twitter Mention
 * @class
 * @augments AbstractType
 */
function Mention(id, obj) {
  AbstractType.call(this, "Twitter", id, obj)
  this.doc_source = "twitter"
  this.doc_type = "mention"
  if (this.user_handle) {
    this.user_name = this.user_handle
  }
}

util.inherits(Mention, AbstractType)

/**
 * Pull Twitter Mentions
 */
Mention.pull = function(user, callback) {
  debug("pulling for user id %s", user.id)

  var client = new twitter({
        consumer_key: process.env.TWITTER_API_KEY
      , consumer_secret: process.env.TWITTER_API_SECRET
      , access_token_key: user.services.twitter.accessToken
      , access_token_secret: user.services.twitter.refreshToken
      })
    , params = { count: 200, include_rts: 1, since_id: null }

  // We've made a query already, let's not get anything before that tweet
  if (user.services.twitter.sinceId && user.services.twitter.sinceId != '') {
    params.since_id = user.services.twitter.sinceId;
  }

  client.get('statuses/mentions_timeline', params, function(err, tweets, response) {
    if (err) {
      console.error("Error loading mentions timeline")
      return callback(err)
    }
    if (tweets.length == 0) {
      return callback()
    }

    debug('%s tweets for user %s', tweets.length, user.id)

    async.eachLimit(tweets, 5, function(tweet, next) {
      var mention = new Mention(tweet.id_str)
      _.extend(mention, {
        doc_text: tweet.text,
        user_id: tweet.user.id_str,
        user_name: tweet.user.screen_name,
        user_lang: tweet.user.lang,
        cadence_user_id: user.id,
        time_stamp: tweet.created_at
      })
      mention.create(function(err, res) {
        if (err) {
          //TODO test for and ignore duplicate creation
          next(err)
        } else {
          debug("created mention %s", mention.id)
          next()
        }
      })
    }, function(err) {
      if (err) {
        return callback(err)
      } else {
        debug("updating sinceId for %s to %s", user.id, tweets[0].id_str)
        user.set('services.twitter.sinceId', tweets[0].id_str)
        user.save(callback)
      }
    })
  })
}

/**
 * The object for building a link to the object (text and href)
 */
Mention.prototype.emailLinkObject = function(opts) {
  return {
    text: this.emailLinkText(),
    href: 'https://twitter.com/' + this.user_name + '/status/' + this.id
  }
}

/**
 * Creates the Mention in Elasticsearch
 */
Mention.prototype.create = function(callback) {
  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback)
}

module.exports = Mention
