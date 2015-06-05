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
      type: "youtube_delta",
      search_type: 'count',
      body: {
        "query": {
          "filtered": {
            "filter": {
              "and": [
                { "exists": { "field": "subscriberCount" } },
                { "range": {
                    "timestamp": {
                      "gte": startTime,
                      "lte": endTime
                    }
                  }
                },
                {
                  "term": {
                    "original_id": accountRoot.services.googleplus.youtubeChannelID
                  }
                }
              ]
            }
          }
        },
        "aggs": {
          "subscriberCount": {
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
              "avgSubscriberCount": {
                "avg": {
                  "field": "subscriberCount"
                }
              }
            }
          }
        }
      }
    }, function(err, response) {
      if(err) return callback(err);

      var buckets = mxm.objTry(response, 'aggregations', 'subscriberCount', 'buckets'),
          data = null,
          summary = {
            totalSubscribers: 0,
            changeInSubscribers: 0
          };

      if(buckets && buckets.length) {
        data = _.map(buckets, function(bucket) {
          return {
            key: bucket.key_as_string,
            value: bucket.avgSubscriberCount.value
          };
        });

        mxm.cleanupHistogramExtended(data, startTime, endTime);

        summary.totalSubscribers = _.last(data).value;
        summary.changeInSubscribers = summary.totalSubscribers - _.first(data).value;
      }

      callback(null, { data: data, summary: summary });
    });
  });
};
