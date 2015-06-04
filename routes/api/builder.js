var keystone = require('keystone'),
    moment = require('moment'),
    debug = require('debug')('cadence:api:builder'),
    _ = require('underscore'),
    metrics = require('../../lib/metrics');

/**
 * Get the start time from the query object or default to 1 month ago
 * @param {Object} query - request query object
 * @param {string} query.startTime - start time in ISO8601 format (or falsy)
 * @returns {Date} parsed start time or 1 month ago
 */
function getStartTime(query) {
  if (query.startTime) {
    return new Date(query.startTime);
  } else {
    return moment().subtract(1, 'month').toDate();
  }
}

/**
 * Get the end time from the query object or default to now
 * @param {Object} query - request query object
 * @param {string} query.endTime - end time in ISO8601 format (or falsy)
 * @returns {Date} parsed end time or now
 */
function getEndTime(query) {
  if (query.endTime) {
    return new Date(query.endTime);
  } else {
    return new Date();
  }
}

function getMetric(metricSource, metricType) {
  if (!metrics[metricSource]) throw new Error("Invalid metricSource: "+metricSource);
  if (!metrics[metricSource][metricType]) throw new Error("Invalid metricType: "+metricType);

  return metrics[metricSource][metricType];
}

/**
 * Build an api route based on the given metric function
 * @param {String} metricSource - source identifier
 * @param {String} metricName - metric type identifier
 * @return {Function} route
 */
module.exports = function(metricSource, metricType) {
  var metric = getMetric(metricSource, metricType);

  return function(req, res, next) {
    if (req.body && !_.isEmpty(req.body)) {
      debug("%s:%s Body: %j", metricSource, metricType, req.body);
    }

    var startTime = getStartTime(req.query),
        endTime = getEndTime(req.query);

    metric(req.user, startTime, endTime, function(err, response) {
      debug(response);

      if(err) return next(err);

      res.apiResponse(_.extend(response, {
        success: true,
        source: metricSource,
        type: metricType,
        query: req.query
      }));
    });
  };
};
