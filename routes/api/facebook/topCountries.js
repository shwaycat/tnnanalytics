var keystone = require('keystone'),
    moment = require('moment'),
    debug = require('debug')('cadence:api:facebook:topCountries'),
    mxm = require('../../../lib/mxm-utils'),
    _ = require('underscore'),
    User = keystone.list('User'),
    Country = keystone.list('Country');

module.exports = function(req, res) {
  var startTime = moment().subtract(1, 'month').toDate(),
      endTime = new Date();

  if(req.query.startTime) {
    startTime = new Date(req.query.startTime);
  }
  if(req.query.endTime) {
    endTime = new Date(req.query.endTime);
  }

  debug("startTime: %s, endTime: %s", startTime, endTime);

  User.model.getAccountRootInfo(req.user.accountName, function(err, accountRoot) {
    if (err) return res.apiResponse({ error: err });

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      type: 'facebook_delta',
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
      if(err) return res.apiResponse({ error: err });

      var buckets = mxm.objTry(response, 'aggregations', 'topCountries', 'buckets');

      if(buckets && buckets.length) {
        Country.model.getMap(function(err, map) {
          if(err) return res.apiResponse({ error: err });

          var data = _.map(buckets, function(bucket) {
                return {
                  key: bucket.key.toUpperCase(),
                  value: bucket.likes.value
                };
              });

          data = _.sortBy(data, function(bucket) {
            return bucket.value * -1;
          });

          return res.apiResponse({
            success: true,
            type: 'topCountries',
            source: 'facebook',
            queryString: req.query,
            map: map,
            data: data
          });
        });
      } else {
        res.apiResponse({ error: "No buckets." });
      }
    });
  });
};
