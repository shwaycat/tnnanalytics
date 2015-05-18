var keystone = require('keystone');

exports = module.exports = function(req, res) {

  var view = new keystone.View(req, res),
    locals = res.locals;

  locals.section = 'youtube';
  locals.showDates = true;
  locals.title = 'Youtube';
  locals.tooltip = {
    reach: "Total Impressions",
    engagement: "Likes + Shares + Reply + Mention + Comments + Total Number of Views",
    acquisition: "Total Subscribers",
    topYoutubeVideo: "Likes + Shares + Comments + Views",
    topCountries: "Likes + Shares + Reply + Mention + Comments + Total Number of Views"
  };

  view.render('account/youtube');
};
