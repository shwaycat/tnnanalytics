var async = require('async'),
    debug = require('debug')('cadence:auth:twitter'),
    _ = require('underscore'),
    keystone = require('keystone'),
    User = keystone.list('User'),
    passport = require('passport'),
    passportTwitterStrategy = require('passport-twitter').Strategy,

var TWITTER_CREDENTIALS = {
      consumerKey: process.env.TWITTER_API_KEY,
      consumerSecret: process.env.TWITTER_API_SECRET,
      callbackURL: process.env.TWITTER_CALLBACK_URL
    };

function twitterStrategyCallback(accessToken, refreshToken, profile, done) {
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

  var strategy = new passportTwitterStrategy(TWITTER_CREDENTIALS, twitterStrategyCallback);

  // Pass through authentication to passport
  passport.use(strategy);

  // Save user data once returning from Twitter
  if (_.has(req.query, 'cb')) {
    debug("processing callback workflow");

    passport.authenticate('twitter', { session: false }, function(err, data, info) {
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

      var profile = JSON.parse(data.profile._raw),
          profileWebsiteURL = null;
      if (profile.entities.url && profile.entities.url.urls) {
        if (profile.entities.url.urls.length > 0) {
          profileWebsiteURL = profile.entities.url.urls[0].expanded_url;
        }
      }

      req.session.auth = {
        type: 'twitter',
        name: _.pick(data.profile.name, 'first', 'last'),
        email: data.profile.emails[0].value,
        website: profileWebsiteURL,
        profileId: data.profile.id,
        username: data.profile.username,
        avatar: data.profile._json.profile_image_url.replace('_normal', ''),
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      };

      return res.redirect(redirect);
    })(req, res, next);
  } else {
    // Perform inital authentication request to Twitter
    debug("processing authentication workflow");
    passport.authenticate('twitter')(req, res, next)
  }
}
