var keystone = require('keystone'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User'),
    _ = require('underscore');

module.exports = function(user, startTime, endTime, callback) {
  User.model.getAccountRootInfo(user.accountName, function(err, accountRoot) {
    if (err) return callback(err);

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      search_type: 'count',
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

      var data = null,
          buckets = mxm.objTry(response, 'aggregations', 'topCountries', 'buckets');

      if(buckets && buckets.length) {
        data = _.map(buckets, function(bucket) {
          return {
            key: bucket.key.toUpperCase(),
            value: bucket.doc_count
          };
        });
      }

      return callback(null, { data: data });
    });
  });
};
