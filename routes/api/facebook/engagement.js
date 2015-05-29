var keystone = require('keystone'),
    moment = require('moment'),
    debug = require('debug')('cadence:api:facebook:engagement'),
    _ = require('underscore'),
    facebookMetrics = require('../../../lib/metrics/facebook');

module.exports = function(req, res) {
  var startTime = moment().subtract(1, 'month').toDate(),
      endTime = new Date();

  if(req.query.startTime) {
    startTime = new Date(req.query.startTime);
  }
  if(req.query.endTime) {
    endTime = new Date(req.query.endTime);
  }

  facebookMetrics.engagement(req.user, startTime, endTime, function(response) {
    debug(response);

    if(response.error) {
      return res.apiResponse(response);  
    } else {
      response.success = true;
      response.type = 'engagement';
      response.source = 'facebook';
      response.queryString = req.queryString;
      return res.apiResponse(response);
    }
    
  }); 

};
