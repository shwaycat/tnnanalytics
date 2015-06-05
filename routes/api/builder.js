var debug = require('debug'),
    _ = require('underscore'),
    async = require('async'),
    mxm = require('../../lib/mxm-utils'),
    metrics = require('../../lib/metrics');

/**
 * Build an api route based on the given metric function
 * @param {String} metricSource - source identifier
 * @param {String} metricName - metric type identifier
 * @return {Function} route
 */
module.exports = function(metricSource, metricType) {
  if (!metrics[metricSource]) throw new Error("Invalid metricSource: "+metricSource);
  if (!metrics[metricSource][metricType]) throw new Error("Invalid metricType: "+metricType);

  var metric = metrics[metricSource][metricType],
      _debug = debug('cadence:api:builder:'+metricSource+':'+metricType);

  return function(req, res, next) {
    if (req.body && !_.isEmpty(req.body)) {
      _debug("Body: %j", req.body);
    }

    var startTime = mxm.getStartTime(req.query),
        endTime = mxm.getEndTime(req.query),
        tasks = {};

    tasks.data = function(callback) {
      metric(req.user, startTime, endTime, function(err, response) {
        _debug("Data: %j", response);
        return callback(err, response);
      });
    };

    if (metricType == 'topCountries') {
      tasks.map = mxm.getCountriesMap;
    }

    async.parallel(tasks, function(err, results) {
      if(err) return next(err);

      var theMap = results.map || {};

      res.apiResponse(_.extend(results.data, {
        success: true,
        source: metricSource,
        type: metricType,
        query: req.query,
        map: theMap
      }));
    });
  };
};
