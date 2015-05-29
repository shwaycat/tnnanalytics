var keystone = require('keystone'),
    _ = require('underscore'),
    async = require('async'),
    User = keystone.list('User'),
    mxm = require('../../../lib/mxm-utils');


exports = module.exports = function(req, res) {
 
  var view = new keystone.View(req, res),
      locals = res.locals;

  var dataReturn = [];
  endTime = new Date();
  startTime = new Date();
  startTime.setDate(endTime.getDate() - 30);

  if(req.query.startTime) {
    startTime = new Date(req.query.startTime);
  }
  if(req.query.endTime) {
    endTime = new Date(req.query.endTime);
  }

  var interval = (endTime.getTime() - startTime.getTime()) / 24;
      interval = interval / 1000;

  User.model.getAccountRootInfo(req.user.accountName, function(err, accountRoot) {
    if (err) return apiResponse({'error': err});

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      body: {
        "query": {
          "filtered": {
            "filter": {
              "and": {
                "filters": [
                  { "exists": { "field": "circledByCount" } },
                  { "range": {
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
          "followers": {
            "date_histogram": {
              "field": "timestamp",
              "interval": interval + "s",
              "min_doc_count": 0
            },
            "aggs": {
              "avg_follower_count": {
                "avg": {
                  "field": "circledByCount"
                }
              }
            }
          }
        }
      }
    }, function(err, response) {
      if(err) return res.apiResponse({"error": err});
      var dataReturn = [],
          buckets = mxm.objTry(response, 'aggregations', 'followers', 'buckets');

      if(buckets && buckets.length) {
        dataReturn.push({
          key: startTime.toISOString(),
          value: buckets[0].avg_follower_count.value
        });

        _.each(buckets, function(bucket){
          if(bucket.avg_follower_count && bucket.avg_follower_count.value) {
            dataReturn.push({
              key: bucket.key_as_string,
              value: bucket.avg_follower_count.value
            })
          }
        });

        dataReturn.push({
          key: endTime.toISOString(),
          value: _.last(dataReturn).value
        });


        return res.apiResponse({
          success: true,
          type: 'acquisition',
          source: 'googleplus',
          queryString: req.query,
          data: dataReturn,
          summary: {
            "totalCircledBy": _.last(dataReturn).value,
            "changeInCircledBy": _.last(dataReturn).value - _.first(dataReturn).value
          }
        });    
      } else {
        res.apiResponse({'error': "No Buckets."})
      }
    });
  });
  



}
