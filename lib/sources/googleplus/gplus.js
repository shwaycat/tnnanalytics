var _ = require('underscore'),
    request = require('request'),
    async = require('async'),
    debug = require('debug')('cadence:googleplus');

exports.requestOpts = function() {
  var args = Array.prototype.slice.call(arguments),
      user = args.shift(),
      result = {
        url: [ 'https://www.googleapis.com/plus/v1' ],
        json: true,
        auth: {
          bearer: user.services.googleplus.accessToken
        },
        qs: {}
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
        if (err) return cb(err);

        var data = body.items;
        if (!data || !data.length) {
          requestOpts = null;
          return cb();
        }
        if (data.length == 1 && data[0].values) {
          data = data[0].values;
        }

        async.eachSeries(data, iterator, function(err) {
          if (err == 'stop' || !body.nextPageToken) {
            requestOpts = null;
          } else if (err) {
            return cb(err);
          } else {
            requestOpts.qs.pageToken = body.nextPageToken;
          }
          cb();
        });
      });
    },
    callback
  );
};
