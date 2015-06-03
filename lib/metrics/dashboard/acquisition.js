var keystone = require('keystone'),
    debug = require('debug')('cadence:metrics:instagram:acquisition'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User'),
    _ = require('underscore');

module.exports = function(user, startTime, endTime, callback) {
  var interval = (endTime.getTime() - startTime.getTime()) / 24;
      interval = interval / 1000;

  if (interval < 86400) { // min. resolution is 1 day
    interval = 86400;
  }

  User.model.getAccountRootInfo(user.accountName, function(err, accountRoot) {
    if (err) return callback(err);

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
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
              "min_doc_count": 0
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
      var dataReturn = [],
          buckets = mxm.objTry(response, 'aggregations', 'acquisition', 'buckets');


      if(buckets && buckets.length) {

        _.each(buckets, function(bucket){
          dataReturn.push(extractDataPoint(bucket));
        });

        // Remove zeroes?
        // dataReturn = _.filter(dataReturn, function(dataPoint) { return dataPoint.value != 0; });

        if(buckets.length == 1) {
          dataReturn.unshift({
            key: startTime.toISOString(),
            value: _.first(dataReturn).value
          });
          dataReturn.push({
            key: endTime.toISOString(),
            value: _.last(dataReturn).value
          });
        }

        return callback(null, {
          data: dataReturn,
          summary: {
            "totalFacebook" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.facebook; }, 0),
            "totalTwitter" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.twitter; }, 0),
            "totalInstagram" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.instagram; }, 0),
            "totalYouTube" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.youtube; }, 0),
            "totalGooglePlus" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.googleplus; }, 0),
            "changeInAcquisition" : _.last(dataReturn).value - _.first(dataReturn).value
          }
        });
      } else {
        return callback(null, {
          data: null,
          summary: {
            "totalFacebook" : 0,
            "totalTwitter" : 0,
            "totalInstagram" : 0,
            "totalYouTube" : 0,
            "totalGooglePlus" : 0,
            "changeInAcquisition" : 0
          }
        });
      }
    });
  });
}

function extractDataPoint(bucket) {
  var key = bucket.key_as_string,
      facebook = (bucket.facebook.value || 0),
      twitter = (bucket.twitter.value || 0),
      instagram = (bucket.instagram.value || 0),
      youtube = (bucket.youtube.value || 0),
      googleplus = (bucket.googleplus.value || 0),
      value;

  value = facebook + twitter + instagram + youtube + googleplus;

  return {
      key: key,
      facebook: facebook,
      twitter: twitter,
      instagram: instagram,
      youtube: youtube,
      googleplus: googleplus,
      value: value
  };

}
