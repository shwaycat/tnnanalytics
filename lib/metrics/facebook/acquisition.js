var keystone = require('keystone'),
    moment = require('moment'),
    debug = require('debug')('cadence:metrics:facebook:acquisition'),
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
    if (err) return callback({ error: err });

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      type: 'facebook,facebook_delta',
      body: {
        "query": {
          "filtered": {
            "filter": {
              "and": [
                {
                  "or":  [
                    { "term": { "_id": accountRoot.services.facebook.pageID } },
                    { "term": { "original_id": accountRoot.services.facebook.pageID } }
                  ]
                },
                { "exists": { "field": "likes" } },
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
          "acquisition": {
            "date_histogram": {
              "field": "timestamp",
              "interval": interval + "s",
              "min_doc_count": 0
            },
            "aggs": {
              "likes": {
                "max": {
                  "field": "likes"
                }
              }
            }
          }
        }
      }
    }, function(err, response) {
      if(err) return callback({ error: err });

      var buckets = mxm.objTry(response, 'aggregations', 'acquisition', 'buckets');

      buckets = _.sortBy(buckets, function(bucket) {
        return bucket.key;
      });

      if(buckets && buckets.length) {
        var data = _.map(buckets, function(bucket, i) {
              if (!bucket.likes.value && i > 0) {
                bucket.likes.value = buckets[i-1].likes.value;
              }
              return {
                key: bucket.key_as_string,
                value: bucket.likes.value
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

        return callback({
          data: data,
          summary: {
            totalLikes: _.last(data).value,
            changeInLikes: _.last(data).value - _.first(data).value
          }
        });
      } else {
        return callback({ 
          data: null,
          summary: {
            totalLikes: 0,
            changeInLikes: 0
          }
        });
      }
    });
  });
}