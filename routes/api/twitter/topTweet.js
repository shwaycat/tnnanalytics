var keystone = require('keystone'),
    moment = require('moment'),
    debug = require('debug')('cadence:api:twitter:topTweet'),
    _ = require('underscore'),
    twitterMetrics = require('../../../lib/metrics/twitter');

module.exports = function(req, res) {
  var startTime = moment().subtract(1, 'month').toDate(),
      endTime = new Date();

  if(req.query.startTime) {
    startTime = new Date(req.query.startTime);
  }
  if(req.query.endTime) {
    endTime = new Date(req.query.endTime);
  }

  twitterMetrics.topTweet(req.user, startTime, endTime, function(err, response) {
    debug(response);

    if(err) return res.apiResponse({error: err});  

    response.success = true;
    response.type = 'topTweet';
    response.source = 'twitter';
    response.queryString = req.queryString;
    return res.apiResponse(response);
    
  }); 

};
