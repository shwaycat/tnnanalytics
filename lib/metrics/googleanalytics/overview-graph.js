var keystone = require('keystone'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User'),
    _ = require('underscore');

module.exports = function(user, profileName, startTime, endTime, callback) {
  var interval = mxm.calculateInterval(startTime, endTime);

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
      search_type: 'count',
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
          "sessions": {
            "date_histogram": {
              "field": "timestamp",
              "interval": interval + "s",
              "min_doc_count": 0,
              "extended_bounds": {
                "min": startTime,
                "max": endTime
              }
            },
            "aggs": {
              "sessions": {
                "sum": {
                  "field": "sessions"
                }
              }
            }
          }
        }
      }
    }, function(err, response) {
      if(err) return callback(err);

      var summary = {
            totalSessions: 0
          };

      var aggs = mxm.objTry(response, 'aggregations'),
          buckets = mxm.objTry(aggs, 'sessions', 'buckets'),
          data = null;

      if(aggs) {

        if (buckets && buckets.length) {
          data = _.map(buckets, function(bucket) {
            summary.totalSessions += bucket.sessions.value;

            return {
              key: bucket.key_as_string,
              value: bucket.sessions.value
            };
          });

          mxm.cleanupHistogram(data, startTime, endTime);
        }

        if (summary.totalSessions) {
          summary.totalBounceRate = summary.totalBounces / summary.totalSessions;
          summary.totalAverageSessionDuration = summary.totalSessionDuration / summary.totalSessions;
        }
      }

      return callback(null, { data: data, summary: summary });
    });
  });
};
