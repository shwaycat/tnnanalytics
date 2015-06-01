var _ = require('underscore'),
    keystone = require('keystone');

exports.objTry = function() {
  var args = Array.prototype.slice.call(arguments),
      obj = args.shift();

  //FIXME shouldn't this be an error condition??
  if(_.isArray(_.first(args))) {
    args = _.first(args);
  }

  args.forEach(args, function(arg) {
    if (obj && obj[arg]) {
      obj = obj[arg];
    } else {
      obj = undefined;
    }
  });

  return obj;
};

exports.roundToHour = function(date) {
  date.setHours(date.getHours() + Math.round(date.getMinutes()/60));
  date.setSeconds(0);
  date.setMinutes(0);
  return date;
};

exports.calculateInterval = function(startTime, endTime, minimum, segments) {
  if (!minimum) {
    minimum = 60*60; // default is 1 hour
  }

  if (!segments) {
    segments = 24;
  }

  var result = Math.floor((endTime.getTime() - startTime.getTime()) / segments / 1000);

  if (result < minimum) {
    result = minimum;
  }

  return result;
};

var debug = require('debug')('mxm:esbulkmanager');

/**
 * @see https://www.elastic.co/guide/en/elasticsearch/reference/1.x/docs-bulk.html
 */
function ElasticsearchBulkManager(actionLimit) {
  this.actionLimit = actionLimit || 100;
  this.actionCount = 0;
  this.bulkUpdates = [];
}

/**
 * @see https://www.elastic.co/guide/en/elasticsearch/reference/1.x/docs-bulk.html
 */
ElasticsearchBulkManager.prototype.add = function(action, source) {
  this.bulkUpdates.push(action);
  if (source) {
    this.bulkUpdates.push(source);
  }
  this.actionCount++;
  return this.isFull();
};

/**
 * @returns {Boolean} `true` if `actionCount` is `0`
 */
ElasticsearchBulkManager.prototype.isEmpty = function() {
  return this.actionCount === 0;
};

/**
 * @returns {Boolean} `true` if `actionCount` is greater-than or equal-to the `actionLimit`
 */
ElasticsearchBulkManager.prototype.isFull = function() {
  return this.actionCount >= this.actionLimit;
};

/*
 * Run the bulk updates
 */
ElasticsearchBulkManager.prototype.flush = function(callback) {
  var _bulkUpdates = this.bulkUpdates;

  debug("Flushing %s actions", this.actionCount);

  if (!_bulkUpdates.length) return callback(null, null);

  this.bulkUpdates = [];
  this.actionCount = 0;

  keystone.elasticsearch.bulk({ body: _bulkUpdates }, function(err) {
    if (err) return callback(err);
    debug("Flushed");
    callback();
  });
};

/*
 * Run the bulk updates
 */
ElasticsearchBulkManager.prototype.flushIfFull = function(callback) {
  if (!this.isFull()) return callback(null, null);
  this.flush(callback);
};

exports.ElasticsearchBulkManager = ElasticsearchBulkManager;
