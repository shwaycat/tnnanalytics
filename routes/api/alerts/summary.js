var keystone = require('keystone'),
    _ = require('underscore'),
    async = require('async'),
    mxm = require('../../../lib/mxm-utils');


exports = module.exports = function(req, res) {
 
  var view = new keystone.View(req, res),
      locals = res.locals;


  keystone.elasticsearch.search({
    index: keystone.get('elasticsearch index'),
    "search_type": "count",
    body: {
      "query": {
        "filtered": {
          "filter": {
            "exists": { "field": "alertState" }
          }
        }
      },
      "aggs": {
        "alertStates": {
          "terms": {"field": "alertState"}
        }
      }
    }
  }, function(err, response){
    if(err) return res.apiResponse({"error": err});
    
    var buckets = mxm.objTry(response, 'aggregations', 'alertStates', 'buckets');
    var data = {};

    if(_.isArray(buckets)) {
      for(i=0;i<buckets.length;i++) {
        bucket = buckets[i];
        data[bucket.key] = bucket.doc_count;
      }
    } else {
      return res.apiResponse({"error": "Error with ES results."});
    }
    
    return res.apiResponse({
      success: true,
      type: 'alert summary',
      source: 'all',
      data: data
    });

  });
  
}