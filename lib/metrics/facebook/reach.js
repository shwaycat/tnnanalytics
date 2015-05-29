var keystone = require('keystone'),
    moment = require('moment'),
    debug = require('debug')('cadence:metrics:facebook:reach'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User'),
    _ = require('underscore');

module.exports = function(user, startTime, endTime, callback) {
  var interval = Math.floor((endTime.getTime() - startTime.getTime()) / 24 / 1000);

  if (interval < 86400) { // min. resolution is 1 day
    interval = 86400;
  }

  debug("startTime: %s, endTime: %s, interval: %s", startTime, endTime, interval);

  User.model.getAccountRootInfo(user.accountName, function(err, accountRoot) {
    if (err) return callback(err);

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      type: 'facebook_delta',
      body: {
        "query": {
          "filtered": {
            "filter": {
              "and": [
                { "term": { "original_id": accountRoot.services.facebook.pageID } },
                { "exists": { "field": "impressions" } },
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
              }
            }
          }
        }
      }
    }, function(err, response) {
      if(err) return callback(err);

      var buckets = mxm.objTry(response, 'aggregations', 'reach', 'buckets');

      buckets = _.sortBy(buckets, function(bucket) {
        return bucket.key;
      });

      if(buckets && buckets.length) {
        var data = _.map(buckets, function(bucket) {
              if (!bucket.impressions.value) {
                bucket.impressions.value = 0;
              }
              return {
                key: bucket.key_as_string,
                value: bucket.impressions.value
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

        return callback(null, {
          data: data
        });
      } else {
        return callback(null, { 
          data: null 
        });
      }
    });
  });
}