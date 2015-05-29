var keystone = require('keystone'),
    async = require('async');

module.exports = function(done) {
  var esClient = keystone.get('elasticsearch'),
      indexName = keystone.get('elasticsearch index');

  async.series({
    createMappingGooglePlus: function(callback) {
      esClient.indices.putMapping({
        index: indexName,
        type: 'googleplus',
        body: {
          googleplus: {
            properties: {
              url: {
                type: 'string',
                index: 'no'
              },
              plusOneCount: { type: 'integer' },
              circledByCount: { type: 'integer' },
              replies: { type: 'integer' },
              plusoners: { type: 'integer' },
              resharers: { type: 'integer' }
            }
          }
        }
      }, callback);
    },
    createMappingGooglePlusDelta: function(callback) {
      esClient.indices.putMapping({
        index: indexName,
        type: 'googleplus_delta',
        body: {
          googleplus_delta: {
            properties: {
              original_id: {
                type: 'string',
                index: 'not_analyzed'
              },
              plusOneCount: { type: 'integer' },
              circledByCount: { type: 'integer' },
              replies: { type: 'integer' },
              plusoners: { type: 'integer' },
              resharers: { type: 'integer' }
            }
          }
        }
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
