var debug = require('debug')('cadence:auth:google'),
    _ = require('underscore'),
    request = require('request'),
    passport = require('passport'),
    passportGoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var GOOGLE_CREDENTIALS = {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    };

var GOOGLE_AUTH_SCOPES = [
      'https://www.googleapis.com/auth/plus.login',
      'https://www.googleapis.com/auth/plus.profile.emails.read',
      'https://www.googleapis.com/auth/plus.me',
      'https://www.googleapis.com/auth/analytics.readonly'
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
        req.user.set({ 'services.google': serviceData });
        req.user.save(function(err) {
          if (err) {
            console.error(err);
            return next({ message: 'Sorry, there was an error processing your account, please try again.' });
          }
          console.info("Updated user %s for Google with profile %s", req.user.id, data.profile.id);
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
    url: 'https://www.googleapis.com/analytics/v3/management/accountSummaries',
    qs: {
      fields: 'items(webProperties(id,name,profiles)),nextLink,totalResults'
    },
    auth: {
      bearer: user.services.google.accessToken
    },
    json: true
  }, function (err, res, body) {
    if (err) return callback(err);

    var items = _.chain(body.items)
          .pluck('webProperties')
          .flatten()
          .collect(function(wp) {
            return _.collect(wp.profiles, function(p) {
              p.name = wp.name + ' - ' + p.name;
              return _.pick(p, 'id', 'name');
            });
          })
          .flatten(true)
          .value();

    callback(null, { analyticsProfiles: items });
  });
};
