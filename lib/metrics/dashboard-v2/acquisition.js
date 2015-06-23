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
          metrics.facebook.acquisition(accountRoot, startTime, endTime, cb);
        },
        twitter: function(cb) {
          metrics.twitter.acquisition(accountRoot, startTime, endTime, cb);
        },
        instagram: function(cb) {
          metrics.instagram.acquisition(accountRoot, startTime, endTime, cb);
        }
    },
    function(err, results) {
      if(err) return callback(err);
      var response = {
        data: {},
        summary: {
          changeInAcquisition: 0,
          changeInAcquisitionPercent: 0
        }
      },
      keys = _.keys(results),
      startValue = 0;

      _.each(keys, function(key) {
        response['data'][key] = results[key]['data'];

        switch(key) {
          case 'facebook':
            response.summary.totalFacebook = results.facebook.summary.totalLikes;
            response.summary.changeInAcquisition += results.facebook.summary.changeInLikes;
            startValue += results.facebook.summary.totalLikes - results.facebook.summary.changeInLikes;
            break;
          case 'twitter':
            response.summary.totalTwitter = results.twitter.summary.totalFollowers;
            response.summary.changeInAcquisition += results.twitter.summary.changeInFollowers;
            startValue += results.twitter.summary.totalFollowers - results.twitter.summary.changeInFollowers;
            break;
          case 'instagram':
            response.summary.totalInstagram = results.instagram.summary.totalFollowers;
            response.summary.changeInAcquisition += results.instagram.summary.changeInFollowers;
            startValue += results.instagram.summary.totalFollowers - results.instagram.summary.changeInFollowers;
            break;
          case 'googleplus':
            response.summary.totalGoogleplus = results.googleplus.summary.totalCircledBy;
            response.summary.changeInAcquisition += results.googleplus.summary.changeInCircledBy;
            startValue += results.googleplus.summary.totalCircledBy - results.googleplus.summary.changeInCircledBy;
            break;
          case 'youtube':
            response.summary.totalYoutube = results.youtube.summary.totalSubscribers;
            response.summary.changeInAcquisition += results.youtube.summary.changeInSubscribers;
            startValue += results.youtube.summary.totalSubscribers - results.youtube.summary.changeInSubscribers;
            break;
          default: //do nothing
            break;
        }
      });
      response.summary.changeInAcquisitionPercent = ((response.summary.changeInAcquisition / startValue) * 100).toFixed(2);

      return callback(null, response);
    });
  });

};
