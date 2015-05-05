var keystone = require('keystone'),
    _ = require('underscore'),
    async = require('async');


exports = module.exports = function(req, res) {
 
  var view = new keystone.View(req, res),
      locals = res.locals;

  var dataReturn = [];
  startTime = new Date("Mar 1, 2015");
  endTime = new Date("Mar 31, 2015");
  if(req.query.startTime) {
    startTime = new Date(req.query.startTime);
  }
  if(req.query.endTime) {
    endTime = new Date(req.query.endTime);
  }
  console.log(startTime.toString());
  console.log(endTime.toString());

  
  var dataReturn = [];
  var timeHolder = startTime;
  while(timeHolder < endTime) {
    timeHolder.setDate(timeHolder.getDate() + 1);
    dataReturn.push( { 
      "key": timeHolder.toJSON(),
      "value": Math.floor(Math.random() * 500)
    });
  }
  // Build Response Here
  // DATA = Array of Key (Date) value pairs.

 
  // Return the response
  view.render(function(err) {
    if (err) return res.apiError('error', err);

    return res.apiResponse({
      success: true,
      type: 'acquisition',
      source: 'twitter',
      queryString: req.query,
      data: dataReturn
    });

  });
 
}
