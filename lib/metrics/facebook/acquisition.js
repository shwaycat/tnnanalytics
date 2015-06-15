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
      type: 'facebook,facebook_delta',
      search_type: 'count',
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
              "min_doc_count": 0,
              "extended_bounds": {
                "min": startTime,
                "max": endTime
              }
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
      if(err) return callback(err);

      var buckets = mxm.objTry(response, 'aggregations', 'acquisition', 'buckets'),
          data = null,
          summary = {
            totalLikes: 0,
            changeInLikes: 0
          };

      if(buckets && buckets.length) {
        data = _.map(buckets, function(bucket) {
          return {
            key: bucket.key_as_string,
            value: bucket.likes.value
          };
        });

        mxm.cleanupHistogramExtended(data, startTime, endTime);

        summary.totalLikes = _.last(data).value;
        summary.changeInLikes = summary.totalLikes - _.first(data).value;
        summary.changeInLikesPercent = (((summary.changeInLikes / _.first(data).value) * 100) || 0).toFixed(2);
      }

      return callback(null, { data: data, summary: summary });
    });
  });
};
