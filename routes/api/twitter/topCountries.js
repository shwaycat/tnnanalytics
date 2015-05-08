var keystone = require('keystone'),
    _ = require('underscore'),
    async = require('async'),
    Country = keystone.list('Country'),
    mxm = require('../../../lib/mxm-utils');


exports = module.exports = function(req, res) {
 
  var view = new keystone.View(req, res),
      locals = res.locals,
      dataReturn = [];

  startTime = new Date("Mar 1, 2015");
  endTime = new Date("Mar 31, 2015");
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
                      }
                    ]
                  }
                },
                {
                  "range": {
                    "timestamp": {
                      "gte": "0",
                      "lte": "now"
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
    if(err) return res.apiResponse({"error": err});
    var dataReturn = [],
        buckets = mxm.objTry(response, 'aggregations', 'topCountries', 'buckets');

    if(buckets && buckets.length) {
      Country.model.getMap(function(err, map) {
        _.each(buckets, function(bucket){
          dataReturn.push(extractDataPoint(bucket));
        });

        return res.apiResponse({
          success: true,
          type: 'topCountries',
          source: 'twitter',
          map: map,
          data: dataReturn
        });   
      })

    } else {
      res.apiResponse({'error': "No Buckets"})
    }
  });
}

function extractDataPoint(bucket) {
  return {
      code: bucket.key.toUpperCase(),
      value: bucket.doc_count
  };
}




