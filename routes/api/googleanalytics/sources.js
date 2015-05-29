var // keystone = require('keystone'),
    moment = require('moment'),
    debug = require('debug')('cadence:api:googleanalytics:sources'),
    // _ = require('underscore'),
    googleAnalyticsMetrics = require('../../../lib/metrics/googleanalytics');

module.exports = function(req, res) {
  var startTime = moment().subtract(1, 'month').toDate(),
      endTime = new Date();

  if(req.query.startTime) {
    startTime = new Date(req.query.startTime);
  }
  if(req.query.endTime) {
    endTime = new Date(req.query.endTime);
  }

  googleAnalyticsMetrics.sources(req.user, req.params.profileName, startTime, endTime, function(err, response) {
    debug(response);

    if(err) return res.apiResponse({error: err});

    response.success = true;
    response.type = 'google-analytics';
    response.source = 'sources';
    response.queryString = req.queryString;
    return res.apiResponse(response);
  });
};
