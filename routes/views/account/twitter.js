var keystone = require('keystone');

exports = module.exports = function(req, res) {

	var view = new keystone.View(req, res),
		locals = res.locals;

	locals.section = 'twitter';
	locals.title = 'Twitter';
	locals.tooltip = {
		reach: "Organic + Paid Impressions",
		engagement: "Retweets + Favorite + Replies + Mentions",
		acquisition: "Total Followers",
		top_tweet: "Favorites + Replies + Retweets",
		top_countries: "Based on Engagement. (Retweets + Favorite + Replies + Mentions)"
	};

	view.render('account/twitter');
};
