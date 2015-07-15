var _ = require('underscore'),
    request = require('request'),
    async = require('async'),
    debug = require('debug')('cadence:facebook');

exports.requestOpts = function() {
  var args = Array.prototype.slice.call(arguments),
      user = args.shift(),
      result = {
        url: [ 'https://graph.facebook.com/v2.3' ],
        json: true,
        qs: {
          access_token: user.services.facebook.accessToken
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
      debug(requestOpts.url);

      request(requestOpts, function (err, res, body) {
        if (err) return cb(err);

        var data = body.data;
        if (!data.length) {
          requestOpts = null;
          return cb();
        }

        if (direction == 'previous' && data[0] && data[0].end_time) {
          data = _.sortBy(data, 'end_time');
          data.reverse();
        }

        if (data.length == 1 && data[0].values) {
          data = data[0].values;
        }

        async.eachSeries(data, iterator, function(err) {
          if (err == 'stop' || !body.paging[direction]) {
            requestOpts = null;
          } else if (err) {
            return cb(err);
          } else {
            requestOpts = {
              url: body.paging[direction],
              json: true
            };
          }
          cb();
        });
      });
    },
    callback
  );
};

exports.getPageAccessToken = function(user, callback) {
  request({
    url: 'https://graph.facebook.com/v2.3/' + user.services.facebook.pageID,
    qs: {
      access_token: user.services.facebook.accessToken,
      fields: 'access_token'
    },
    json: true
  }, function (err, res, body) {
    if (err) return callback(err);
    callback(null, body.access_token);
  });
};


/*

function
}

function getPageInsights(user, period, callback) {
  request({
    url: 'https://graph.facebook.com/v2.3/' + user.services.facebook.pageID + '/insights',
    qs: {
      access_token: user.services.facebook.accessToken,
      period: period
    },
    json: true
  }, function (err, res, body) {
    if (err) return callback(err);

    callback(null, body.data);
  });
}


function getPagePositveFeedbackEachDay(user, iterator, callback) {
  var requestOpts = fbRequestOpts(user, user.services.facebook.pageID,
        'insights', 'page_positive_feedback_by_type_unique', 'day');

  debug("Getting page postive feedback");

  async.whilst(
    function() { // test
      return requestOpts;
    },
    function(cb) { // iterator
      debug(requestOpts.url);

      request(requestOpts, function (err, res, body) {
        debug(body);
        if (err) return cb(err);

        for (var i = 0; i < body.data[0].values.length; i++) {
          if(false === iterator( body.data[0].values[i] )) {
            requestOpts = null;
          } else {
            requestOpts = {
              url: body.paging.previous,
              json: true
            };
          }
        }

        cb();
      });
    },
    callback
  );
}

*/
