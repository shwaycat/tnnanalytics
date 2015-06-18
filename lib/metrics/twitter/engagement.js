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
              "and": {
                "filters": [
                  {
                    "or": {
                      "filters": [
                        {
                          "or": {
                            "filters": [
                              {"and": {
                                "filters": [
                                  {"terms": {
                                    "doc_type": ["tweet", "mention"]
                                  }},
                                  {"term": {
                                    "user_id": accountRoot.services.twitter.profileId
                                  }}
                                ]
                              }},
                              {"exists": {
                                "field": "reply_count"
                              }}
                            ]
                          }
                        },
                        {"and": {
                          "filters": [
                            {"terms": {
                              "doc_type": [
                                "mention",
                                "direct_message"
                              ]
                            }},
                            {"not": {
                              "filter": {
                                "term": {
                                  "user_id": accountRoot.services.twitter.profileId
                                }
                              }
                            }}
                          ]
                        }}
                      ]
                    }
                  },
                  {
                    "and": {
                      "filters": [
                        {
                          "term": {
                            "cadence_user_id": accountRoot.id
                          }
                        }
                      ]
                    }
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
              "replyCount": {
                "max": {
                  "field": "reply_count"
                }
              },
              "favoriteCount": {
                "max": {
                  "field": "favorite_count"
                }
              },
              "retweetCount": {
                "max": {
                  "field": "retweet_count"
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
          data = [],
          summary = {
            totalFavorites: 0,
            totalRetweets: 0,
            totalReplies: 0,
            totalMentions: 0,
            totalDirectMessages: 0
          };

      if(buckets && buckets.length) {
        data = _.map(buckets, function(bucket) {
          summary.totalFavorites += bucket.favoriteCount.value;
          summary.totalRetweets += bucket.retweetCount.value;
          summary.totalReplies += bucket.replyCount.value;

          var value = bucket.favoriteCount.value + bucket.retweetCount.value +
                bucket.replyCount.value;

          _.each(bucket.docTypes.buckets, function(b) {

            if(b.key == 'mention') {
              summary.totalMentions += b.doc_count;
              value += b.doc_count;
            } else if(b.key == 'direct_message') {
              summary.totalDirectMessages += b.doc_count;
              value += b.doc_count;
            }
          });

          return {
            key: bucket.key_as_string,
            value: value
          };
        });

        mxm.cleanupHistogram(data, startTime, endTime);
      }

      callback(null, { data: data, summary: summary });
    });
  });
};
