var keystone = require('keystone'),
    debug = require('debug')('cadence:metrics:instagram:engagement'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User'),
    _ = require('underscore');

module.exports = function(user, startTime, endTime, callback) {

  var interval = (endTime.getTime() - startTime.getTime()) / 24;
      interval = interval / 1000;

  User.model.getAccountRootInfo(user.accountName, function(err, accountRoot) {
    if (err) return callback({'error': err});

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      type: "instagram",
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
                            "doc_type": "media"
                          }
                        },
                        {
                          "exists": {
                            "field": "comments"
                          }
                        },
                        {
                          "exists": {
                            "field": "likes"
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
                            "user_id": accountRoot.services.instagram.profileId
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
              "interval": "3600s",
              "min_doc_count": 0
            },
            "aggs": {
              "comments": {
                "max": {
                  "field": "comments"
                }
              },
              "likes": {
                "max": {
                  "field": "likes"
                }
              }
            }
          }
        }
      }
    }, function(err, response) {
      if(err) return callback({"error": err});
      var dataReturn = [],
          buckets = mxm.objTry(response, 'aggregations', 'engagement', 'buckets');

      if(buckets && buckets.length) {

        if(buckets.length == 1) {
          first = {
            key:startTime.toISOString(),
            likes:0,
            comments:0,
            value:0
          }
          dataReturn.push(first);
        }

        _.each(buckets, function(bucket){
          dataReturn.push(extractDataPoint(bucket));
        });

        if(buckets.length == 1) {
          last = {
            key:endTime.toISOString(),
            likes:0,
            comments:0,
            value:0
          }
          dataReturn.push(last);
        }

        return callback({
          data: dataReturn,
          summary: {
            "totalLikes" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.likes; }, 0),
            "totalComments" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.comments; }, 0)
          }
        });
      } else {
        return callback({
          data: [],
          summary: {
            "totalLikes" : 0,
            "totalComments" : 0
          }
        });
      }
    });
  });
}

function extractDataPoint(bucket) {
  var key = bucket.key_as_string,
      likes = (bucket.likes.value || 0),
      comments = (bucket.comments.value || 0),
      value;

  value = likes + comments;

  return {
      key: key,
      likes: likes,
      comments: comments,
      value: value
  };

}