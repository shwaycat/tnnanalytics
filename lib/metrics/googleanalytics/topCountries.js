var keystone = require('keystone'),
    debug = require('debug')('cadence:metrics:googleanalytics:topCountries'),
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
      searchType: 'count',
      body: {
        "query": {
          "filtered": {
            "filter": {
              "and": [
                {
                   "terms": { "original_id": profileIDs }
                },
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
          "countries": {
            "terms": { "field": "country" },
            "aggs": {
              "sessions": {
                "sum": { "field": "sessions" }
              },
              "bounces": {
                "sum": { "field": "bounces" }
              }
            }
          }
        }
      }
    }, function(err, response) {
      if(err) return callback(err);

      var buckets = mxm.objTry(response, 'aggregations', 'countries', 'buckets'),
          data = [],
          summary = {
            totalSessions: 0,
            totalBounces: 0,
            totalBounceRate: 0.0
          };

      if(buckets && buckets.length) {
        data = _.map(buckets, function(bucket) {
          summary.totalSessions += bucket.sessions.value || 0;
          summary.totalBounces += bucket.bounces.value || 0;

          var result = {
                key: bucket.key.toUpperCase(),
                sessions: bucket.sessions.value || 0,
                bounces: bucket.bounces.value || 0,
                bounceRate: 0.0
              };

          if (result.sessions) {
            result.bounceRate = result.bounces / result.sessions;
          }

          return result;
        });

        data = _.sortBy(data, function(bucket) {
          return bucket.sessions * -1;
        });
      }

      if (summary.totalSessions) {
        summary.totalBounceRate = summary.totalBounces / summary.totalSessions;
      }

      return callback(null, { data: data, summary: summary });
    });
  });
};
