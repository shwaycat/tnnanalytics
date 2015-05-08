var keystone = require('keystone'),
    _ = require('underscore'),
    async = require('async'),
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

  keystone.elasticsearch.search({
    index: keystone.get('elasticsearch index'),
    body: {
      "query": {
        "filtered": {
          "filter": {
            "and": {
              "filters": [
                { "exists": { "field": "followers_count" } },
                { "range": {
                    "timestamp": {
                      "gte": startTime,
                      "lte": endTime
                    }
                  } }
              ]
            }
          }
        }
      },
      "aggs": {
        "followers": {
          "date_histogram": {
            "field": "timestamp",
            "interval": "30m",
            "min_doc_count": 0
          },
          "aggs": {
            "avg_follower_count": {
              "avg": {
                "field": "followers_count"
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
        source: 'twitter',
        queryString: req.query,
        data: dataReturn,
        summary: {
          "totalFollowers" : _.last(dataReturn).value
        }
      });    
    } else {
      res.apiResponse('error', "No buckets.")
    }
  });
  



}
