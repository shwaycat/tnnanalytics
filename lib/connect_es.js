var url = require('url'),
    chalk = require('chalk'),
    keystone = require('keystone'),
    debug = require('debug')('elasticsearch'),
    _ = require('underscore'),
    elasticsearch = require('elasticsearch');

function ESLogger(config) {
  this.logTrace = !! config.logTrace;
}

ESLogger.prototype.error = function(error) {
  if (error instanceof Error && error.stack) {
    console.error("%s: %s\n%s", chalk.red.bold('elasticsearch ERROR'), error, error.stack);
  } else {
    console.error("%s: %s", chalk.red.bold('elasticsearch ERROR'), error);
  }
};

ESLogger.prototype.warning = function(message) {
  console.warn("%s: %s", chalk.yellow.bold('elasticsearch WARNING'), message);
};

ESLogger.prototype.info = function(message, obj) {
  if (obj) {
    console.info("%s: %s %j", chalk.cyan.bold('elasticsearch INFO'), message, obj);
  } else {
    console.info("%s: %s", chalk.cyan.bold('elasticsearch INFO'), message);
  }
};

ESLogger.prototype.debug = function(message, obj) {
  if (!debug.enabled) return;

  if (obj) {
    debug("%s: %s %j", chalk.magenta.bold('DEBUG'), message, obj);
  } else {
    debug("%s: %s", chalk.magenta.bold('DEBUG'), message);
  }
};

ESLogger.prototype.trace = function(httpMethod, reqURL, reqBody, resBody, resStatus) {
  if (!this.logTrace || !debug.enabled) return;

  var traceID = Math.trunc( Math.random() * Math.pow(36, 20) ).toString(36);

  if ('string' === typeof reqBody && reqBody) {
    reqBody = JSON.parse(reqBody);
  }
  reqBody = reqBody ? "\n" + JSON.stringify(reqBody, null, '  ') : "";
  debug("%s: %s %s%s", chalk.white.bold("TRACE "+traceID), httpMethod, url.format(reqURL), reqBody);

  if ('string' === typeof resBody && resBody) {
    resBody = JSON.parse(resBody);
  }
  resBody = resBody ? "\n" + JSON.stringify(resBody, null, '  ') : "";
  debug("%s: Response %s%s", chalk.white.bold("TRACE "+traceID), resStatus, resBody);
};

/**
 * Connect to Elasticsearch.
 *
 * Code modified from keystone/lib/core/mount.js
 */
module.exports = function(callback) {
  var esOpts = {
        log: ESLogger,
        logTrace: !! keystone.get('elasticsearch trace')
      };

  if (_.isArray(keystone.get('elasticsearch'))) {
    esOpts.hosts = keystone.get('elasticsearch');
  } else if (keystone.get('elasticsearch')) {
    esOpts.host = keystone.get('elasticsearch');
  }

  [ "ssl", "maxSockets", "minSockets" ].forEach(function(key) {
    if (keystone.get('elasticsearch '+key)) {
      esOpts[key] = keystone.get('elasticsearch '+key);
    }
  });

  var esClient = new elasticsearch.Client(esOpts);

  keystone.set('elasticsearch', esClient);
  keystone.elasticsearch = esClient;

  keystone.elasticsearch.ping({
    requestTimeout: 1000,
    hello: "ping"
  }, callback);
};
