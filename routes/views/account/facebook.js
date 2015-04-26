var keystone = require('keystone');

exports = module.exports = function(req, res) {

	var view = new keystone.View(req, res),
		locals = res.locals;

	locals.section = 'facebook';
	locals.title = 'Facebook';

	view.render('account/facebook');
};
