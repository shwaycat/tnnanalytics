var keystone = require('keystone'),
    async = require('async'),
    _ = require('underscore'),
    elasticsearch = require('elasticsearch');

module.exports = function(done) {
  var esOpts = {};
  if (_.isArray(keystone.get('elasticsearch'))) {
    esOpts.hosts = keystone.get('elasticsearch');
  } else if (keystone.get('elasticsearch')) {
    esOpts.host = keystone.get('elasticsearch');
  }

  [ "ssl", "maxSockets", "minSockets" ].forEach(function(key) {
    if (keystone.get('elasticsearch '+key)) {
      esOpts.ssl = keystone.get('elasticsearch '+key);
    }
  });

  var esClient = new elasticsearch.Client(esOpts),
      indexName = keystone.get('elasticsearch index');

  async.series({
    closeIndex: function(callback) {
      esClient.indices.close({
        index: indexName
      }, callback);
    },
    addAlertFields: function(callback) {
      esClient.indices.putSettings({
        index: indexName,
        body: {
          mappings: {
            _default_: {
              properties: {
                isNotified: {
                  type: 'boolean'
                },
                alertState: {
                  type: 'string',
                  index: 'not_analyzed'
                },
                alertStateUpdatedAt: {
                  type: 'date',
                  format: 'basic_date_time'
                }
              }
            }
          }
        }
      }, callback);
    },
    openIndex: function(callback) {
      esClient.indices.open({
        index: indexName
      }, callback);
    }
  }, function(err, results) {
    console.log(results);
    if (err) {
      throw err; // boom
    }
    done();
  });
};
