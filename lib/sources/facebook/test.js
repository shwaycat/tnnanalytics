var util = require("util"),
    _ = require('underscore'),
    request = require('request'),
    async = require('async'),
    debug = require('debug')('facebook:comment'),
    AbstractType = require("../abstract_type"),
    SOURCE_NAME = 'Twitter',
    DOC_SOURCE = 'twitter',
    DOC_TYPE = 'mention'/*,
    DELTA_FIELDS = []*/ ;

function getPageAccessToken(user, callback) {
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


// 194478013184/insights?period=day

/**
 * Facebook Test
 * @class
 * @augments AbstractType
 */
function Test(id, obj) {
  AbstractType.call(this, SOURCE_NAME, id, obj);
  this.doc_source = DOC_SOURCE;
  this.doc_type = DOC_TYPE;
}

util.inherits(Test, AbstractType);

/**
 * Pull Facebook Posts
 */
Test.pull = function(user, callback) {
  debug("pulling for user id %s", user.id);
  callback();
};

/**
 * Pull all Facebook tests
 */
Test.pullAll = function(user, callback) {
  debug("pulling ALL tests for user id %s", user.id);

  async.parallel({
    facebookService: function(cb) {
      cb(null, user.services.facebook);
    },
    pageAccessToken: function(cb) {
      getPageAccessToken(user, cb);
    },
    pageInsightsDay: function(cb) {
      getPageInsights(user, 'day', cb);
    },
    pageInsightsLifetime: function(cb) {
      getPageInsights(user, 'lifetime', cb);
    }
  },
  function(err, results) {
    if (err) console.error(err);
    console.log(results);
    callback(err);
  });
};

module.exports = Test;
