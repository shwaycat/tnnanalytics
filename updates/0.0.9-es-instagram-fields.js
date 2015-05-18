var keystone = require('keystone'),
    async = require('async');

module.exports = function(done) {
  var esClient = keystone.get('elasticsearch'),
      indexName = keystone.get('elasticsearch index');

  async.series({
    createMappingInstagram: function(callback) {
      esClient.indices.putMapping({
        index: indexName,
        type: 'instagram',
        body: {
          instagram: {
            properties: {
              followed_by: { type: 'integer' },
              likes: { type: 'integer' },
              comments: { type: 'integer'},
              url: {
                type: 'string',
                index: 'no'
              }
            }
          }
        }
      }, callback);
    },
    createMappingInstagramDelta: function(callback) {
      esClient.indices.putMapping({
        index: indexName,
        type: 'instagram_delta',
        body: {
          instagram_delta: {
            properties: {
              original_id: {
                type: 'string',
                index: 'not_analyzed'
              },
              followed_by: { type: 'integer' },
              likes: { type: 'integer' },
              comments: { type: 'integer'}
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
