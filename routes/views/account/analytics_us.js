var keystone = require('keystone');

exports = module.exports = function(req, res) {

  var view = new keystone.View(req, res),
    locals = res.locals;

  locals.section = 'analytics-us';
  locals.showDates = true;
  locals.title = 'Web Analytics - USA';
  locals.tooltip = {
    reach: "",
    engagement: "",
    acquisition: "",
    refTraffic: "Sources for USA Site",
    analyticsTopCountries: "Top Countries",
    overview: ""
  };

  view.render('account/analytics');
};
