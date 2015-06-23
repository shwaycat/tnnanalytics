var keystone = require('keystone');

exports = module.exports = function(req, res) {

  var view = new keystone.View(req, res),
    locals = res.locals;

  locals.section = 'analytics-global';
  locals.showDates = true;
  locals.title = 'Web Analytics - Global';
  locals.tooltip = {
    reach: "",
    engagement: "",
    acquisition: "",
    refTraffic: "Sources for Global Site",
    analyticsTopCountries: "Top Countries",
    overview: ""
  };

  view.render('account/analytics');
};
