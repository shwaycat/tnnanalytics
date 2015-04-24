var keystone = require('keystone'),
    async = require('async'),
    _ = require('underscore'),
    elasticsearch = require('elasticsearch');

module.exports = function(done) {
  var esOpts = {}
  if (_.isArray(keystone.get('elasticsearch'))) {
    esOpts.hosts = keystone.get('elasticsearch')
  } else if (keystone.get('elasticsearch')) {
    esOpts.host = keystone.get('elasticsearch')
  }
  [ "ssl", "maxSockets", "minSockets" ].forEach(function(key) {
    if (keystone.get('elasticsearch '+key)) {
      esOpts.ssl = keystone.get('elasticsearch '+key)
    }
  })

  var esClient = new elasticsearch.Client(esOpts)
      indexName = keystone.get('elasticsearch index');

  async.series({
    // deleteIndex: function(callback) {
    //   esClient.indices.delete({
    //     index: indexName
    //   }, callback)
    // },
    // deleteAlias: function(callback) {
    //   esClient.indices.delete({
    //     index: indexName
    //   }, callback);
    // },
    createIndex: function(callback) {
      esClient.indices.create({
        index: indexName + '-1'
      }, callback);
    },
    createAlias: function(callback) {
      esClient.indices.putAlias({
        index: indexName + '-1',
        name: indexName
      }, callback);
    },
    closeIndex: function(callback) {
      esClient.indices.close({
        index: indexName
      }, callback);
    },
    addSettings: function(callback) {
      esClient.indices.putSettings({
        index: indexName,
        mappings: {
          _default_: {
            _timestamp: {
              enabled: true,
              store: true,
              ignore_missing: false,
              path: 'timestamp',
              format: 'basic_date_time'
            },
            properties: {
              user_id: {
                type: 'string',
                index: 'not_analyzed'
              },
              user_name: {
                type: 'string',
                index: 'not_analyzed'
              },
              user_lang: {
                type: 'string',
                index: 'not_analyzed'
              },
              cadence_user_id: {
                type: 'string',
                index: 'not_analyzed'
              },
              doc_source: {
                type: 'string',
                index: 'no'
              },
              doc_type: {
                type: 'string',
                index: 'not_analyzed'
              },
              doc_text: {
                type: 'string'
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
    createMappingTwitter: function(callback) {
      esClient.indices.putMapping({
        index: indexName,
        type: 'twitter',
        body: {
          twitter: {
            properties: {
              retweets: { type: 'integer' },
              favorites: { type: 'integer' }
            }
          }
        }
      }, callback);
    },
    createMappingTwitterDelta: function(callback) {
      esClient.indices.putMapping({
        index: indexName,
        type: 'twitter_delta',
        body: {
          twitter_delta: {
            properties: {
              original_id: {
                type: 'string',
                index: 'not_analyzed'
              },
              retweets: { type: 'integer' },
              favorites: { type: 'integer' }
            }
          }
        }
      }, callback);
    },
    createMappingFacebook: function(callback) {
      esClient.indices.putMapping({
        index: indexName,
        type: 'facebook',
        body: {
          facebook: {
            properties: {
              page_id: {
                type: 'string',
                index: 'not_analyzed'
              },
              likes: { type: 'integer' }
            }
          }
        }
      }, callback);
    },
    createMappingFacebookDelta: function(callback) {
      esClient.indices.putMapping({
        index: indexName,
        type: 'facebook_delta',
        body: {
          facebook_delta: {
            properties: {
              original_id: {
                type: 'string',
                index: 'not_analyzed'
              },
              likes: { type: 'integer' }
            }
          }
        }
      }, callback);
    }
  }, function(err, results) {
    console.log(results);
    if (err) {
      console.error(err);
    }
  });
};
