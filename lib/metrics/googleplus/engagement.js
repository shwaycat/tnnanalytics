var keystone = require('keystone'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User'),
    _ = require('underscore');

module.exports = function(user, startTime, endTime, callback) {
  var interval = mxm.calculateInterval(startTime, endTime);

  User.model.getAccountRootInfo(user.accountName, function(err, accountRoot) {
    if (err) return callback(err);

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      type: "googleplus",
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
                            "doc_type": "post"
                          }
                        },
                        {
                          "exists": {
                            "field": "replies"
                          }
                        },
                        {
                          "exists": {
                            "field": "plusoners"
                          }
                        },
                        {
                          "exists": {
                            "field": "resharers"
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
              "min_doc_count": 0,
              "extended_bounds": {
                "min": startTime,
                "max": endTime
              }
            },
            "aggs": {
              "comments": {
                "max": {
                  "field": "replies"
                }
              },
              "plusoners": {
                "max": {
                  "field": "plusoners"
                }
              },
              "resharers": {
                "max": {
                  "field": "resharers"
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
            totalPlusOners: 0,
            totalResharers: 0,
            totalComments: 0
          };

      if(buckets && buckets.length) {
        data = _.map(buckets, function(bucket) {
          summary.totalPlusOners += bucket.plusoners.value;
          summary.totalResharers += bucket.resharers.value;
          summary.totalComments += bucket.comments.value;

          return {
            key: bucket.key_as_string,
            value: bucket.plusoners.value + bucket.resharers.value + bucket.comments.value
          };
        });

        mxm.cleanupHistogram(data, startTime, endTime);
      }

      callback(null, { data: data, summary: summary });
    });
  });
};
