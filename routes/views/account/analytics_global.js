var keystone = require('keystone');

exports = module.exports = function(req, res) {

	var view = new keystone.View(req, res),
		locals = res.locals;

	locals.section = 'analytics-global';
	locals.title = 'Web Analytics - Global';
	locals.tooltip = {
		reach: "",
		engagement: "",
		acquisition: "",
		top_posts: "",
		top_countries: ""
	};

	view.render('account/analytics');
};
