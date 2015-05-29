var keystone = require('keystone'),
    moment = require('moment'),
    debug = require('debug')('cadence:api:twitter:acquisition'),
    _ = require('underscore'),
    async = require('async'),
    metrics = {
      facebook: require('../../../lib/metrics/facebook'),
      twitter: require('../../../lib/metrics/twitter'),
      instagram: require('../../../lib/metrics/instagram'),
      youtube: require('../../../lib/metrics/youtube'),
      googleplus: require('../../../lib/metrics/googleplus')
    };

module.exports = function(req, res) {

  var startTime = moment().subtract(1, 'month').toDate(),
      endTime = new Date();

  if(req.query.startTime) {
    startTime = new Date(req.query.startTime);
  }
  if(req.query.endTime) {
    endTime = new Date(req.query.endTime);
  }

  async.parallel([
    function(callback) { metrics.facebook.acquisition(req.user, startTime, endTime, callback) },
    function(callback) { metrics.twitter.acquisition(req.user, startTime, endTime, callback) },
    function(callback) { metrics.instagram.acquisition(req.user, startTime, endTime, callback) },
    function(callback) { metrics.youtube.acquisition(req.user, startTime, endTime, callback) },
    function(callback) { metrics.googleplus.acquisition(req.user, startTime, endTime, callback) }
  ],
  function(err, results) {
    if(err) return res.apiResponse({error: err});

    var data = _.pluck(results, 'data');
        data = _.compact(data);


    return res.apiResponse(data);

  });


}
