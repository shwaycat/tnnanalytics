var keystone = require('keystone'),
    async = require('async');

module.exports = function(done) {
  var esClient = keystone.get('elasticsearch'),
      indexName = keystone.get('elasticsearch index');

  async.series({
    createYoutubeCommentMapping: function(callback) {
      esClient.indices.putMapping({
        index: indexName,
        type: 'youtube',
        body: {
          youtube: {
            properties: {
              videoID: { 
                type: 'string', 
                index: 'not_analyzed'
              },
              channelID: {
                type: 'string',
                index: 'not_analyzed'
              },
              parentID: {                
                type: 'string',
                index: 'not_analyzed'
              }
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
