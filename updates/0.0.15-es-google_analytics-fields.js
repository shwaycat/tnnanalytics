var keystone = require('keystone'),
    async = require('async');

module.exports = function(done) {
  var esClient = keystone.get('elasticsearch'),
      indexName = keystone.get('elasticsearch index');

  async.series({
    googleAnalyticsFields: function(callback) {
      esClient.indices.putMapping({
        index: indexName,
        type: 'googleAnalytics',
        body: {
          googleAnalytics: {
            properties: {
              sessions: {
                type: 'integer'
              },
              bounces: {
                type: 'integer'
              },
              pageViews: {
                type: 'integer'
              },
              users: {
                type: 'integer'
              },
              sessionDuration: {
                type: 'integer'
              }
            }
          }
        }
      }, callback);
    },
    googleAnalyticsDeltaFields: function(callback) {
      esClient.indices.putMapping({
        index: indexName,
        type: 'googleAnalytics_delta',
        body: {
          googleAnalytics_delta: {
            properties: {
              sessions: {
                type: 'integer'
              },
              bounces: {
                type: 'integer'
              },
              pageViews: {
                type: 'integer'
              },
              users: {
                type: 'integer'
              },
              sessionDuration: {
                type: 'integer'
              },
              trafficSource: {
                type: 'string',
                index: 'not_analyzed'
              }
            }
          }
        }
      }, callback);
    }
  }, function(err, res) {
    console.log(res);
    if (err) {
      throw err; // boom
    }
    done();
  });
};
