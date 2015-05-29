var keystone = require('keystone'),
    moment = require('moment'),
    debug = require('debug')('cadence:api:googleplus:engagement'),
    _ = require('underscore'),
    googleplusMetrics = require('../../../lib/metrics/googleplus');

module.exports = function(req, res) {
  var startTime = moment().subtract(1, 'month').toDate(),
      endTime = new Date();

  if(req.query.startTime) {
    startTime = new Date(req.query.startTime);
  }
  if(req.query.endTime) {
    endTime = new Date(req.query.endTime);
  }

  googleplusMetrics.engagement(req.user, startTime, endTime, function(response) {
    debug(response);

    if(response.error) {
      return res.apiResponse(response);  
    } else {
      response.success = true;
      response.type = 'engagement';
      response.source = 'googleplus';
      response.queryString = req.queryString;
      return res.apiResponse(response);
    }
    
  }); 

};