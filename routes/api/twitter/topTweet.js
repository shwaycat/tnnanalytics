var keystone = require('keystone'),
    _ = require('underscore'),
    async = require('async'),
    debug = require('debug')("cadence:api:twitter:topTweet"),
    request = require('request'),
    mxm = require('../../../lib/mxm-utils');
    Tweet = require('../../../lib/sources/twitter/tweet'),
    twitter = require('twitter');


exports = module.exports = function(req, res) {
 
  var view = new keystone.View(req, res),
      locals = res.locals;
  
  var dataReturn = [];
  endTime = new Date();
  startTime = new Date();
  startTime.setDate(endTime.getDate() - 30);

  if(req.query.startTime) {
    startTime = new Date(req.query.startTime);
  }
  if(req.query.endTime) {
    endTime = new Date(req.query.endTime);
  }


  // Build Response Here

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
                      "gte": "0",
                      "lte": "now"
                    }
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
    if(err) return res.apiResponse({"error": err});

    var tweets = mxm.objTry(response, 'hits', 'hits');
        scoredTweets = [];
      
      if(!tweets || tweets.length == 0) return res.apiResponse({"error": "Error with ES search results."});

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
        if(err) return res.apiResponse({"error": err});

        var max = {};
        if(!scoredTweets || scoredTweets.length == 0) return res.apiResponse({"error": 'Error in async?'});

        max = _.max(scoredTweets, function(tweet) { return tweet.score; });

        if(!max) return res.apiResponse({"error": "Something went way wrong."})
          keystone.elasticsearch.get({
            index: keystone.get('elasticsearch index'),
            type: 'twitter',
            id: max.id
          }, function(err, tweet) {
            if(err) return res.apiResponse({"error": "Failed in ES.get"});


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
                  success: true,
                  type: 'topTweet',
                  source: 'twitter',
                  queryString: req.query,
                  data: max,
                  oembed: tweet.oembed
                };

                return res.apiResponse(dataReturn);

              });
            } else {
              debug("IT WAS CACHED");
              dataReturn = {
                success: true,
                type: 'topTweet',
                source: 'twitter',
                queryString: req.query,
                data: max,
                oembed: JSON.parse(tweet._source.oembed)
              }
              return res.apiResponse(dataReturn);

            }


          });
      });

  });
}
