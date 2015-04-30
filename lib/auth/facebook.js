var debug = require('debug')('cadence:auth:facebook'),
    _ = require('underscore'),
    request = require('request'),
    passport = require('passport'),
    passportFacebookStrategy = require('passport-facebook').Strategy;

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
  });
}

exports.authenticateUser = function(req, res, next) {
  debug("starting");

  var strategy = new passportFacebookStrategy(FACEBOOK_CREDENTIALS, facebookStrategyCallback);

  // Pass through authentication to passport
  passport.use(strategy);

  // Save user data once returning from Facebook
  if (_.has(req.query, 'cb')) {
    debug("processing callback");

    passport.authenticate('facebook', { session: false }, function(err, data) {
      if (err) {
        console.error("Error authenticating: %s", err);
        return next(err);
      }
      if (!data) {
        console.error("No data received");
        return next(new Error("No data received from authentication service"));
      }
      if (!data.profile) {
        console.error("Data received but no profile: %j", data);
        return next(new Error("No profile received from authentication service"));
      }

      debug("account data: %j", data.profile);

      var serviceData = {
        isConfigured: true,
        profileId: data.profile.id,
        username: data.profile.username,
        // avatar: 'https://graph.facebook.com/' + data.profile.id + '/picture?width=600&height=600',
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      };

      if (req.user) {
        req.user.set({ 'services.facebook': serviceData });
        req.user.save(function(err) {
          if (err) {
            console.error(err);
            return next({ message: 'Sorry, there was an error processing your account, please try again.' });
          }
          console.info("Updated user %s for facebook with profile %s", req.user.id, data.profile.id);
        });
      } else {
        //TODO login from service
        return next(new Error("User not logged-in."));
      }

      return res.redirect(req.cookies.target || '/accounts/'+req.user.accountName);
    })(req, res, next);
  } else {
    // Process authentication response
    debug("processing authentication");
    var authOpts = { scope: FACEBOOK_AUTH_SCOPES };
    passport.authenticate('facebook', authOpts)(req, res, next);
  }
};

exports.options = {
  page: function(user, callback) {
    request({
      url: 'https://graph.facebook.com/v2.3/me/accounts?access_token=' + user.services.facebook.accessToken,
      json: true
    }, function (err, res, body) {
      if (err) return callback(err);

      var results = {};
      body.data.forEach(function(page) {
        results[page.name] = {
          pageID: page.id,
          pageAccessToken: page.access_token
        };
      });

      callback(null, results);
    });
  }
};
