var keystone = require('keystone'),
    debug = require('debug')('cadence:metrics:twitter:engagement'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User'),
    _ = require('underscore');

module.exports = function(user, startTime, endTime, callback) {
  var interval = mxm.calculateInterval(startTime, endTime);

  User.model.getAccountRootInfo(user.accountName, function(err, accountRoot) {
    if (err) return callback(err);

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      body: {
        "query": {
          "filtered": {
            "filter": {
              "and": {
                "filters": [
                  {
                    "or": {
                      "filters": [
                        {
                          "terms": {
                            "doc_type": [
                              "tweet",
                              "mention",
                              "direct_message"
                            ]
                          }
                        },
                        {
                          "exists": {
                            "field": "reply_count"
                          }
                        }
                      ]
                    }
                  },
                  {
                    "and": {
                      "filters": [
                        {
                          "term": {
                            "cadence_user_id": accountRoot.id
                          }
                        },
                        {
                          "term": {
                            "user_id": accountRoot.services.twitter.profileId
                          }
                        }
                      ]
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
          "engagement": {
            "date_histogram": {
              "field": "timestamp",
              "interval": interval + "s",
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
      if(err) return callback(err);
      var dataReturn = [],
          buckets = mxm.objTry(response, 'aggregations', 'engagement', 'buckets');

      if(buckets && buckets.length) {

        if(buckets.length == 1) {
          first = extractDataPoint(buckets[0]);
          first.key = mxm.roundToHour(startTime).toISOString();
          dataReturn.push(first);
        }

        _.each(buckets, function(bucket){
          dataReturn.push(extractDataPoint(bucket));
        });

        if(buckets.length == 1) {
          last = _.last(dataReturn);
          last.key = mxm.roundToHour(endTime).toISOString();
          dataReturn.push(last);
        }

        return callback(null, {
          data: dataReturn,
          summary: {
            "totalFavorites" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.favorite_count; }, 0),
            "totalRetweets" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.retweet_count; }, 0),
            "totalReplies" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.reply_count; }, 0),
            "totalMentions" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.mention_count; }, 0),
            "totalDirectMessages" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.dm_count; }, 0)
          }
        });
      } else {
        return callback(null, {
          success: true,
          data: null,
          summary: {
            "totalFavorites" : 0,
            "totalRetweets" : 0,
            "totalReplies" : 0,
            "totalMentions" : 0,
            "totalDirectMessages" : 0
          }
        });
      }
    });
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
