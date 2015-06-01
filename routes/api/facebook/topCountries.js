var keystone = require('keystone'),
    Country = keystone.list('Country'),
    moment = require('moment'),
    debug = require('debug')('cadence:api:facebook:topCountries'),
    facebookMetrics = require('../../../lib/metrics/facebook');

function addCountriesMap(response, callback) {
  Country.model.getMap(function(err, map) {
    if(err) return callback(err);
    response.map = map;
    callback(null, response);
  });
}

module.exports = function(req, res) {
  var startTime = moment().subtract(1, 'month').toDate(),
      endTime = new Date();

  if(req.query.startTime) {
    startTime = new Date(req.query.startTime);
  }
  if(req.query.endTime) {
    endTime = new Date(req.query.endTime);
  }

  facebookMetrics.topCountries(req.user, startTime, endTime, function(err, response) {
    debug(response);

    if(err) return res.apiResponse({error: err});

    addCountriesMap(response, function(err, response) {
      if(err) return res.apiResponse({error: err});

      response.success = true;
      response.type = 'topCountries';
      response.source = 'facebook';
      response.queryString = req.queryString;
      return res.apiResponse(response);
    });
  });
};
