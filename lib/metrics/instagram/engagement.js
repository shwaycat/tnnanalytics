var keystone = require('keystone'),
    debug = require('debug')('cadence:metrics:instagram:engagement'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User'),
    _ = require('underscore');

module.exports = function(user, startTime, endTime, callback) {
  var interval = mxm.calculateInterval(startTime, endTime);

  User.model.getAccountRootInfo(user.accountName, function(err, accountRoot) {
    if (err) return callback(err);

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      type: "instagram",
      search_type: 'count',
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
              "interval": interval + "s",
              "min_doc_count": 0,
              "extended_bounds": {
                "min": startTime,
                "max": endTime
              }
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
      if(err) return callback(err);

      var buckets = mxm.objTry(response, 'aggregations', 'engagement', 'buckets'),
          data = [],
          summary = {
            totalLikes: 0,
            totalComments: 0
          };

      if(buckets && buckets.length) {
        data = _.map(buckets, function(bucket) {
          summary.totalLikes += bucket.likes.value;
          summary.totalComments += bucket.comments.value;

          return {
            key: bucket.key_as_string,
            value: bucket.likes.value + bucket.comments.value
          };
        });

        mxm.cleanupHistogram(data, startTime, endTime);
      }

      callback(null, { data: data, summary: summary });
    });
  });
};
