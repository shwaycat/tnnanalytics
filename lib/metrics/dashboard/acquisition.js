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
            "query": {
              "filtered": {
                "filter": {
                  "or": {
                    "filters": [
                      {
                        "exists": {
                          "field": "followed_by" // instagram
                        }
                      },
                      {
                        "exists": {
                          "field": "followers_count" // twitter
                        }
                      },
                      {
                        "exists": {
                          "field": "subscriberCount" // youtube
                        }
                      },
                      {
                        "exists": {
                          "field": "circledByCount" //googleplus
                        }
                      },
                      {
                        "and": { // facebook
                          "filters": [
                            {
                              "exists": {
                                "field": "likes"
                              }
                            },
                            {
                              "or": {
                                "filters": [
                                  {
                                    "term": {
                                      "_id": accountRoot.services.facebook.pageID
                                    }
                                  },
                                  {
                                    "term": {
                                      "original_id": accountRoot.services.facebook.pageID
                                    }
                                  }
                                ]
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              }
            },
            "filter": {
              "range": {
                "timestamp": {
                  "gte": startTime,
                  "lte": endTime
                }
              }
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
              "facebook": {
                "avg": {
                  "field": "likes"
                }
              },
              "twitter": {
                "avg": {
                  "field": "followers_count"
                }
              },
              "instagram": {
                "avg": {
                  "field": "followed_by"
                }
              },
              "youtube": {
                "avg": {
                  "field": "subscriberCount"
                }
              },
              "googleplus": {
                "avg": {
                  "field": "circledByCount"
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
            totalFacebook: 0,
            totalTwitter: 0,
            totalInstagram: 0,
            totalYouTube: 0,
            totalGooglePlus: 0,
            changeInAcquisition: 0
          };

      if(buckets && buckets.length) {
        data = _.map(buckets, function(bucket) {
          summary.totalFacebook = bucket.facebook.value ? bucket.facebook.value : summary.totalFacebook;
          summary.totalTwitter = bucket.twitter.value ? bucket.twitter.value : summary.totalTwitter;
          summary.totalInstagram = bucket.instagram.value ? bucket.instagram.value : summary.totalInstagram;
          summary.totalYouTube = bucket.youtube.value ? bucket.youtube.value : summary.totalYouTube;
          summary.totalGooglePlus = bucket.googleplus.value ? bucket.googleplus.value : summary.totalYouTube;

          return {
            key: bucket.key_as_string,
            value: bucket.facebook.value + bucket.twitter.value + bucket.instagram.value +
              bucket.youtube.value + bucket.googleplus.value
          };
        });

        mxm.cleanupHistogramExtended(data, startTime, endTime);

        summary.changeInAcquisition = _.last(data).value - _.first(data).value;
      }

      return callback(null, { data: data, summary: summary });
    });
  });
};
