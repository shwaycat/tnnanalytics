var keystone = require('keystone'),
    debug = require('debug')('cadence:metrics:youtube:engagement'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User'),
    _ = require('underscore');

module.exports = function(user, startTime, endTime, callback) {

  var interval = (endTime.getTime() - startTime.getTime()) / 24;
      interval = interval / 1000;

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
                          "term": {
                            "doc_type": "video"
                          }
                        },
                        {
                          "exists": {
                            "field": "commentCount"
                          }
                        },
                        {
                          "exists": {
                            "field": "viewCount"
                          }
                        },
                        {
                          "exists": {
                            "field": "likeCount"
                          }
                        },
                        {
                          "exists": {
                            "field": "shareCount"
                          }
                        },
                        {
                          "exists": {
                            "field": "dislikeCount"
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
                        }
                      ]
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
              "commentCount": {
                "max": {
                  "field": "commentCount"
                }
              },
              "viewCount": {
                "max": {
                  "field": "viewCount"
                }
              },
              "likeCount": {
                "max": {
                  "field": "likeCount"
                }
              },
              "shareCount": {
                "max": {
                  "field": "shareCount"
                }
              },
              "dislikeCount": {
                "max": {
                  "field": "dislikeCount"
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
          first = {
            key:startTime.toISOString(),
            viewCount: 0,
            likeCount: 0,
            dislikeCount: 0,
            commentCount: 0,
            shareCount: 0,
            value: 0
          }
          dataReturn.push(first);
        }

        _.each(buckets, function(bucket){
          dataReturn.push(extractDataPoint(bucket));
        });

        if(buckets.length == 1) {
          last = {
            key:endTime.toISOString(),
            viewCount: 0,
            likeCount: 0,
            dislikeCount: 0,
            commentCount: 0,
            shareCount: 0,
            value: 0
          }
          dataReturn.push(last);
        }

        return callback(null, {
          data: dataReturn,
          summary: {
            "totalViews" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.viewCount; }, 0),
            "totalLikes" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.likeCount; }, 0),
            "totalDislikes" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.dislikeCount; }, 0),
            "totalComments" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.commentCount; }, 0),
            "totalShares" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.shareCount; }, 0)
          }
        });
      } else {
        return callback(null, {
          data: null,
          summary: {
            "totalViews" : 0,
            "totalLikes" : 0,
            "totalDislikes" : 0,
            "totalComments" : 0,
            "totalShares" : 0
          }
        });
      }
    });
  });
}

function extractDataPoint(bucket) {
  var key = bucket.key_as_string,
      viewCount = (bucket.viewCount.value || 0),
      likeCount = (bucket.likeCount.value || 0),
      dislikeCount = (bucket.dislikeCount.value || 0),
      commentCount = (bucket.commentCount.value || 0),
      shareCount = (bucket.shareCount.value || 0),
      value;

  value = viewCount + likeCount - dislikeCount + commentCount + shareCount;

  return {
      key: key,
      viewCount: viewCount,
      likeCount: likeCount,
      dislikeCount: dislikeCount,
      commentCount: commentCount,
      shareCount: shareCount,
      value: value
  };
}
