var _ = require('underscore'),
    moment = require('moment'),
    keystone = require('keystone'),
    Country = keystone.list('Country');

exports.ElasticsearchBulkManager = require('./elasticsearch-bulk-manager');

exports.objTry = function() {
  var args = Array.prototype.slice.call(arguments),
      obj = args.shift();

  //FIXME shouldn't this be an error condition??
  if(_.isArray(_.first(args))) {
    args = _.first(args);
  }

  args.forEach(function(arg) {
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

/**
 * Get the start time from the query object or default to 1 month ago
 * @param {Object} query - request query object
 * @param {string} query.startTime - start time in ISO8601 format (or falsy)
 * @returns {Date} parsed start time or 1 month ago
 */
exports.getStartTime = function(query) {
  if (query.startTime) {
    return new Date(query.startTime);
  } else {
    return moment().subtract(1, 'month').toDate();
  }
};

/**
 * Get the end time from the query object or default to now
 * @param {Object} query - request query object
 * @param {string} query.endTime - end time in ISO8601 format (or falsy)
 * @returns {Date} parsed end time or now
 */
exports.getEndTime = function(query) {
  if (query.endTime) {
    return new Date(query.endTime);
  } else {
    return new Date();
  }
};

exports.getCountriesMap = function(callback) {
  Country.model.getMap(function(err, map) {
    if(err) return callback(err);
    callback(null, map);
  });
};
