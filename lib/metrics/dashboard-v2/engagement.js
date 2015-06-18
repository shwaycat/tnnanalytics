var keystone = require('keystone'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User'),
    _ = require('underscore'),
    async = require('async'),
    metrics = {
      facebook: require('../facebook'),
      googleplus: require('../googleplus'),
      instagram: require('../instagram'),
      twitter: require('../twitter'),
      youtube: require('../youtube')
    };

module.exports = function(user, startTime, endTime, callback) {
  User.model.getAccountRootInfo(user.accountName, function(err, accountRoot) {

    // an example using an object instead of an array
    async.parallel({
        facebook: function(cb) {
          metrics.facebook.engagement(accountRoot, startTime, endTime, cb);
        },
        twitter: function(cb) {
          metrics.twitter.engagement(accountRoot, startTime, endTime, cb);
        },
        instagram: function(cb) {
          metrics.instagram.engagement(accountRoot, startTime, endTime, cb);
        }
    },
    function(err, results) {
      if(err) return callback(err);
      var response = {
        data: {},
        summary: {}
      },
      keys = _.keys(results),
      startValue = 0;

      _.each(keys, function(key) {
        response['data'][key] = results[key]['data'];

        switch(key) {
          case 'facebook':
            response.summary.totalFacebook = _.reduce(_.values(results.facebook.summary), function(memo, num) { return num + memo; }, 0);
            break;
          case 'twitter':
            response.summary.totalTwitter = _.reduce(_.values(results.twitter.summary), function(memo, num) { return num + memo; }, 0);
            break;
          case 'instagram':
            response.summary.totalInstagram = _.reduce(_.values(results.instagram.summary), function(memo, num) { return num + memo; }, 0);
            break;
          case 'googleplus':
            response.summary.totalGoogleplus = _.reduce(_.values(results.googleplus.summary), function(memo, num) { return num + memo; }, 0);
            break;
          case 'youtube':
            response.summary.totalYoutube = _.reduce(_.values(results.youtube.summary), function(memo, num) { return num + memo; }, 0);
            break;
          default: //do nothing
            break;
        }
      });

      return callback(null, response);
    });
  });

};
