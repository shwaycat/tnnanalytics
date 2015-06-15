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

exports.calculateInterval = function(startTime, endTime, minimum, segments) {
  if (!minimum) {
    minimum = 60*60; // default is 1 hour
  }

  if (!segments) {
    segments = 24;
  }

  var startMoment = moment(startTime),
      endMoment = moment(endTime),
      resultDuration = moment.duration(endMoment.diff(startMoment) / 24),
      result = Math.round(resultDuration.as('hours')) * 60 * 60;

  if (result < minimum) {
    result = minimum;
  }

  return result;
};

exports.cleanupHistogram = function(data, startTime, endTime) {
  data[0].key = startTime.toISOString();

  _.each(data, function(item) {
    item.value = Math.round(item.value);
  });

  data.push(_.last(data));
  _.last(data).key = endTime.toISOString();

  return data;
};

exports.cleanupHistogramExtended = function(data, startTime, endTime) {
  data[0].key = startTime.toISOString();

  var nonNullIndex = _.findIndex(data, function(item) {
        return null !== item.value;
      });

  for (var i = 0; i <= nonNullIndex; i++) {
    data[i].value = Math.round(data[nonNullIndex].value);
  }

  if (null === data[0].value) {
    data[0].value = 0;
  }

  _.each(data, function(item, i) {
    if (null === item.value) {
      item.value = data[i-1].value;
    } else {
      item.value = Math.round(item.value);
    }
  });

  data.push(_.last(data));
  _.last(data).key = endTime.toISOString();

  return data;
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

/**
 * Gets the first non-zero value of a data set based on a cleaned up histogram.
 * @data
 */
exports.getFirstNonZeroValue = function(data) {
  var firstNonZeroBucket = _.find(data, function(item) { return item.value != 0; });
  return firstNonZeroBucket.value;
}
