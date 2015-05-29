var _ = require('underscore'),
    request = require('request'),
    async = require('async'),
    GoogleAPIError = require('../../google-api-error'),
    debug = require('debug')('cadence:google-analytics');

exports.requestOpts = function() {
  var args = Array.prototype.slice.call(arguments),
      user = args.shift(),
      result = {
        url: [ 'https://www.googleapis.com/analytics/v3' ],
        json: true,
        qs: {},
        auth: {
          bearer: user.services.google.accessToken
        }
      };

  if ('object' == typeof args[args.length - 1]) {
    _.extend(result.qs, args.pop());
  }

  result.url = result.url.concat(args).join('/');

  return result;
};

exports.request = function(requestOpts, callback) {
  debug(requestOpts.url);

  request(requestOpts, function (err, res, body) {
    callback(err, body);
  });
};

exports.pager = function(direction, initialRequestOpts, iterator, callback) {
  var requestOpts = initialRequestOpts;

  async.whilst(
    function() { // test
      return requestOpts;
    },
    function(cb) { // iterator
      debug(requestOpts);

      request(requestOpts, function (err, res, body) {
        if (err || body.error) return cb(err || new GoogleAPIError(body));

        if (!body.rows || !body.rows.length) {
          requestOpts = null;
          return cb();
        }

        // iterator(body, function(err) {
        //   if (err == 'stop' || !body[direction]) {
        //     requestOpts = null;
        //   } else if (err) {
        //     return cb(err);
        //   } else {
        //     requestOpts = {
        //       url: body[direction],
        //       json: true,
        //       auth: initialRequestOpts.auth
        //     };
        //   }
        //   cb();
        // });

        async.eachSeries(body.rows, iterator, function(err) {
          if (err == 'stop' || !body[direction]) {
            requestOpts = null;
          } else if (err) {
            return cb(err);
          } else {
            requestOpts = {
              url: body[direction],
              json: true,
              auth: initialRequestOpts.auth
            };
          }
          cb();
        });
      });
    },
    callback
  );
};

exports.refreshAccessToken = function(user, callback) { //(refreshToken, callback) {
  request({
    method: 'POST',
    baseUrl: 'https://www.googleapis.com/',
    uri: '/oauth2/v3/token',
    json: true,
    form: {
      refresh_token: user.services.google.refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token'
    }
  }, function(err, res, body) {
    if (err || body.error) return callback(err || new GoogleAPIError(body));
    debug(body);

    user.set({ 'services.google.accessToken': body.access_token });
    user.save(function(err) {
      if (err) return callback(err);
      console.info("Updated user %s with refreshed access token", user.email);
      callback(null, body.access_token);
    });
  });
};
