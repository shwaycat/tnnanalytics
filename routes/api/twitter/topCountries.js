var keystone = require('keystone'),
    _ = require('underscore'),
    async = require('async');


exports = module.exports = function(req, res) {
 
  var view = new keystone.View(req, res),
      locals = res.locals;


  // Build Response Here
var fakeTopCountryData = [
      {
        "label": "USA",
        "value": Math.floor(Math.random() * 100)
      },
      {
        "label": "Canada",
        "value": Math.floor(Math.random() * 100)
      },
      {
        "label": "Mexico",
        "value": Math.floor(Math.random() * 100)
      },
      {
        "label": "England",
        "value": Math.floor(Math.random() * 100)
      },
      {
        "label": "Ireland",
        "value": Math.floor(Math.random() * 100)
      },
      {
        "label": "Germany",
        "value": Math.floor(Math.random() * 100)
      },
      {
        "label": "Belgium",
        "value": Math.floor(Math.random() * 100)
      },
      {
        "label": "Russia",
        "value": Math.floor(Math.random() * 100)
      },
      {
        "label": "Japan",
        "value": Math.floor(Math.random() * 100)
      },
      {
        "label": "China",
        "value": Math.floor(Math.random() * 100)
      },
      {
        "label": "TaiWorld",
        "value": Math.floor(Math.random() * 100)
      }

    ]
 
  // Return the response
  view.render(function(err) {
    if (err) return res.apiError('error', err);
 
    return res.apiResponse({
      success: true,
      type: 'topCountries',
      source: 'twitter',
      queryString: req.query,
      data: fakeTopCountryData
    });
 
  });
 
}
