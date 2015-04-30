var debug = require('debug')('cadence:auth:twitter'),
    _ = require('underscore'),
    passport = require('passport'),
    passportTwitterStrategy = require('passport-twitter').Strategy;

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
  });
}

exports.authenticateUser = function(req, res, next) {
  debug("starting");

  var strategy = new passportTwitterStrategy(TWITTER_CREDENTIALS, twitterStrategyCallback);

  // Pass through authentication to passport
  passport.use(strategy);

  // Save user data once returning from Twitter
  if (_.has(req.query, 'cb')) {
    debug("processing callback");

    passport.authenticate('twitter', { session: false }, function(err, data) {
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
        // avatar: data.profile._json.profile_image_url.replace('_normal', ''),
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      };

      if (req.user) {
        req.user.set({ 'services.twitter': serviceData });
        req.user.save(function(err) {
          if (err) {
            console.error(err);
            return next({ message: 'Sorry, there was an error processing your account, please try again.' });
          }
          console.info("Updated user %s for twitter with profile %s", req.user.id, data.profile.id);
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
    passport.authenticate('twitter')(req, res, next);
  }
};
