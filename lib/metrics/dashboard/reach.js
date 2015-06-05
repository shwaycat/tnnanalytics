var keystone = require('keystone'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User'),
    _ = require('underscore');

module.exports = function(user, startTime, endTime, callback) {
  var interval = mxm.calculateInterval(startTime, endTime, 60*60*24);

  User.model.getAccountRootInfo(user.accountName, function(err, accountRoot) {
    if (err) return callback(err);

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      body: {
        "query": {
          "filtered": {
            "filter": {
              "and": [
                {
                  "or": [
                    {
                      "and": [
                        {
                          "exists": { "field": "viewCount" }
                        },
                        {
                          "term": { "cadence_user_id": accountRoot.id }
                        }
                      ]
                    },
                    {
                      "and": [
                        {
                          "exists": { "field": "impressions" }
                        },
                        {
                          "term": { "original_id": accountRoot.services.facebook.pageID }
                        }
                      ]
                    }
                  ]
                },
                {
                  "range": {
                    "timestamp": { "gte": startTime, "lte": endTime }
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
              "min_doc_count": 0
            },
            "aggs": {
              "impressions": {
                "sum": {
                  "field": "impressions"
                }
              },
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
          data = null;

      buckets = _.sortBy(buckets, function(bucket) {
        return bucket.key;
      });

      if(buckets && buckets.length) {
        data = _.map(buckets, function(bucket) {
          return {
            key: bucket.key_as_string,
            value: (bucket.impressions.value || 0) + (bucket.viewCount.value || 0)
          };
        });

        if(buckets.length == 1) {
          data.unshift({
            key: startTime.toISOString(),
            value: _.first(data).value
          });
          data.push({
            key: endTime.toISOString(),
            value: _.last(data).value
          });
        }
      }

      return callback(null, { data: data });
    });
  });
};
