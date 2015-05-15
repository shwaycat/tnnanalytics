var _ = require('underscore'),
    request = require('request'),
    async = require('async'),
    debug = require('debug')('cadence:instagram'),
    instaSig = require('passport-instagram').signature,
    URL = require('url');


exports.requestOpts = function() {
  var args = Array.prototype.slice.call(arguments),
      user = args.shift(),
      result = {
        url: [ 'https://api.instagram.com/v1' ],
        json: true,
        qs: {
          access_token: user.services.instagram.accessToken
        }
      };

  if ('object' == typeof _.last(args)) {
    _.extend(result.qs, args.pop());
  }

  result.url = result.url.concat(args).join('/');

  return result;
};

exports.request = function(requestOpts, callback) {
  instaSig.signParams(requestOpts.url, requestOpts.qs, process.env.INSTAGRAM_CLIENT_SECRET);

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

      instaSig.signParams(requestOpts.url, requestOpts.qs, process.env.INSTAGRAM_CLIENT_SECRET);

      debug(requestOpts);

      request(requestOpts, function (err, res, body) {
        if (err) return cb(err);

        var data = body.data;
        if (!data.length) {
          requestOpts = null;
          return cb();
        }

        async.eachSeries(data, iterator, function(err) {
          if (err == 'stop' || !body.pagination[direction+'_url']) {
            requestOpts = null;
          } else if (err) {
            return cb(err);
          } else {
            var next_url = URL.parse(body.pagination[direction+'_url'], true)
            debug("NEXT: %s",next_url);
            requestOpts = {
              url: initialRequestOpts.url,
              qs: _.omit(next_url.query, 'sig'),
              json:true
            };
          }
          cb();
        });
      });
    },
    callback
  );
};
