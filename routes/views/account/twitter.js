var keystone = require('keystone');

exports = module.exports = function(req, res) {

	var view = new keystone.View(req, res),
		locals = res.locals;

	locals.section = 'twitter';
	locals.title = 'Twitter';
	locals.tooltip = {
		reach: "Organic + Paid Impressions",
		engagement: "Retweets + Favorite + Replies + Mentions + Direct Messages",
		acquisition: "Total Followers",
		top_posts: "Favorites + Replies + Retweets",
		top_countries: "Based on Engagement. (Retweets + Favorite + Replies + Mentions + Direct Messages)"
	}

	view.render('account/twitter');
};
