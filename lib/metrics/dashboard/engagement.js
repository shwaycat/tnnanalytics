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
                        "and": { //twitter
                          "filters": [
                            {
                              "term": {
                                "doc_source": "twitter"
                              }
                            },
                            {
                              "or": {
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
                                  }
                                ]
                              }
                            }
                          ]
                        }
                      },
                      {
                        "and": { //youtube
                          "filters": [
                            {
                              "term": {
                                "doc_source": "youtube"
                              }
                            },
                            {
                              "or": {
                                "filters": [
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
                                  {
                                    "exists": {
                                      "field": "shareCount"
                                    }
                                  },
                                  {
                                    "exists": {
                                      "field": "dislikeCount"
                                    }
                                  }
                                ]
                              }
                            }
                          ]
                        }
                      },
                      {
                        "and": { //instagram
                          "filters": [
                            {
                              "term": {
                                "doc_source": "instagram"
                              }
                            },
                            {
                              "or": {
                                "filters": [
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
                                  }
                                ]
                              }
                            }
                          ]
                        }
                      },
                      {
                        "and": { //googleplus
                          "filters": [
                            {
                              "term": {
                                "doc_source": "googleplus"
                              }
                            },
                            {
                              "or": {
                                "filters": [
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
                                  }
                                ]
                              }
                            }
                          ]
                        }
                      },
                      {
                        "and": {
                          "filters": [
                            {
                              "term": {
                                "doc_source": "facebook"
                              }
                            },
                            {
                              "or": [
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
                          ]
                        }
                      }                      
                    ]
                  }
                }
              }
            },
            "filter": {
              "and": {
                "filters": [
                  {
                    "range": {
                      "timestamp": {
                        "gte": startTime,
                        "lte": endTime
                      }
                    }
                  },
                  {
                    "term": {
                      "cadence_user_id": accountRoot.id
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
                      "script": "doc['commentCount'].value + doc['viewCount'].value + doc['likeCount'].value + doc['shareCount'].value"
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

      var buckets = mxm.objTry(response, 'aggregations', 'engagement', 'buckets'),
          data = null,
          summary = {
            totalFacebook: 0,
            totalTwitter: 0,
            totalInstagram: 0,
            totalYouTube: 0,
            totalGooglePlus: 0
          };

      if(buckets && buckets.length) {
        data = _.map(buckets, function(bucket) {
          summary.totalFacebook += bucket.facebook.engagement.value;
          summary.totalTwitter += bucket.twitter.engagement.value;
          summary.totalInstagram += bucket.instagram.engagement.value;
          summary.totalYouTube += bucket.youtube.engagement.value;
          summary.totalGooglePlus += bucket.googleplus.engagement.value;

          var value = bucket.facebook.engagement.value + bucket.twitter.engagement.value +
                bucket.instagram.engagement.value + bucket.youtube.engagement.value +
                bucket.googleplus.engagement.value;

          _.each( mxm.objTry(bucket, 'facebook', 'docs', 'buckets'), function(b) {
            summary.totalFacebook += b.doc_count;
            value += b.doc_count;
          });

          _.each(mxm.objTry(bucket, 'twitter', 'docs', 'buckets'), function(b) {
            summary.totalTwitter += b.doc_count;
            value += b.doc_count;
          });

          return {
            key: bucket.key_as_string,
            value: value
          };
        });

        mxm.cleanupHistogram(data, startTime, endTime);
      }

      return callback(null, { data: data, summary: summary });
    });
  });
};
