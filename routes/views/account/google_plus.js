var keystone = require('keystone');

exports = module.exports = function(req, res) {

  var view = new keystone.View(req, res),
    locals = res.locals;

  locals.section = 'google-plus';
  locals.showDates = true;
  locals.title = 'Google Plus';
  locals.tooltip = {
    reach: "",
    engagement: "Plus 1 + Comments + Shares",
    acquisition: 'Total "Add to Circles"',
    topGooglePost: "Comments + Shares",
    topCountries: "Plus 1 + Comments + Shares "
  };

  view.render('account/google-plus');
};
