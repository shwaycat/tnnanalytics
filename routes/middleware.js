var _ = require('underscore')
	, keystone = require('keystone')


/**
	Initialises the standard view locals
*/

exports.initLocals = function(req, res, next) {

	var locals = res.locals

	locals.navLinks = [
		{ label: 'Dashboard',			type: 'page-dashboard',		key: 'dashboard',			href: '/accounts/:accountname' },
		{ label: 'Facebook',			type: 'page-social',		key: 'facebook',			href: '/accounts/:accountname/facebook' },
		{ label: 'Twitter',				type: 'page-social',		key: 'twitter',				href: '/accounts/:accountname/twitter' },
		{ label: 'Instagram',			type: 'page-social',		key: 'instagram',			href: '/accounts/:accountname/instagram' },
		{ label: 'Youtube',				type: 'page-social',		key: 'youtube',				href: '/accounts/:accountname/youtube' },
		{ label: 'Google+',				type: 'page-social',		key: 'google-plus',			href: '/accounts/:accountname/google-plus' },
		{ label: 'All',					type: 'page-analytics',		key: 'analytics-all',		href: '/accounts/:accountname/analytics-all' },
		{ label: 'Global',				type: 'page-analytics',		key: 'analytics-global',	href: '/accounts/:accountname/analytics-global' },
		{ label: 'US',					type: 'page-analytics',		key: 'analytics-us',		href: '/accounts/:accountname/analytics-us' },
		{ label: 'Adverse Events',		type: 'page-events',		key: 'events',				href: '/accounts/:accountname/events' }
	]

	locals.footerLinks = [
		{ label: 'Terms/Privacy',		type: 'page',		key: 'privacy',				href: '/privacy' },
		{ label: 'Facebook',			type: 'social',		key: 'facebook',			href: '/facebook' },
		{ label: 'Twitter',				type: 'social',		key: 'twitter',				href: '/twitter' },
		{ label: 'Instagram',			type: 'social',		key: 'instagram',			href: '/instagram' },
		{ label: 'Youtube',				type: 'social',		key: 'youtube',				href: '/youtube' },
		{ label: 'Google+',				type: 'social',		key: 'google-plus',			href: '/google-plus' }
	]

	locals.user = req.user

	locals.site = {
		brand: keystone.get('brand'),
		email: keystone.get('brand email'),
	}

	locals.page = {
		path: req.url.split("?")[0]
	}

  locals.formData = req.body || {}
  locals.validationErrors = {}
  locals.enquirySubmitted = false

	locals.basedir = keystone.get('basedir')

	if (req.cookies.target && req.cookies.target == locals.page.path) res.clearCookie('target');

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
		res.redirect('/signin')
	} else {
		next()
	}

}
