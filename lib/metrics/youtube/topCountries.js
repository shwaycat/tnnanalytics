var keystone = require('keystone'),
    _ = require('underscore'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User');

module.exports = function(user, startTime, endTime, callback) {
  User.model.getAccountRootInfo(user.accountName, function(err, accountRoot) {
    if (err) return callback(err);

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      type: 'youtube_delta',
      search_type: 'count',
      body: {
        "query": {
          "filtered": {
            "filter": {
              "and": [
                {
                  "exists": { "field": "country" }
                },
                {
                  "term": { "cadence_user_id": accountRoot.id }
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
        },
        "aggs": {
          "topCountries": {
            "terms": {
              "field": "country",
              "size": 0
            },
            "aggs": {
              "viewCount": {
                "sum": {
                  "field": "viewCount"
                }
              },
              "likeCount": {
                "sum": {
                  "field": "likeCount"
                }
              },
              "shareCount": {
                "sum": {
                  "field": "shareCount"
                }
              },
              "commentCount": {
                "sum": {
                  "field": "commentCount"
                }
              }
            }
          }
        }
      }
    }, function(err, response) {
      if(err) return callback(err);

      var data = null,
          buckets = mxm.objTry(response, 'aggregations', 'topCountries', 'buckets');

      if(buckets && buckets.length) {
        data = _.map(buckets, function(bucket) {
          return {
            key: bucket.key.toUpperCase(),
            value: bucket.viewCount.value + bucket.likeCount.value + bucket.shareCount.value +
              bucket.commentCount.value
          };
        });

        data = _.sortBy(data, function(bucket) {
          return bucket.value * -1;
        });
      }

      return callback(null, { data: data });
    });
  });
};
