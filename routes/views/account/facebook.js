var keystone = require('keystone');

exports = module.exports = function(req, res) {

	var view = new keystone.View(req, res),
		locals = res.locals;

	locals.section = 'facebook';
	locals.title = 'Facebook';
	locals.tooltip = {
		reach: "Organic + Paid Impressions",
		engagement: "Shares + Post Likes + Post Comments + Posts + Mentions",
		acquisition: "All Page Likes",
		top_posts: "Likes + Comments + Shares",
		top_countries: "Based on Engagement. (Shares + Post Likes + Post Comments + Posts + Mentions)"
	}

	view.render('account/facebook');
};
