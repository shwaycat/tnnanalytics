var keystone = require('keystone'),
    s = require('underscore.string');

module.exports = function(req, res) {
  var view = new keystone.View(req, res),
      locals = res.locals;

  locals.section = 'user';
  locals.title = 'Settings';

  /*/
    Handle disconnect requests
  /*/
  view.on('init', function(next) {
    if (!req.query.disconnect) return next();

    if (!req.user.services[req.query.disconnect]) {
      req.flash('error', 'Invalid service identifier');
      return next();
    }

    req.user.set('services.'+req.query.disconnect+'.isConfigured', null);

    req.user.save(function(err) {
      var serviceName = s(serviceName).humanize().capitalize().value();
      locals.flashForm = 'profile.details';

      if (err) {
        req.flash('error', serviceName + ' could not be disconnected, please try again.');
        return next();
      }

      req.flash('success', serviceName + ' has been successfully disconnected.');
      return res.redirect('back');
    });
  });

  /*/
    Handle profile updates
  /*/
  view.on('post', { action: 'profile.details' }, function(next) {
    locals.flashForm = 'profile.details';

    if(req.body['name.first'] && req.body['name.last']) {
      req.user.getUpdateHandler(req).process(req.body, {
        fields: 'name, keywords',
        flashErrors: true
      }, function(err) {
        if (err) return next();

        req.flash('success', 'Your changes have been saved.');

        return next();
      });
    } else {
      req.flash('warning', 'details');
      return next();
    }
  });

  /*/
    Handle change password posts
  /*/
  view.on('post', { action: 'profile.password' }, function(next) {
    locals.flashForm = 'profile.password';

    if (!req.body.password || !req.body.password_confirm) {
      req.flash('warning', 'password');
      console.warn('no password detected');
      return next();
    }

    req.user.getUpdateHandler(req).process(req.body, {
      fields: 'password',
      flashErrors: true
    }, function(err) {
      if (err) {
        console.error(err);
        return next();
      }

      req.flash('success', 'Your changes have been saved.');
      return next();
    });
  });

  view.render('user/user');
};
