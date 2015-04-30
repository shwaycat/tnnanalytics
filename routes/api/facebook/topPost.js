var keystone = require('keystone'),
    _ = require('underscore'),
    async = require('async');


exports = module.exports = function(req, res) {
 
  var view = new keystone.View(req, res),
      locals = res.locals;

  locals.args = {
    dateFrom: req.params.dateFrom,
    dateTo: req.params.dateTo
  };


  // Build Response Here


  // Return the response
  view.render(function(err) {
    if (err) return res.apiError('error', err);

    res.apiResponse({
      success: true,
      type: 'topPost',
      source: 'facebook',
      dateFrom: locals.args.dateFrom,
      dateTo: locals.args.dateTo,
      data: 'Data Goes Here' //Consider returning the FB api that has the formatted post.
    });
 
  });
 
}
