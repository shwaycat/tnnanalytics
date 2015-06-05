var _ = require('underscore'),
    debug = require('debug')('cadence:api:googleanalytics:sources'),
    metrics = require('../../../lib/metrics/googleanalytics'),
    mxm = require('../../../lib/mxm-utils');

module.exports = function(req, res, next) {
  var profileName = req.params.profileName,
      startTime = mxm.getStartTime(req.query),
      endTime = mxm.getEndTime(req.query);

  metrics.sources(req.user, profileName, startTime, endTime, function(err, response) {
    debug(response);

    if(err) return next(err);

    res.apiResponse(_.extend(response, {
      success: true,
      source: 'google-analytics',
      type: 'sources',
      query: req.query
    }));
  });
};
