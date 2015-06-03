var keystone = require('keystone'),
    debug = require('debug')('cadence:metrics:dashboard:engagement'),
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
                    //twitter
                    "filters": [
                      {
                        "terms": {
                          "doc_type": [
                            "tweet",
                            "mention",
                            "direct_message"
                          ]
                        }
                      },
                      {
                        "exists": {
                          "field": "reply_count"
                        }
                      },
                      //youtube
                      {
                        "term": {
                          "doc_type": "video"
                        }
                      },
                      {
                        "exists": {
                          "field": "commentCount"
                        }
                      },
                      {
                        "exists": {
                          "field": "viewCount"
                        }
                      },
                      {
                        "exists": {
                          "field": "likeCount"
                        }
                      },
                      //FIXME add back after shareCount is fixed
                      // {
                      //   "exists": {
                      //     "field": "shareCount"
                      //   }
                      // },
                      {
                        "exists": {
                          "field": "dislikeCount"
                        }
                      },
                      //instagram
                      {
                        "term": {
                          "doc_type": "media"
                        }
                      },
                      {
                        "exists": {
                          "field": "comments"
                        }
                      },
                      {
                        "exists": {
                          "field": "likes"
                        }
                      },
                      //googleplus
                      {
                        "term": {
                          "doc_type": "post"
                        }
                      },
                      {
                        "exists": {
                          "field": "replies"
                        }
                      },
                      {
                        "exists": {
                          "field": "plusoners"
                        }
                      },
                      {
                        "exists": {
                          "field": "resharers"
                        }
                      },
                      //facebook
                      {
                        "terms": {
                          "doc_type": [
                            "comment",
                            "mention",
                            "message"
                          ]
                        }
                      },
                      {
                        "or": [
                          {
                            "term": {
                              "cadence_user_id": accountRoot.id
                            }
                          },
                          {
                            "term": {
                              "original_id": accountRoot.services.facebook.pageID
                            }
                          }
                        ]
                      },
                      {
                        "and": [
                          {
                            "terms": {
                              "doc_type": [
                                "post",
                                "status"
                              ]
                            }
                          },
                          {
                            "or": [
                              {
                                "exists": {
                                  "field": "likes"
                                }
                              },
                              {
                                "exists": {
                                  "field": "shares"
                                }
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            },
            "filter": {
              "range": {
                "timestamp": {
                  "gte": "now-90d",
                  "lte": "now"
                }
              }
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
              "facebook": {
                "filter": {
                  "term": {
                    "doc_source": "facebook"
                  }
                },
                "aggs": {
                  "engagement": {
                    "max": {
                      "script": "doc['likes'].value + doc['shares'].value"
                    }
                  },
                  "docs": {
                    "terms": {
                      "field": "doc_type"
                    }
                  }
                }
              },
              "twitter": {
                "filter": {
                  "term": {
                    "doc_source": "twitter"
                  }
                },
                "aggs": {
                  "engagement": {
                    "max": {
                      "script": "doc['reply_count'].value + doc['favorite_count'].value + doc['retweet_count'].value"
                    }
                  },
                  "docs": {
                    "terms": {
                      "field": "doc_type"
                    }
                  }
                }
              },
              "instagram": {
                "filter": {
                  "term": {
                    "doc_source": "instagram"
                  }
                },
                "aggs": {
                  "engagement": {
                    "max": {
                      "script": "doc['likes'].value + doc['comments'].value"
                    }
                  },
                  "docs": {
                    "terms": {
                      "field": "doc_type"
                    }
                  }
                }
              },
              "youtube": {
                "filter": {
                  "term": {
                    "doc_source": "youtube"
                  }
                },
                "aggs": {
                  "engagement": {
                    "max": {
                      //FIXME add back after shareCount is fixed
                      // "script": "doc['commentCount'].value + doc['viewCount'].value + doc['likeCount'].value + doc['shareCount'].value"
                      "script": "doc['commentCount'].value + doc['viewCount'].value + doc['likeCount'].value"
                    }
                  },
                  "docs": {
                    "terms": {
                      "field": "doc_type"
                    }
                  }
                }
              },
              "googleplus": {
                "filter": {
                  "term": {
                    "doc_source": "googleplus"
                  }
                },
                "aggs": {
                  "engagement": {
                    "max": {
                      "script": "doc['replies'].value + doc['plusoners'].value + doc['resharers'].value"
                    }
                  },
                  "docs": {
                    "terms": {
                      "field": "doc_type"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }, function(err, response) {
      if(err) return callback(err);
      var dataReturn = [],
          buckets = mxm.objTry(response, 'aggregations', 'engagement', 'buckets');


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
            "changeInAcquestion" : _.last(dataReturn).value - _.first(dataReturn).value
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
            "changeInAcquestion" : 0
          }
        });
      }
    });
  });
}

function extractDataPoint(bucket) {
  var key = bucket.key_as_string,
      facebook = (bucket.facebook.engagement.value || 0),
      twitter = (bucket.twitter.engagement.value || 0),
      instagram = (bucket.instagram.engagement.value || 0),
      youtube = (bucket.youtube.engagement.value || 0),
      googleplus = (bucket.googleplus.engagement.value || 0),
      value;

  var facebookBuckets = mxm.objTry(bucket, 'facebook', 'docs', 'buckets');
  if(facebookBuckets && facebookBuckets.length) {
    _.each(twitterBuckets, function(obj) {

      if(obj.key == 'post' || obj.key == 'status' || obj.key == 'mention' || obj.key == 'comment' || obj.key == 'message') {
        facebook += obj.doc_count || 0;
      }

    });
  }

  var twitterBuckets = mxm.objTry(bucket, 'twitter', 'docs', 'buckets');
  if(twitterBuckets && twitterBuckets.length) {
    _.each(twitterBuckets, function(obj) {

      if(obj.key == 'mention' || obj.key == 'direct_message') {
        twitter += obj.doc_count || 0;
      }

    });
  }

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
