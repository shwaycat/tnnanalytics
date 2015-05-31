var keystone = require('keystone'),
    debug = require('debug')('cadence:metrics:twitter:topCountries'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User'),
    Country = keystone.list('Country'),
    _ = require('underscore');

module.exports = function(user, startTime, endTime, callback) {

  var interval = (endTime.getTime() - startTime.getTime()) / 24;
      interval = interval / 1000;

  User.model.getAccountRootInfo(user.accountName, function(err, accountRoot) {
    if (err) return callback(err);

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      body: {
        "query": {
          "filtered": {
            "filter": {
              "and": {
                "filters": [
                  {
                    "and": {
                      "filters": [
                        {
                          "terms": {
                            "doc_type": [
                              "mention"
                            ]
                          }
                        },
                        {
                          "exists": {
                            "field": "country"
                          }
                        },
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
          "topCountries": {
            "terms": {
              "field": "country",
              "size": 0      
            }
          }
        }
      }
    }, function(err, response) {
      if(err) return callback(err);
      var dataReturn = [],
          buckets = mxm.objTry(response, 'aggregations', 'topCountries', 'buckets');

      if(buckets && buckets.length) {
        Country.model.getMap(function(err, map) {
          _.each(buckets, function(bucket){
            dataReturn.push(extractDataPoint(bucket));
          });

          return callback(null, {
            map: map,
            data: dataReturn
          });   
        })

      } else {
        return callback(null, {
          data: null
        });
      }
    });
  });
}

function extractDataPoint(bucket) {
  return {
      key: bucket.key.toUpperCase(),
      value: bucket.doc_count
  };
}