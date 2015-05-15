var debug = require('debug')('cadence:auth:instagram'),
    _ = require('underscore'),
    passport = require('passport'),
    passportInstagramStrategy = require('passport-instagram').Strategy;

var INSTAGRAM_CREDENTIALS = {
      clientID: process.env.INSTAGRAM_CLIENT_ID,
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
      callbackURL: process.env.INSTAGRAM_CALLBACK_URL
    };

function instagramStrategyCallback(accessToken, refreshToken, profile, done) {
  done(null, {
    accessToken: accessToken,
    refreshToken: refreshToken,
    profile: profile
  });
}

exports.authenticateUser = function(req, res, next) {
  debug("starting");

  var strategy = new passportInstagramStrategy(INSTAGRAM_CREDENTIALS, instagramStrategyCallback);

  // Pass through authentication to passport
  passport.use(strategy);

  // Save user data once returning from Twitter
  if (_.has(req.query, 'code')) {
    debug("processing callback");

    passport.authenticate('instagram', { session: false }, function(err, data) {
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
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      };

      if (req.user) {
        req.user.set({ 'services.instagram': serviceData });
        req.user.save(function(err) {
          if (err) {
            console.error(err);
            return next({ message: 'Sorry, there was an error processing your account, please try again.' });
          }
          console.info("Updated user %s for instagram with profile %s", req.user.id, data.profile.id);
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
    passport.authenticate('instagram')(req, res, next);
  }
};
