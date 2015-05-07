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
    addLocation: function(callback) {
      esClient.indices.putSettings({
        index: indexName,
        body: {
          mappings: {
            _default_: {
              properties: {
                location: {
                  type: 'geo_point'
                },
                country: {
                  type: 'string',
                  index: 'not_analyzed'
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
    },
    twitterFields: function(callback) {
      esClient.indices.putMapping({
        index: indexName,
        type: 'twitter',
        body: {
          twitter: {
            properties: {
              favorite_count: {
                type: 'integer'
              },
              retweet_count: {
                type: 'integer'
              },
              follower_count: {
                type: 'integer'
              },
              in_reply_to_status_id_str: {
                type: 'string',
                index: 'not_analyzed'
              }
            }
          }
        }
      }, callback);
    },
    twitterDeltaFields: function(callback) {
      esClient.indices.putMapping({
        index: indexName,
        type: 'twitter_delta',
        body: {
          twitter_delta: {
            properties: {
              favorite_count: {
                type: 'integer'
              },
              retweet_count: {
                type: 'integer'
              },
              follower_count: {
                type: 'integer'
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
