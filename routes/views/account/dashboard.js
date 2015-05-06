var keystone = require('keystone');

exports = module.exports = function(req, res) {

	if (req.user) {
		// Remove the facebook string once dashboard is back
	  return res.redirect(req.cookies.target || '/accounts/'+req.user.accountName+'/facebook')
	} else {
		return res.redirect('/signin')
	}

	var view = new keystone.View(req, res),
		locals = res.locals;

	locals.section = 'dashboard';
	locals.showDates = true;
	locals.title = 'Dashboard';
	locals.tooltip = {
		reach: "",
		engagement: "",
		acquisition: "",
		top_post: "",
		top_countries: ""
	};

	view.render('account/index');
};
