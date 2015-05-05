var keystone = require('keystone');

exports = module.exports = function(req, res) {

	var view = new keystone.View(req, res),
		locals = res.locals;

	locals.section = 'facebook';
	locals.showDates = true;
	locals.title = 'Facebook';
	locals.tooltip = {
		reach: "Organic + Paid Impressions",
		engagement: "Shares + Post Likes + Post Comments + Posts + Mentions",
		acquisition: "All Page Likes",
		topPost: "Likes + Comments + Shares",
		topCountries: "Based on Engagement. (Shares + Post Likes + Post Comments + Posts + Mentions)"
	};

	view.render('account/facebook');
};
