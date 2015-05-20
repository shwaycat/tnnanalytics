var _ = require('underscore')
  , keystone = require('keystone')


/**
  Initialises the standard view locals
*/

exports.initLocals = function(req, res, next) {

  var locals = res.locals

  locals.socialLinks = {
    "facebook": "https://www.facebook.com/TeamNovoNordisk",
    "twitter": "https://twitter.com/teamnovonordisk",
    "instagram": "https://instagram.com/teamnovonordisk/",
    "youtube": "https://www.youtube.com/user/TeamNovoNordisk",
    "googlePlus": "https://plus.google.com/+teamnovonordisk",
    "analytics": "insertanalyticsurlhere"
  }

  locals.navLinks = [
    { label: 'Dashboard',         type: 'link',             key: 'dashboard',       href: ''},
    { label: 'Social Analytics',  type: 'navigation',       key: 'view-social',     href: false },
    { label: 'Facebook',          type: 'sub-link',         key: 'facebook',        href: 'facebook' },
    { label: 'Twitter',           type: 'sub-link',         key: 'twitter',         href: 'twitter' },
    { label: 'Instagram',         type: 'sub-link',         key: 'instagram',       href: 'instagram' },
    { label: 'Youtube',           type: 'sub-link',         key: 'youtube',         href: 'youtube' },
    { label: 'Google+',           type: 'sub-link',         key: 'google-plus',     href: 'google-plus' },
    { label: 'Web Analytics',     type: 'navigation',       key: 'view-analytics',  href: false },
    { label: 'All',               type: 'sub-link',         key: 'analytics-all',   href: 'analytics-all' },
    { label: 'Global',            type: 'sub-link',         key: 'analytics-global',href: 'analytics-global' },
    { label: 'US',                type: 'sub-link',         key: 'analytics-us',    href: 'analytics-us' },
    { label: 'Keyword Alerts',    type: 'link',             key: 'events',          href: 'events' }
  ]

  locals.footerLinks = [
    { label: 'Terms/Privacy', type: 'view',     key: 'privacy',       href: '/privacy' },
    { label: 'Facebook',      type: 'social',   key: 'facebook',      href: locals.socialLinks.facebook },
    { label: 'Twitter',       type: 'social',   key: 'twitter',       href: locals.socialLinks.twitter },
    { label: 'Instagram',     type: 'social',   key: 'instagram',     href: locals.socialLinks.instagram },
    { label: 'Youtube',       type: 'social',   key: 'youtube',       href: locals.socialLinks.youtube },
    { label: 'Google+',       type: 'social',   key: 'google-plus',   href: locals.socialLinks.googlePlus }
  ]

  locals.sectionTitles = {
    "reach": "Reach",
    "engagement": "Engagement",
    "acquisition": "Acquisition",
    "topFacebookPost": "Top Post",
    "topCountries": "Top Countries - Engagement",
    "topTweet": "Top Tweet",
    "topInstagramPost": "Top Instagram Post",
    "topGooglePost": "Top Google Post",
    "topYoutubeVideo": "Top Youtube Video"
  }

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
