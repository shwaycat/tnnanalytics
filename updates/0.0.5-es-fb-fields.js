var keystone = require('keystone'),
    async = require('async');

module.exports = function(done) {
  var esClient = keystone.get('elasticsearch'),
      indexName = keystone.get('elasticsearch index');

  async.series({
    facebookFields: function(callback) {
      esClient.indices.putMapping({
        index: indexName,
        type: 'facebook',
        body: {
          facebook: {
            properties: {
              shares: {
                type: 'integer'
              }
            }
          }
        }
      }, callback);
    },
    facebookDeltaFields: function(callback) {
      esClient.indices.putMapping({
        index: indexName,
        type: 'facebook_delta',
        body: {
          facebook_delta: {
            properties: {
              shares: {
                type: 'integer'
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
