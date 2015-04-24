var util = require("util"),
    _ = require('underscore'),
    twitter = require('twitter'),
    async = require('async'),
    debug = require('debug')('twitter:followers'),
    AbstractType = require("../abstract_type"),
    SOURCE_NAME = 'Twitter',
    DOC_SOURCE = 'twitter',
    DOC_TYPE = 'followerCount',
    DELTA_FIELDS = [ 'followers' ],
    keystone = require('keystone');

/**
 * Twitter Tweet
 * @class
 * @augments AbstractType
 */
function FollowerCount(id, obj) {
  AbstractType.call(this, "Twitter", id, obj);
  this.doc_source = DOC_SOURCE;
  this.doc_type = DOC_TYPE;
}

util.inherits(FollowerCount, AbstractType);

/**
 * Get a FollowerCount
 * @param {string} id
 * @param {esTweetCallback} callback
 */
FollowerCount.findOne = function(id, callback) {
  keystone.elasticsearch.get({
    index: keystone.get('elasticsearch index'),
    type: DOC_SOURCE,
    id: id
  }, function(err, res) {
    if (err) return callback(err);

    callback(null, new FollowerCount(id, res._source))
  });
}

/**
 * Get a FollowerCount, modified by the latest delta
 * @param {string} id
 * @param {esTweetCallback} callback
 */
FollowerCount.findOneWithDelta = function(id, callback) {
  Tweet.findOne(id, function(err, followerCount) {
    if (err) return callback(err);

    mention.modifyByDelta(callback);
  });
};


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

  // We've made a query already, let's not get anything before that tweet
  if (user.services.twitter.tweetSinceId && user.services.twitter.tweetSinceId != '') {
    params.since_id = user.services.twitter.tweetSinceId;
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
      var outgoingTweet = new Tweet(tweet.id_str);
      _.extend(outgoingTweet, {
        doc_text: tweet.text,
        user_id: tweet.user.id_str,
        user_name: tweet.user.screen_name,
        user_lang: tweet.user.lang,
        cadence_user_id: user.id,
        timestamp: new Date(tweet.created_at)
      });
      outgoingTweet.create(function(err, res) {
        if (err) {
          //TODO test for and ignore duplicate creation
          console.log(res.status);
          console.log(typeof err);
          if(res.status == 409) {
            next(null, res);
          } else {
            next(err);
          }
        } else {
          debug("created tweet %s", outgoingTweet.id);
          next();
        }
      })
    }, function(err) {
      if (err) {
        return callback(err);
      } else {

        if (!user.services.twitter.tweetSinceId || user.services.twitter.tweetSinceId < tweets[0].id_str) {
          debug("updating tweetSinceId for %s to %s", user.id, tweets[0].id_str);
          user.set('services.twitter.tweetSinceId', tweets[0].id_str);
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
