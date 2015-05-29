var keystone = require('keystone'),
    debug = require('debug')('cadence:metrics:googleplus:acquisition'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User'),
    _ = require('underscore');

module.exports = function(user, startTime, endTime, callback) {

  var interval = (endTime.getTime() - startTime.getTime()) / 24;
      interval = interval / 1000;

  User.model.getAccountRootInfo(user.accountName, function(err, accountRoot) {
    if (err) return callback({'error': err});

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
      if(err) return callback({"error": err});
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


        return callback({
          data: dataReturn,
          summary: {
            "totalCircledBy": _.last(dataReturn).value,
            "changeInCircledBy": _.last(dataReturn).value - _.first(dataReturn).value
          }
        });    
      } else {
        return callback({
          data: null,
          summary: {
            "totalCircledBy": 0,
            "changeInCircledBy": 0
          }
        });
      }
    });
  });

}