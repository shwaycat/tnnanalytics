var keystone = require('keystone'),
    debug = require('debug')('cadence:metrics:youtube:engagement'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User'),
    _ = require('underscore');

module.exports = function(user, startTime, endTime, callback) {
  var interval = mxm.calculateInterval(startTime, endTime);

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
          "engagement": {
            "date_histogram": {
              "field": "timestamp",
              "interval": interval + "s",
              "min_doc_count": 0
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

      debug(response);

      var buckets = mxm.objTry(response, 'aggregations', 'engagement', 'buckets'),
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
      }

      callback(null, { data: data, summary: summary });
    });
  });
};
