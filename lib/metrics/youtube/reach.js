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
              "and": [
                {
                  "exists": { "field": "viewCount" }
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
          "reach": {
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
              "viewCount": {
                "sum": {
                  "field": "viewCount"
                }
              }
            }
          }
        }
      }
    }, function(err, response) {
      if(err) return callback(err);

      var buckets = mxm.objTry(response, 'aggregations', 'reach', 'buckets'),
          data = null,
          summary = {
            totalViews: 0
          };

      if(buckets && buckets.length) {
        data = _.map(buckets, function(bucket) {
          summary.totalViews += bucket.viewCount.value;

          return {
            key: bucket.key_as_string,
            value: bucket.viewCount.value
          };
        });

        mxm.cleanupHistogram(data, startTime, endTime);
      }

      callback(null, { data: data, summary: summary });
    });
  });
};
