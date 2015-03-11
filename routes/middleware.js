var _ = require('underscore')
	, keystone = require('keystone')


/**
	Initialises the standard view locals
*/

exports.initLocals = function(req, res, next) {

	var locals = res.locals

	locals.navLinks = [
		{ label: 'Home',		key: 'home',		href: '/' }
	]

	locals.user = req.user

	locals.site = {
		brand: keystone.get('brand'),
		email: keystone.get('brand email'),
	}

	locals.page = {
		path: req.url.split("?")[0]
	}

	locals.basedir = keystone.get('basedir')

	next()

}

/**
	Initialize error handlers
*/

exports.initErrorHandlers = function(req, res, next) {

	res.err = function(err, title, message){
		res.status(500).render('errors/500',{
			err: err,
			errorTitle: title,
			errorMsg: message
		})
	}

	res.notfound = function(title, message) {
		res.status(404).render('errors/404', {
			errorTitle: title,
			errorMsg: message
		})
	}

	next()
}

/**
	Fetches and clears the flashMessages before a view is rendered
*/

exports.flashMessages = function(req, res, next) {

	var flashMessages = {
		info: req.flash('info'),
		success: req.flash('success'),
		warning: req.flash('warning'),
		error: req.flash('error')
	}

	res.locals.messages = _.any(flashMessages, function(msgs) { return msgs.length; }) ? flashMessages : false;

	next()

}


/**
	Prevents people from accessing protected pages when they're not signed in
 */

exports.requireUser = function(req, res, next) {

	if (!req.user) {
		req.flash('error', 'Please sign in to access this page.')
		res.redirect('/keystone/signin')
	} else {
		next()
	}

}
