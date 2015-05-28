var keystone = require('keystone'),
    _ = require('underscore'),
    async = require('async'),
    debug = require('debug')('cadence:api:googleplus:engagement'),
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
      type: "googleplus",
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
              "interval": "3600s",
              "min_doc_count": 0
            },
            "aggs": {
              "comments": {
                "max": {
                  "field": "replies"
                }
              },
              "plusoners": {
                "max": {
                  "field": "plusoners"
                }
              },
              "resharers": {
                "max": {
                  "field": "resharers"
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
            plusoners:0,
            comments:0,
            resharers:0,
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
            plusoners:0,
            comments:0,
            resharers:0,
            value:0
          }
          dataReturn.push(last);
        }

        return res.apiResponse({
          success: true,
          type: 'engagement',
          source: 'googleplus',
          queryString: req.query,
          data: dataReturn,
          summary: {
            "totalPlusOners" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.plusoners; }, 0),
            "totalResharers" : _.reduce(dataReturn, function(memo, dataPoint) { return memo + dataPoint.resharers; }, 0),
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
      plusoners = (bucket.plusoners.value || 0),
      comments = (bucket.comments.value || 0),
      resharers = (bucket.resharers.value || 0),
      value;

  value = plusoners + comments + resharers;

  return {
      key: key,
      plusoners: plusoners,
      comments: comments,
      resharers: resharers,
      value: value
  };
}
