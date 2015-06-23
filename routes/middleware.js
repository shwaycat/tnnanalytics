var util = require('util'),
    keystone = require('keystone');

/**
 * Static locals
 */
var SOCIAL_LINKS = require('./social-links.json'),
    NAV_LINKS = require('./nav-links.json'),
    SECTION_TITLES = require('./section-titles.json'),
    FOOTER_LINKS = require('./footer-links.json');

FOOTER_LINKS.forEach(function(link) {
  if (link.href) return;
  if (link.key == 'google-plus') {
    link.href = SOCIAL_LINKS.googlePlus;
  } else {
    link.href = SOCIAL_LINKS[link.key];
  }
});

/**
 * Initialises the standard view locals
 */
exports.initLocals = function(req, res, next) {
  res.locals.socialLinks = SOCIAL_LINKS;
  res.locals.navLinks = NAV_LINKS;
  res.locals.sectionTitles = SECTION_TITLES;
  res.locals.footerLinks = FOOTER_LINKS;

  res.locals.site = {
    brand: keystone.get('brand'),
    email: keystone.get('brand email')
  };

  res.locals.basedir = keystone.get('basedir');

  res.locals.user = req.user;

  res.locals.page = {
    path: req.url.split("?")[0]
  };

  res.locals.formData = req.body || {};
  res.locals.validationErrors = {};
  res.locals.enquirySubmitted = false;

  if (req.cookies.target && req.cookies.target == res.locals.page.path) {
    res.clearCookie('target');
  }

  next();
};

/*
 * Initialize error handlers
 */
exports.initErrorHandlers = function(req, res, next) {
  res.err = function(err, title, message) {
    res.format({
      html: function() {
        if (err instanceof Error && keystone.get('env') == 'development') {
          res.status(500).render('errors/500', {
            err: err.stack,
            errorTitle: title || err.name,
            errorMsg: message || err.message
          });
        } else if(err instanceof Error) {
          res.status(500).render('errors/500', {
            errorTitle: title || err.name,
            errorMsg: message || err.message
          });
        } else if ('string' === typeof err) {
          res.status(500).render('errors/500', {
            errorTitle: title || err,
            errorMsg: message || err
          });
        } else {
          res.status(500).render('errors/500', {
            err: err,
            errorTitle: title,
            errorMsg: message
          });
        }
      },
      json: function() {
        if (err instanceof Error && keystone.get('env') == 'development') {
          res.status(200).send({
            error: err.toString(),
            errorStack: err.stack
          });
        } else if(err instanceof Error) {
          res.status(200).send({ error: err.message || err.name });
        } else if ('string' === typeof err) {
          res.status(200).send({ error: err });
        } else {
          res.status(200).send({ error: err });
        }
      }
    });
  };

  res.notfound = function(title, message) {
    res.format({
      html: function() {
        res.status(404).render('errors/404', {
          errorTitle: title,
          errorMsg: message
        });
      },
      json: function() {
        if (title && message) {
          res.status(404).send({ error: util.format("%s: %s", title, message) });
        } else if (title || message) {
          res.status(404).send({ error: title || message });
        } else {
          res.status(404).send({ error: "Not Found" });
        }
      }
    });
  };

  next();
};

var FLASH_MESSAGE_KEYS = [ 'info', 'success', 'warning', 'error' ];
/**
 * Fetches and clears the flashMessages before a view is rendered
 */
exports.flashMessages = function(req, res, next) {
  var noMessages = true;

  res.locals.messages = {};
  FLASH_MESSAGE_KEYS.forEach(function(key) {
    res.locals.messages[key] = req.flash(key);
    if (res.locals.messages[key]) {
      noMessages = false;
    }
  });

  if (noMessages) {
    res.locals.messages = false;
  }

  next();
};


/**
 * Prevents people from accessing protected pages when they're not signed in
 */
exports.requireUser = function(req, res, next) {
  if (!req.user) {
    req.flash('error', 'Please sign in to access this page.');
    res.redirect('/signin');
  } else {
    next();
  }
};
