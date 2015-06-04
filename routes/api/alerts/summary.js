var keystone = require('keystone'),
    _ = require('underscore'),
    User = keystone.list('User'),
    mxm = require('../../../lib/mxm-utils');

module.exports = function(req, res, next) {
  User.model.getAccountRootInfo(req.user.accountName, function(err, accountRoot) {
    if (err) return next(err);

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      "search_type": "count",
      body: {
        "query": {
          "filtered": {
            "filter": {
              "and": {
                "filters": [
                  {"exists": { "field": "alertState" } },
                  {"term": { "cadence_user_id": accountRoot.id } }
                ]
              }
            }
          }
        },
        "aggs": {
          "alertStates": {
            "terms": {
              "field": "alertState"
            }
          }
        }
      }
    }, function(err, response){
      if(err) return next(err);

      var buckets = mxm.objTry(response, 'aggregations', 'alertStates', 'buckets'),
          data = {};

      _.each(buckets, function(bucket) {
        data[bucket.key] = bucket.doc_count;
      });

      return res.apiResponse({
        success: true,
        type: 'alert summary',
        source: 'all',
        data: data
      });
    });
  });
};
