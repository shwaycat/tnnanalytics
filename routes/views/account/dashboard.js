var keystone = require('keystone');

exports = module.exports = function(req, res) {

  if (!req.user) {
    return res.redirect('/signin')
  }

  var view = new keystone.View(req, res),
    locals = res.locals;

  locals.section = 'dashboard';
  locals.showDates = true;
  locals.title = 'Dashboard';
  locals.tooltip = {
    reach: "Facebook + Youtube",
    engagement: "Facebook + Twitter + Instagram + Google+ + Youtube",
    acquisition: "Facebook + Twitter + Instagram + Google+ + Youtube",
    refTraffic: "Sources for USA and Global Site"
  };

  view.render('account/index');
};
