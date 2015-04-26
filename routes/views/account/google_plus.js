var keystone = require('keystone');

exports = module.exports = function(req, res) {

	var view = new keystone.View(req, res),
		locals = res.locals;

	locals.section = 'google-plus';
	locals.title = 'Google Plus';

	view.render('account/google-plus');
};
