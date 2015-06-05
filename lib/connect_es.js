var keystone = require('keystone')
  , debug = require('debug')('keystone:core:connect_es')
  , _ = require('underscore')
  , elasticsearch = require('elasticsearch')

/**
 * Connect to Elasticsearch.
 *
 * Code modified from keystone/lib/core/mount.js
 */
module.exports = function(done) {
  debug('connecting to elasticsearch');

  var esConnectionOpen = false;

  var esOpts = {}
  if (_.isArray(keystone.get('elasticsearch'))) {
    esOpts.hosts = keystone.get('elasticsearch')
  } else if (keystone.get('elasticsearch')) {
    esOpts.host = keystone.get('elasticsearch')
  }

  [ "ssl", "maxSockets", "minSockets", "log" ].forEach(function(key) {
    if (keystone.get('elasticsearch '+key)) {
      esOpts[key] = keystone.get('elasticsearch '+key);
    }
  });

  debug("Elasticsearch client params: %j", esOpts)

  var esClient = new elasticsearch.Client(esOpts)

  keystone.set('elasticsearch', esClient)
  keystone.elasticsearch = esClient

  keystone.elasticsearch.ping({
    requestTimeout: 1000,
    hello: "elasticsearch!"
  }, function (err) {
    if (!err) {
      debug('elasticsearch connection open');
      esConnectionOpen = true;
    }
    done(err)
  });
}
