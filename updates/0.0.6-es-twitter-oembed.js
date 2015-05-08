var keystone = require('keystone'),
    async = require('async'),
    _ = require('underscore'),
    elasticsearch = require('elasticsearch');

module.exports = function(done) {
  var esClient = keystone.get('elasticsearch'),
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
                oembed: {
                  type: 'string',
                  index: 'no'
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