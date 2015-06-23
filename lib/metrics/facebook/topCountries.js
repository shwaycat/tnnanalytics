var keystone = require('keystone'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User'),
    _ = require('underscore');

module.exports = function(user, startTime, endTime, callback) {
  User.model.getAccountRootInfo(user.accountName, function(err, accountRoot) {
    if (err) return callback(err);

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      type: 'facebook_delta',
      search_type: 'count',
      body: {
        "query": {
          "filtered": {
            "filter": {
              "and": {
                "filters": [
                  { "term": { "original_id": accountRoot.services.facebook.pageID } },
                  { "exists": { "field": "country" } },
                  { "exists": { "field": "likesByCountry" } },
                  {
                    "range": {
                      "timestamp": { "gte": startTime, "lte": endTime }
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
            },
            "aggs": {
              "likes": {
                "sum": {
                  "field": "likesByCountry"
                }
              }
            }
          }
        }
      }
    }, function(err, response) {
      if(err) return callback(err);

      var buckets = mxm.objTry(response, 'aggregations', 'topCountries', 'buckets'),
          data = null;

      if(buckets && buckets.length) {
        data = _.map(buckets, function(bucket) {
          return {
            key: bucket.key.toUpperCase(),
            value: bucket.likes.value
          };
        });

        data = _.sortBy(data, function(bucket) {
          return bucket.value * -1;
        });
      }

      return callback(null, { data: data });
    });
  });
};
