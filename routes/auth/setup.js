var util = require('util'),
    _ = require('underscore'),
    debug = require('debug')('cadence:auth:setup'),
    keystone = require('keystone'),
    authServices = require('../../lib/auth');

module.exports = function(req, res, next) {
  var view = new keystone.View(req, res),
      authService = authServices[req.params.service];

  if (!authService) return next(new Error('Invalid service'));
  if (!authService.getSetupOptions) return next(new Error('Service does not have setup options'));

  view.on('get', function (nextGet) {
    authService.getSetupOptions(req.user, function(err, setupOptions) {
      debug("setup options: %j", setupOptions);
      res.locals.setupOptions = setupOptions;
      nextGet(err);
    });
  });

  view.on('post', { action: 'auth.setup' }, function(nextPost) {
    var serviceData = _.omit(req.body, 'action');
    debug("Service selected: %j", serviceData);

    _.each(serviceData, function(val, key) {
      req.user.set(util.format("services.%s.%s", req.params.service, key), val);
      req.user.save(function(err) {
        if (err) return nextPost(err);
        req.flash('success', 'Your changes have been saved.');
        if (req.cookies.target) {
          var targetURL = req.cookies.target;
          debug('redirecting to target %s', targetURL);
          res.cookie('target', undefined);
          res.redirect(targetURL);
        } else {
          debug('redirecting to account home');
          res.redirect('/accounts/'+req.user.accountName);
        }
      });
    });
  });

  view.render('auth/setup-'+req.params.service);
};
