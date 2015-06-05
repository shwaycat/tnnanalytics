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
      body: {
        "query": {
          "filtered": {
            "filter": {
              "and": [
                {
                  "range": {
                    "timestamp": { "gte": startTime, "lte": endTime }
                  }
                },
                {
                  "or": [
                    { "term": { "cadence_user_id": accountRoot.id } },
                    { "term": { "original_id": accountRoot.services.facebook.pageID } }
                  ]
                },
                {
                  "or": [
                    { "terms": { "doc_type": [ "comment", "mention", "message" ] } },
                    {
                      "and": [
                        { "terms": { "doc_type": [ "post", "status" ] } },
                        {
                          "or": [
                            { "exists": { "field": "likes" } },
                            { "exists": { "field": "shares" } }
                          ]
                        }
                      ]
                    }
                  ]
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
              "likes": {
                "max": {
                  "field": "likes"
                }
              },
              "shares": {
                "max": {
                  "field": "shares"
                }
              },
              "docTypes": {
                "terms": {
                  "field": "doc_type",
                  "size": 0
                }
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
            totalLikes: 0,
            totalShares: 0,
            totalComments: 0,
            totalMentions: 0,
            totalMessages: 0
          };


      buckets = _.sortBy(buckets, function(bucket) {
        return bucket.key;
      });

      if(buckets && buckets.length) {
        data = _.map(buckets, function(bucket) {
          var result = {
                key: bucket.key_as_string,
                value: bucket.likes.value + bucket.shares.value
              };

          summary.totalLikes += bucket.likes.value || 0;
          summary.totalShares += bucket.shares.value || 0;

          _.each(bucket.docTypes.buckets, function(b) {
            if (!b.doc_count) return;

            result.value += b.doc_count;

            if (b.key == 'mention') {
              summary.totalMentions += b.doc_count;
            } else if (b.key == 'comment') {
              summary.totalComments += b.doc_count;
            } else if (b.key == 'message') {
              summary.totalMessages += b.doc_count;
            }
          });

          return result;
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

      return callback(null, { data: data, summary: summary });
    });
  });
};
