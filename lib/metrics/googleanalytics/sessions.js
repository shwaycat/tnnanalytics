var keystone = require('keystone'),
    debug = require('debug')('cadence:metrics:googleanalytics:sessions'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User'),
    _ = require('underscore');

module.exports = function(user, profileName, startTime, endTime, callback) {
  debug("startTime: %s, endTime: %s", startTime, endTime);

  var interval = mxm.calculateInterval(startTime, endTime, 60*60*24);

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
                  "exists": { "field": "sessions" }
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

      var buckets = mxm.objTry(response, 'aggregations', 'sessions', 'buckets'),
          data = null,
          summary = {
            totalSessions: 0
          };

      if(buckets && buckets.length) {
        data = _.map(buckets, function(bucket) {
          summary.totalSessions += bucket.sessions.value;

          return {
            key: bucket.key_as_string,
            value: bucket.sessions.value
          };
        });

        mxm.cleanupHistogram(data, startTime, endTime);
      }

      callback(null, { data: data, summary: summary });
    });
  });
};
