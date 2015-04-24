var async = require('async'),
    debug = require('debug')('cadence:auth:facebook'),
    _ = require('underscore'),
    keystone = require('keystone'),
    User = keystone.list('User'),
    passport = require('passport'),
    passportFacebookStrategy = require('passport-facebook').Strategy,

var FACEBOOK_CREDENTIALS = {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL
    };

var FACEBOOK_AUTH_SCOPES =  [
      'public_profile', 'email',  'user_posts', 'read_page_mailboxes', 'manage_pages'
    ];

function facebookStrategyCallback(accessToken, refreshToken, profile, done) {
  done(null, {
    accessToken: accessToken,
    refreshToken: refreshToken,
    profile: profile
  })
}

exports.authenticateUser = function(req, res, next) {
  var self = this,
      redirect = '/auth/confirm';

  if (req.cookies.target == 'app') {
    redirect = '/auth/app'
  }

  debug("starting authentication process");

  var strategy = new passportFacebookStrategy(FACEBOOK_CREDENTIALS, facebookStrategyCallback);

  // Pass through authentication to passport
  passport.use(strategy);

  // Save user data once returning from Facebook
  if (_.has(req.query, 'cb')) {
    debug("processing callback workflow");

    passport.authenticate('facebook', { session: false }, function(err, data, info) {
      if (err) {
        //TODO flash message
        console.info("Error authenticating with Facebook: %s", err);
        return res.redirect('/');
      }
      if (!data) {
        //TODO flash message
        console.error("No data received from facebook");
        return res.redirect('/');
      }
      if (!data.profile) {
        //TODO flash message
        console.error("Data received from Facebook, but no profile: %j", data);
        return res.redirect('/');
      }

      debug("account data: %j", data.profile);

      req.session.auth = {
        type: 'facebook',
        name: _.pick(data.profile.name, 'first', 'last'),
        email: data.profile.emails[0].value,
        website: data.profile._json.blog,
        profileId: data.profile.id,
        username: data.profile.username,
        avatar: 'https://graph.facebook.com/' + data.profile.id + '/picture?width=600&height=600',
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      };

      return res.redirect(redirect);
    })(req, res, next);
  } else {
    // Perform inital authentication request to Facebook
    debug("processing authentication workflow");
    var authOpts = { scope: FACEBOOK_AUTH_SCOPES };
    passport.authenticate('facebook', authOpts)(req, res, next);
  }
};
