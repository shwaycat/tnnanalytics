var keystone = require('keystone'),
    debug = require('debug')('cadence:metrics:googleanalytics:overview'),
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
            "sum": { "field": "sessions" }
          },
          "bounces": {
            "sum": { "field": "bounces" }
          },
          "pageViews": {
            "sum": { "field": "pageViews" }
          },
          "users": {
            "sum": { "field": "users" }
          },
          "sessionDuration": {
            "sum": { "field": "sessionDuration" }
          }
        }
      }
    }, function(err, response) {
      if(err) return callback(err);

      var summary = {
            totalSessions: 0,
            totalPageViews: 0,
            totalUsers: 0,
            totalBounces: 0,
            totalSessionDuration: 0,
            totalBounceRate: 0.0,
            totalAverageSessionDuration: 0.0
          };

      var buckets = mxm.objTry(response, 'aggregations');

      if(buckets) {
        _.extend(summary, {
          totalSessions: mxm.objTry(buckets, 'sessions', 'value') || 0,
          totalPageViews: mxm.objTry(buckets, 'pageViews', 'value') || 0,
          totalUsers: mxm.objTry(buckets, 'users', 'value') || 0,
          totalBounces: mxm.objTry(buckets, 'bounces', 'value') || 0,
          totalSessionDuration: mxm.objTry(buckets, 'sessionDuration', 'value') || 0
        });

        if (summary.totalSessions) {
          summary.totalBounceRate = (summary.totalBounces / summary.totalSessions)*100;
          summary.totalAverageSessionDuration = summary.totalSessionDuration / summary.totalSessions;
        }
      }

      return callback(null, { summary: summary });
    });
  });
};
