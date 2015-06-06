var _ = require('underscore'),
    request = require('request'),
    async = require('async'),
    GoogleAPIError = require('../../google-api-error'),
    debug = require('debug')('cadence:youtube');

exports.requestOpts = function() {
  var args = Array.prototype.slice.call(arguments),
      user = args.shift(),
      result = {
        url: [ 'https://www.googleapis.com/youtube/v3' ],
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

exports.analyticsRequestOpts = function() {
  var args = Array.prototype.slice.call(arguments),
      user = args.shift(),
      result = {
        url: [ 'https://www.googleapis.com/youtube/analytics/v1' ],
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
  if (requestOpts.qs && !_.isEmpty(requestOpts.qs)) {
    debug("%s %j", requestOpts.url, requestOpts.qs);
  } else {
    debug(requestOpts.url);
  }

  request(requestOpts, function (err, res, body) {
    if (!err && body.error) {
      err = new GoogleAPIError(body);
    }
    callback(err, body);
  });
};

exports.pager = function(direction, initialRequestOpts, iterator, callback) {
  var requestOpts = initialRequestOpts;

  if (!requestOpts.qs) {
    requestOpts.qs = {};
  }

  if (!requestOpts.qs.fields) {
    requestOpts.qs.fields = '';
  }

  if (requestOpts.qs.fields && !/\bnextPageToken\b/.test(requestOpts.qs.fields)) {
    requestOpts.qs.fields += ',nextPageToken';
  }

  async.whilst(
    function() { // test
      return requestOpts;
    },
    function(cb) { // iterator
      debug(requestOpts);

      request(requestOpts, function (err, res, body) {
        debug(body);
        if (err || body.error) return cb(err || new GoogleAPIError(body));

        var data = body.items;
        if (!data.length) {
          requestOpts = null;
          return cb();
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
