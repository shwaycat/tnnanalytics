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
})

// Import Route Controllers
var routes = {
	views: importRoutes('./views'),
	auth: importRoutes('./auth')
}

// Setup Route Bindings
exports = module.exports = function(app) {

	// Views
	app.get('/', routes.views.site.index)
	app.get('/privacy', routes.views.site.privacy)

	app.all('/me*', middleware.requireUser);
	app.all('/me', routes.views.site.me);

	// Auth
	app.all('/auth/confirm', routes.auth.confirm)
	app.all('/auth/app', routes.auth.app)
	app.all('/auth/:service', routes.auth.service)

	// Session
	app.all('/signin', routes.views.session.signin)
	app.get('/signout', routes.views.session.signout)
	app.all('/forgot-password', routes.views.session['forgot-password'])
	app.all('/reset-password/:key', routes.views.session['reset-password'])
}
