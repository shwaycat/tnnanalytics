var keystone = require('keystone');

exports = module.exports = function(req, res) {

	var view = new keystone.View(req, res),
		locals = res.locals;

	locals.section = 'analytics-us';
	locals.title = 'Web Analytics - US';
	locals.tooltip = {
		reach: "",
		engagement: "",
		acquisition: "",
		top_post: "",
		top_countries: ""
	};

	view.render('account/analytics');
};
