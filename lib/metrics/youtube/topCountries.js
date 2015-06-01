var keystone = require('keystone'),
    // _ = require('underscore'),
    //debug = require('debug')('cadence:metrics:youtube:topCountries'),
    // mxm = require('../../mxm-utils'),
    User = keystone.list('User');

module.exports = function(user, startTime, endTime, callback) {
  // var interval = mxm.calculateInterval(startTime, endTime);

  User.model.getAccountRootInfo(user.accountName, function(err) { //, accountRoot) {
    if (err) return callback(err);

    callback(new Error("boom"));
  });
};
