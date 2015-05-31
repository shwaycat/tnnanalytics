var keystone = require('keystone');

exports = module.exports = function(req, res) {

  var view = new keystone.View(req, res),
    locals = res.locals;

  locals.section = 'analytics-all';
  locals.showDates = true;
  locals.title = 'Web Analytics - All';
  locals.tooltip = {
    reach: "",
    engagement: "",
    acquisition: "",
    refTraffic: "Referring Traffic",
    analyticsTopCountries: "Top Countries",
    overview: ""
  };

  view.render('account/analytics');
};
