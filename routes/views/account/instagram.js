var keystone = require('keystone');

exports = module.exports = function(req, res) {

	var view = new keystone.View(req, res),
		locals = res.locals;

	locals.section = 'instagram';
	locals.showDates = true;
	locals.title = 'Instagram';
	locals.tooltip = {
		reach: "",
		engagement: "",
		acquisition: "",
		topInstagramPost: "",
		topCountries: ""
	};

	view.render('account/instagram');
};
