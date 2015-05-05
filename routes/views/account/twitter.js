var keystone = require('keystone');

exports = module.exports = function(req, res) {

	var view = new keystone.View(req, res),
		locals = res.locals;

	locals.section = 'twitter';
	locals.showDates = true;
	locals.title = 'Twitter';
	locals.tooltip = {
		reach: "Organic + Paid Impressions",
		engagement: "Retweets + Favorite + Replies + Mentions + Direct Messages",
		acquisition: "Total Followers",
		topTweet: "Favorites + Replies + Retweets",
		topCountries: "Based on Engagement. (Retweets + Favorite + Replies + Mentions)"
	};

	view.render('account/twitter');
};
