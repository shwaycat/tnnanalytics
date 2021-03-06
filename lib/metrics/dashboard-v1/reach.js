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
      search_type: 'count',
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
              "min_doc_count": 0,
              "extended_bounds": {
                "min": startTime,
                "max": endTime
              }
            },
            "aggs": {
              "facebook": {
                "sum": {
                  "field": "impressions"
                }
              },
              "youtube": {
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
            totalFacebook: 0,
            totalYouTube: 0
          };

      if(buckets && buckets.length) {
        data = _.map(buckets, function(bucket) {
          summary.totalFacebook += bucket.facebook.value;
          summary.totalYouTube += bucket.youtube.value;

          return {
            key: bucket.key_as_string,
            value: bucket.facebook.value + bucket.youtube.value
          };
        });

        mxm.cleanupHistogram(data, startTime, endTime);
      }

      return callback(null, { data: data, summary: summary });
    });
  });
};
