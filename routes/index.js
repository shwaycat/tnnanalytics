var keystone = require('keystone')
	, middleware = require('./middleware')
	, importRoutes = keystone.importer(__dirname)

// Common Middleware
keystone.pre('routes', middleware.initErrorHandlers)
keystone.pre('routes', middleware.initLocals)
keystone.pre('render', middleware.flashMessages)

keystone.set('404', function(req, res, next) {
	res.notfound()
})

keystone.set('500', function(err, req, res, next) {
	var title, message

	if (err instanceof Error){
		message = err.message
		err = err.stack
	}

	res.err(err, title, message)
});

// Import Route Controllers
var routes = {
	views: importRoutes('./views'),
	auth: importRoutes('./auth')
}

// Setup Route Bindings
exports = module.exports = function(app) {

	// Unrestricted/General
	app.get('/', routes.views.session.signin);
	app.get('/privacy', routes.views.privacy);
	app.all('/accounts*', middleware.requireUser);
	app.all('/user*', middleware.requireUser);

	// Session
	app.all('/signin', routes.views.session.signin);
	app.get('/signout', routes.views.session.signout);
	app.all('/forgot-password', routes.views.session['forgot-password']);
	app.all('/reset-password/:key', routes.views.session['reset-password']);

	// User
	app.all('/user/:uid', routes.views.user.user);

	// Account
	app.all('/accounts/:accountname', routes.views.account.dashboard);
	app.all('/accounts/:accountname/facebook', routes.views.account.facebook);
	app.all('/accounts/:accountname/twitter', routes.views.account.twitter);
	app.all('/accounts/:accountname/instagram', routes.views.account.instagram);
	app.all('/accounts/:accountname/youtube', routes.views.account.youtube);
	app.all('/accounts/:accountname/google-plus', routes.views.account.google_plus);
	app.all('/accounts/:accountname/analytics-all', routes.views.account.analytics_all);
	app.all('/accounts/:accountname/analytics-global', routes.views.account.analytics_global);
	app.all('/accounts/:accountname/analytics-us', routes.views.account.analytics_us);
	app.all('/accounts/:accountname/events', routes.views.account.events);

	// Auth
	app.all('/auth/confirm', routes.auth.confirm);
	app.all('/auth/app', routes.auth.app);
	app.all('/auth/:service', routes.auth.service);

}
