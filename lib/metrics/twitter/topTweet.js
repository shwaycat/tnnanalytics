var keystone = require('keystone'),
    debug = require('debug')('cadence:metrics:twitter:topTweet'),
    _ = require('underscore'),
    async = require('async'),
    request = require('request'),
    mxm = require('../../../lib/mxm-utils'),
    User = keystone.list('User'),
    Tweet = require('../../../lib/sources/twitter/tweet'),
    twitter = require('twitter');

module.exports = function(user, startTime, endTime, callback) {

  // Build Response Here
  User.model.getAccountRootInfo(user.accountName, function(err, accountRoot) {
    if (err) return callback({'error': err});

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      from: 0,
      size: 1000000000,
      body: {
        "query": {
          "filtered": {
            "query": {
              "term": {
                "doc_type": {
                  "value": "tweet"
                }
              }
            },
            "filter": {
              "and": {
                "filters": [
                  {
                    "range": {
                      "timestamp": {
                        "gte": startTime,
                        "lte": endTime
                      }
                    }
                  },
                  {
                    "term": {
                      "cadence_user_id": accountRoot.id
                    }
                  },
                  {
                    "term": {
                      "user_id": accountRoot.services.twitter.profileId
                    }
                  },
                  {
                    "not": {
                      "filter": {
                        "exists": {
                          "field": "isRetweet"
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      }
    }, function(err, response) {
      if(err) return callback({"error": err});

      var tweets = mxm.objTry(response, 'hits', 'hits');
          scoredTweets = [];
        
        // No Top Tweet for this time period
        if(!tweets || tweets.length == 0) return callback({data:null, oembed:null});

        async.eachSeries(tweets, function(tweet, nextTweet) {
          Tweet.findOne(tweet._id, function(err, tweet) {
            if(err) return nextTweet(err);

            tweet.modifyByDelta(function(err) {
              if (err) return nextTweet(err);

              scoredTweets.push({
                id: tweet.id,
                url: tweet.emailLinkObject(),
                favorite_count: tweet.favorite_count || 0,
                reply_count: tweet.reply_count || 0,
                retweet_count: tweet.retweet_count || 0,
                score: (tweet.favorite_count || 0) + (tweet.reply_count || 0) + (tweet.retweet_count || 0)
              });
              nextTweet();
            });
          });
        }, function(err) {
          if(err) return callback({"error": err});

          var max = {};
          if(!scoredTweets || scoredTweets.length == 0) return callback({"error": 'Error in async?'});

          max = _.max(scoredTweets, function(tweet) { return tweet.score; });

          if(!max) return callback({"error": "Something went way wrong."})

          keystone.elasticsearch.get({
            index: keystone.get('elasticsearch index'),
            type: 'twitter',
            id: max.id
          }, function(err, tweet) {
            if(err) return callback({"error": "Failed in ES.get"});


            if(!tweet._source.oembed) {
              debug("GO GET IT!");
              async.series([
                function(next) {
                  request({
                    url: 'https://api.twitter.com/1/statuses/oembed.json?id=' + tweet._id,
                    json: true
                  }, function (err, response, body) {
                    if(err) return next(err);

                    tweet.oembed = body;
                    next();
                 
                  });

                },
                function(next) {
                  keystone.elasticsearch.update({
                    index: keystone.get('elasticsearch index'),
                    type: 'twitter',
                    id: tweet._id,
                    body: {
                      doc: {
                        oembed: JSON.stringify(tweet.oembed)
                      }
                    }
                  }, function (err, response) {
                    if(err) return next(err);
                    return next();
                  });  
                }
              ], 
              function(err) {
                dataReturn = {
                  data: max,
                  oembed: tweet.oembed
                };

                return callback(dataReturn);

              });
            } else {
              debug("IT WAS CACHED");
              dataReturn = {
                data: max,
                oembed: JSON.parse(tweet._source.oembed)
              }
              return callback(dataReturn);

            }


          });
        });

    });
  });

}