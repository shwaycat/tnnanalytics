var keystone = require('keystone'),
    async = require('async');

module.exports = function(done) {
  var esClient = keystone.get('elasticsearch'),
      indexName = keystone.get('elasticsearch index');

  async.series({
    createMappingYoutTube: function(callback) {
      esClient.indices.putMapping({
        index: indexName,
        type: 'youtube',
        body: {
          youtube: {
            properties: {
              viewCount: { type: 'integer' },
              likeCount: { type: 'integer' },
              dislikeCount: { type: 'integer' },
              favoriteCount: { type: 'integer'},
              commentCount: { type: 'integer'},
              subscriberCount: { type: 'integer'}
            }
          }
        }
      }, callback);
    },
    createMappingYoutTubeDelta: function(callback) {
      esClient.indices.putMapping({
        index: indexName,
        type: 'youtube_delta',
        body: {
          youtube_delta: {
            properties: {
              original_id: {
                type: 'string',
                index: 'not_analyzed'
              },
              viewCount: { type: 'integer' },
              likeCount: { type: 'integer' },
              dislikeCount: { type: 'integer' },
              favoriteCount: { type: 'integer'},
              commentCount: { type: 'integer'},
              subscriberCount: { type: 'integer'}
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
