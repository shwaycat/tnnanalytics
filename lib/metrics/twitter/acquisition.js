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
      search_type: 'count',
      body: {
        "query": {
          "filtered": {
            "filter": {
              "and": {
                "filters": [
                  { "exists": { "field": "followers_count" } },
                  { "range": {
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
              "interval": interval + "s",
              "min_doc_count": 0,
              "extended_bounds": {
                "min": startTime,
                "max": endTime
              }
            },
            "aggs": {
              "avgFollowerCount": {
                "avg": {
                  "field": "followers_count"
                }
              }
            }
          }
        }
      }
    }, function(err, response) {
      if(err) return callback(err);

      var buckets = mxm.objTry(response, 'aggregations', 'followers', 'buckets'),
          data = null,
          summary = {
            totalFollowers: 0,
            changeInFollowers: 0
          };

      if(buckets && buckets.length) {
        data = _.map(buckets, function(bucket) {
          return {
            key: bucket.key_as_string,
            value: bucket.avgFollowerCount.value
          };
        });

        mxm.cleanupHistogramExtended(data, startTime, endTime);

        summary.totalFollowers = _.last(data).value;
        summary.changeInFollowers = summary.totalFollowers - _.first(data).value;
        summary.changeInFollowersPercent = (((summary.changeInFollowers / _.first(data).value) * 100) || 0).toFixed(2);
      }

      callback(null, { data: data, summary: summary });
    });
  });
};
