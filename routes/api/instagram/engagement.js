var keystone = require('keystone'),
    _ = require('underscore'),
    async = require('async'),
    debug = require('debug')('cadence:api:instagram:engagement'),
    User = keystone.list('User'),
    mxm = require('../../../lib/mxm-utils');



exports = module.exports = function(req, res) {
 
  var view = new keystone.View(req, res),
      locals = res.locals,
      dataReturn = [];

  startTime = new Date();
  endTime = new Date();
  startTime.setDate(endTime.getDate() - 30);

  if(req.query.startTime) {
    startTime = new Date(req.query.startTime);
  }
  if(req.query.endTime) {
    endTime = new Date(req.query.endTime);
  }
  
  var dataReturn = [];
  var timeHolder = startTime;

  var interval = (endTime.getTime() - startTime.getTime()) / 24;
      interval = interval / 1000;

  User.model.getAccountRootInfo(req.user.accountName, function(err, accountRoot) {
    if (err) return apiResponse({'error': err});

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      type: "instagram",
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
                  },
                  {
                    "and": {
                      "filters": [
                        {
                          "term": {
                            "cadence_user_id": accountRoot.id
                          }
                        },
                        {
                          "term": {
                            "user_id": accountRoot.services.instagram.profileId
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
              "interval": "3600s",
              "min_doc_count": 0
            },
            "aggs": {
              "comments": {
                "max": {
                  "field": "comments"
                }
              },
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
      if(err) return res.apiResponse({"error": err});
      var dataReturn = [],
          buckets = mxm.objTry(response, 'aggregations', 'engagement', 'buckets');

      if(buckets && buckets.length) {

        if(buckets.length == 1) {
          first = {
            key:startTime.toISOString(),
            likes:0,
            comments:0,
            value:0
          }
          dataReturn.push(first);
        }

        _.each(buckets, function(bucket){
          dataReturn.push(extractDataPoint(bucket));
        });

        if(buckets.length == 1) {
          last = {
            key:endTime.toISOString(),
            likes:0,
            comments:0,
            value:0
          }
          dataReturn.push(last);
        }

        return res.apiResponse({
          success: true,
          type: 'engagement',
          source: 'twitter',
          queryString: req.query,
          data: dataReturn,
          summary: {
            "totalLikes" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.likes; }, 0),
            "totalComments" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.comments; }, 0)
          }
        });   
      } else {
        res.apiResponse('error', "No buckets.")
      }
    });
  });
}

function extractDataPoint(bucket) {
  var key = bucket.key_as_string,
      likes = (bucket.likes.value || 0),
      comments = (bucket.comments.value || 0),
      value;

  value = likes + comments;

  return {
      key: key,
      likes: likes,
      comments: comments,
      value: value
  };
}
