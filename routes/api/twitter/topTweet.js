var keystone = require('keystone'),
    _ = require('underscore'),
    async = require('async'),
    Tweet = require('../../../lib/sources/twitter/tweet');


exports = module.exports = function(req, res) {
 
  var view = new keystone.View(req, res),
      locals = res.locals;


  // Build Response Here

  keystone.elasticsearch.search({
    index: keystone.get('elasticsearch index'),
    body: {
      "query": {
        "filtered": {
          "query": {
            "term": {
              "doc_type": {
                "value": "tweet"
              }
            }
          },
          "filter": {
            "range": {
              "timestamp": {
                "gte": "now-30d",
                "lte": "now"
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
        console.log(buckets.length);
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
      res.apiError('error', "No buckets.")
    }
  });













  // Return the response
  view.render(function(err) {
    if (err) return res.apiError('error', err);

    return res.apiResponse({
      success: true,
      type: 'topTweet',
      source: 'twitter',
      queryString: req.query,
      data: 'Data Goes Here'
    });

  });
 
}
