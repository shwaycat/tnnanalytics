var keystone = require('keystone'),
    _ = require('underscore'),
    async = require('async'),
    debug = require('debug')('cadence:api:twitter:engagement'),
    mxm = require('../../../lib/mxm-utils');





exports = module.exports = function(req, res) {
 
  var view = new keystone.View(req, res),
      locals = res.locals,
      dataReturn = [];

  startTime = new Date("Mar 1, 2015");
  endTime = new Date("Mar 31, 2015");
  if(req.query.startTime) {
    startTime = new Date(req.query.startTime);
  }
  if(req.query.endTime) {
    endTime = new Date(req.query.endTime);
  }
  
  var dataReturn = [];
  var timeHolder = startTime;

  console.log(startTime.getDate() - endTime.getDate());

  keystone.elasticsearch.search({
    index: keystone.get('elasticsearch index'),
    body: {
      "query": {
        "filtered": {
          "filter": {
            "and": {
              "filters": [
                {
                  "terms": {
                    "doc_type": ["tweet", "mention", "direct_message"]
                  }
                },
                {
                  "range": {
                    "timestamp": {
                      "gte": startTime,
                      "lte": endTime
                    }
                  }
                }
              ]
            }
          }
        }
      },
      "aggs": {
        "followers": {
          "date_histogram": {
            "field": "timestamp",
            "interval": "30m",
            "min_doc_count": 0
          },
          "aggs": {
            "reply_count": {
              "max": {
                "field": "reply_count"
              }
            },
            "favorite_count": {
              "max": {
                "field": "favorite_count"
              }
            },
            "retweet_count": {
              "max": {
                "field": "retweet_count"
              }
            },
            "doc_types": {
              "terms": {
                "field": "doc_type",
                "size": 0
              }
            }
          }
        }
      }
    }
  }, function(err, response) {
    if(err) return res.apiError({"error": err});
    var dataReturn = [],
        buckets = mxm.objTry(response, 'aggregations', 'followers', 'buckets');

    if(buckets && buckets.length) {

      _.each(buckets, function(bucket){
        dataReturn.push(extractDataPoint(bucket));
      });

      return res.apiResponse({
        success: true,
        type: 'engagement',
        source: 'twitter',
        queryString: req.query,
        data: dataReturn,
        summary: {
          "totalFavorites" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.favorite_count; }, 0),
          "totalRetweets" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.retweet_count; }, 0),
          "totalReplies" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.reply_count; }, 0),
          "totalMentions" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.mention_count; }, 0),
          "totalDirectMentions" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.dm_count; }, 0)
        }
      });   
    } else {
      res.apiError('error', "No buckets.")
    }
  });

}

function extractDataPoint(bucket) {
  var key = bucket.key_as_string,
      favorite_count = (bucket.favorite_count.value || 0),
      reply_count = (bucket.reply_count.value || 0),
      retweet_count = (bucket.retweet_count.value || 0),
      mention_count,
      dm_count,
      value;



  innerBucket = mxm.objTry(bucket, 'doc_types', 'buckets');

  if(innerBucket && innerBucket.length) {

    _.each(innerBucket, function(obj) {

      if(obj.key == 'mention') {
        mention_count = obj.doc_count || 0;
      }

      if(obj.key == 'direct_message') {
       dm_count = obj.doc_count || 0;
      }

    })

  }

  if(!mention_count) {
    mention_count = 0;
  }
  if(!dm_count) {
    dm_count = 0;
  }
  
  value = favorite_count + reply_count + retweet_count + mention_count + dm_count;

  return {
      key: key,
      favorite_count: favorite_count,
      reply_count: reply_count,
      retweet_count: retweet_count,
      mention_count: mention_count,
      dm_count: dm_count,
      value: value
  };
}
