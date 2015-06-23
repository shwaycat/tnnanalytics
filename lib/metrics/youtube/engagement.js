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
                  "or": [
                    { "exists": { "field": "commentCount" } },
                    { "exists": { "field": "viewCount" } },
                    { "exists": { "field": "likeCount" } },
                    { "exists": { "field": "shareCount" } },
                    { "exists": { "field": "dislikeCount" } }
                  ]
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
              "min_doc_count": 0,
              "extended_bounds": {
                "min": startTime,
                "max": endTime
              }
            },
            "aggs": {
              "commentCount": {
                "sum": { "field": "commentCount" }
              },
              "viewCount": {
                "sum": { "field": "viewCount" }
              },
              "likeCount": {
                "sum": { "field": "likeCount" }
              },
              "shareCount": {
                "sum": { "field": "shareCount" }
              },
              "dislikeCount": {
                "sum": { "field": "dislikeCount" }
              }
            }
          }
        }
      }
    }, function(err, response) {
      if(err) return callback(err);

      var buckets = mxm.objTry(response, 'aggregations', 'engagement', 'buckets'),
          data = null,
          summary = {
            totalViews: 0,
            totalLikes: 0,
            totalDislikes: 0,
            totalComments: 0,
            totalShares: 0
          };

      if(buckets && buckets.length) {
        data = _.map(buckets, function(bucket) {
          summary.totalViews += bucket.viewCount.value;
          summary.totalLikes += bucket.likeCount.value;
          summary.totalDislikes += bucket.dislikeCount.value;
          summary.totalComments += bucket.commentCount.value;
          summary.totalShares += bucket.shareCount.value;

          return {
            key: bucket.key_as_string,
            value: bucket.viewCount.value + bucket.likeCount.value - bucket.dislikeCount.value +
              bucket.commentCount.value + bucket.shareCount.value
          };
        });

        mxm.cleanupHistogram(data, startTime, endTime);
      }

      callback(null, { data: data, summary: summary });
    });
  });
};
