var keystone = require('keystone'),
    debug = require('debug')('cadence:metrics:googleanalytics:sources'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User'),
    _ = require('underscore');

module.exports = function(user, profileName, startTime, endTime, callback) {
  debug("startTime: %s, endTime: %s", startTime, endTime);

  User.model.getAccountRootInfo(user.accountName, function(err, accountRoot) {
    if (err) return callback(err);

    var profileIDs = accountRoot.services.google.analyticsProfiles;

    if (profileName == 'all') {
      profileIDs = _.values(profileIDs);
    } else {
      profileIDs = [ profileIDs[profileName] ];
      if (!profileIDs[0]) {
        return callback(new Error("Invalid analytics profile name"));
      }
    }

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      type: 'googleAnalytics_delta',
      body: {
        "query": {
          "filtered": {
            "filter": {
              "and": [
                {
                   "terms": { "original_id": profileIDs }
                },
                { "exists": { "field": "pageViews" } },
                {
                  "range": {
                    "timestamp": { "gte": startTime, "lte": endTime }
                  }
                }
              ]
            }
          }
        },
        "aggs": {
          "pageViews": {
            "sum": {
              "field": "pageViews"
            }
          },
          "sources": {
            "terms": {
              "field": "trafficSource"
            },
            "aggs": {
              "pageViews": {
                "sum": {
                  "field": "pageViews"
                }
              }
            }
          }
        }
      }
    }, function(err, response) {
      if(err) return callback(err);

      var buckets = mxm.objTry(response, 'aggregations', 'sources', 'buckets'),
          summary = {
            'Other':  mxm.objTry(response, 'aggregations', 'pageViews', 'value') || 0
          };

      if(buckets && buckets.length) {
        _.each(buckets, function(bucket) {
          summary.Other = summary.Other - bucket.pageViews.value;
          summary[bucket.key] = bucket.pageViews.value;
        });
      }

      return callback(null, { summary: summary });
    });
  });
};
