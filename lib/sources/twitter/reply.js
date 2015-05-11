var util = require("util"),
    _ = require('underscore'),
    twitter = require('twitter'),
    async = require('async'),
    debug = require('debug')('cadence:twitter:replies'),
    Tweet = require('./tweet'),
    keystone = require('keystone'),
    mxm = require('../../mxm-utils.js');

/** 
  Replies are just tweets from our user we can gather. They are not a separate data object.
  As such they only have a pull method because the data is in ES already we just have to tease it out.
  The process works like this:
    - A mention comes in during a normal Mentions pull. We flag it as a reply.
    - We pull replies by going to ES and getting all Mentions which are replies and haven't been replyCounted.
    - Then we pull the in_reply_to_status_id_str and do a status/lookup to request them in bulk groups of 100
    - If the statuses we get back are from our user we check for them in ES and create a delta if they are there.
    - If they aren't in ES we add them in.
 **/

function Reply() {
  debug('Go get some Replies!');
}


/**
 * Pull All Twitter Replies
 * These are just tweets so they get processed as such.
 * @param {User} user - Keystone user to pull from Twitter fro
 * @param {esTweetPullCallback} callback
 */
Reply.pull = function(user, callback) {
  return Reply.pullAll(user, callback);
}

Reply.pullAll = function(user, callback) {
  debug("pulling replies for user id %s", user.id);

  var total = 0;

  async.doWhilst(
    function(cb) {
      getReplies(user, function(err, response) {
        if(err) return cb(err);
          
        var replies = mxm.objTry(response, 'hits', 'hits'),
            replySources = _.pluck(replies, '_source'),
            replyIDs = _.pluck(replySources, 'in_reply_to_status_id_str').toString();

            debug("%j", replyIDs);

debug("RESPONSE: HITS: TOTAL: %s", response.hits.total);
debug("CONTAINS: ", _.contains(replyIDs, null));

        total = response.hits.total;
        if(!_.contains(replyIDs, null) && total != 0) {
          var client = new twitter({
            consumer_key: process.env.TWITTER_API_KEY,
            consumer_secret: process.env.TWITTER_API_SECRET,
            access_token_key: user.services.twitter.accessToken,
            access_token_secret: user.services.twitter.refreshToken
          });

          client.get('statuses/lookup', {id: replyIDs}, function(err, tweets) {
            if(err && err[0]['code'] == 88) {
              debug('Rate limit exceeded for Replies');
              setTimeout(cb, 20*60*1000);
            } else {
              if(err) return cb(err);

              if (tweets.length == 0) {
                debug("No tweets found.");
                return cb();
              }

              var limit = 5;
              debug("%s Tweets Found", tweets.length);
              if(tweets.length < 5) {
                limit = tweets.length;
              }

              async.eachLimit(tweets, limit, function(tweet, next) {
                if(tweet.user.id_str == user.services.twitter.profileId) {
                  processReply(user, tweet, next);
                } else {
                  return next();
                }
              }, function(err) {
                if(err) return cb(err);

                total = response.hits.total;              
                bulkUpdate(replies, function(err, response) {
                  if(err) return cb(err);
                  debug('%s Replies Processed', replies.length);
                  return setTimeout(cb, 1000);
                });
              });
            }
          });
        } else {
          return cb();
        }
      });
    },
    function() {
      return total;
    },
    callback);
}

function bulkUpdate(docs, callback) {
  var bulkUpdates = [];

  for(i=0;i<docs.length;i++) {
    doc = docs[i];

    bulkUpdates.push({ 
        update: {
          _index: keystone.get('elasticsearch index'),
          _type: doc._type,
          _id: doc._id
        }
      },
      {
        doc: {
          replyCounted: true
        }
      });
  }

  keystone.elasticsearch.bulk({
    body: bulkUpdates
  }, function(err, response) {
    if (err) return callback(err);
    
    callback();
  });
}

function getReplies(user, page, size, callback) {

  if(_.isFunction(page) || _.isFunction(size)) {
    callback = page;
    page = 1;
    size = 100;
  }

  var from = page * size;

  keystone.elasticsearch.search({
    index: keystone.get('elasticsearch index'),
    size: size,
    from: (page-1) * size,
    type: "twitter",
    body: {
      "query": {
        "filtered": {
          "filter": {
            "and": {
              "filters": [
                {
                  "not": {
                    "filter": {
                      "exists": {
                        "field": "replyCounted"
                      }
                    }
                  }
                },
                {
                  "exists": {
                    "field": "in_reply_to_status_id_str"
                  }
                },
                {
                  "term": {
                    "doc_type": "mention"
                  }
                },
                {
                  "term": {
                    "cadence_user_id": user.id
                  }
                }
              ]
            }
          }
        }
      }
    }
  }, callback);
}

function processReply(user, originalTweet, callback) {
  debug("Processing Reply for %s", originalTweet.id_str);
  Tweet.findOne(originalTweet.id_str, function(err, tweet) {
    if (err) return callback(err);
    if (tweet) {
      debug("Found Tweet");
      tweet.modifyByDelta(function(err, tweet) {
        if(err) return callback(err);

        reply_count = tweet.reply_count;
        if(!reply_count) {
          reply_count = 1;
        } else {
          reply_count++;
        }
        debug('Reply Delta Created for Tweet %s', originalTweet.id);
        tweet.createDelta(user, 'reply_count', reply_count, new Date(), callback);
      });
    } else {
      debug("Make a New One");
      tweet = new Tweet(originalTweet.id_str, originalTweet);
      tweet.populateFields(user, tweet);
      tweet.create(function(err, res, status) {
        if (err) return callback(err);

        debug("created tweet %s", tweet.id);
        processReply(user, originalTweet, callback);
      });

    }
  });
}

module.exports = Reply;
