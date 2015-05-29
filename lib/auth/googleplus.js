var debug = require('debug')('cadence:auth:google'),
    _ = require('underscore'),
    request = require('request'),
    passport = require('passport'),
    passportGoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var GOOGLE_CREDENTIALS = {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLEPLUS_CALLBACK_URL
    };

var GOOGLE_AUTH_SCOPES = [
      'https://www.googleapis.com/auth/plus.login',
      'https://www.googleapis.com/auth/plus.profile.emails.read',
      'https://www.googleapis.com/auth/plus.me',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly'
    ];

function googleStrategyCallback(accessToken, refreshToken, profile, done) {
  done(null, {
    accessToken: accessToken,
    refreshToken: refreshToken,
    profile: profile
  });
}

exports.authenticateUser = function(req, res, next) {
  debug("starting");

  var strategy = new passportGoogleStrategy(GOOGLE_CREDENTIALS, googleStrategyCallback);

  // Pass through authentication to passport
  passport.use(strategy);

  // Save user data once returning from Google
  if (_.has(req.query, 'cb')) {
    debug("processing callback");

    passport.authenticate('google', { session: false }, function(err, data) {
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
        username: data.profile.emails[0].value,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      };

      if (req.user) {
        req.user.set({ 'services.googleplus': serviceData });
        req.user.save(function(err) {
          if (err) {
            console.error(err);
            return next({ message: 'Sorry, there was an error processing your account, please try again.' });
          }
          console.info("Updated user %s for Google plus with profile %s", req.user.id, data.profile.id);
        });
      } else {
        //TODO login from service
        return next(new Error("User not logged-in."));
      }

      return res.redirect('/auth/'+req.params.service+'/setup');
    })(req, res, next);
  } else {
    // Process authentication response
    debug("processing authentication");
    var authOpts = {
      accessType: 'offline',
      approvalPrompt: 'force',
      scope: GOOGLE_AUTH_SCOPES
    };
    passport.authenticate('google', authOpts)(req, res, next);
  }
};


exports.getSetupOptions = function(user, callback) {
  request({
    url: 'https://www.googleapis.com/youtube/v3/channels',
    qs: {
      part: 'snippet',
      mine: true,
      fields: 'items(id,snippet(title))'
    },
    auth: {
      bearer: user.services.googleplus.accessToken
    },
    json: true
  }, function (err, res, body) {
    debug("youtube channel data: %j", body);
    if (err) return callback(err);

    var items = _.collect(body.items, function(item) {
          return { id: item.id, title: item.snippet.title };
        });

    callback(null, { youtubeChannels: items });
  });
};
