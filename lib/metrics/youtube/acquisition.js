var keystone = require('keystone'),
    debug = require('debug')('cadence:metrics:youtube:acquisition'),
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
              "min_doc_count": 0
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
        data = _.map(buckets, function(bucket, i) {
          if (!bucket.avgSubscriberCount.value && i > 0) {
            bucket.avgSubscriberCount.value = buckets[i-1].avgSubscriberCount.value;
          }

          return {
            key: bucket.key_as_string,
            value: bucket.avgSubscriberCount.value
          };
        });

        if(data.length == 1) {
          if (startTime < new Date(data[0].key)) {
            data.unshift({
              key: startTime.toISOString(),
              value: data[0].value
            });
          }

          if (endTime > new Date(data[0].key)) {
            data.push({
              key: endTime.toISOString(),
              value: data[0].value
            });
          }
        }

        summary.totalSubscribers = _.last(data).value;
        summary.changeInSubscribers = summary.totalSubscribers - _.first(data).value;
      }

      callback(null, { data: data, summary: summary });
    });
  });
};
