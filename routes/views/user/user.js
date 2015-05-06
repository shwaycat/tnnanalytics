var keystone = require('keystone')
  , _ = require('underscore')
  , Twitter = require('twitter')

exports = module.exports = function(req, res) {

  var view = new keystone.View(req, res),
    locals = res.locals;

  locals.section = 'user';
  locals.page.title = locals.site.brand + ' Settings';

  /*/
    Handle disconnect requests
  /*/
  view.on('init', function(next) {

    if (!_.has(req.query, 'disconnect')) return next();

    var serviceName = '';

    switch(req.query.disconnect)
    {
      case 'facebook': req.user.services.facebook.isConfigured = null; serviceName = 'Facebook'; break;
      case 'google': req.user.services.google.isConfigured= null; serviceName = 'Google'; break;
      case 'twitter': req.user.services.twitter.isConfigured = null; serviceName = 'Twitter'; break;
    }

    req.user.save(function(err) {
      locals.flashForm = 'profile.details';

      if (err) {
        req.flash('error', 'The service could not be disconnected, please try again.');
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

    if(req.body['name.first'] != '' && req.body['name.last'] != '') {

      req.user.getUpdateHandler(req).process(req.body, {
        fields: 'name, keywords',
        flashErrors: true
      }, function(err) {

        if (err) {
          return next();
        }

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
      console.log('no password detected');
      return next();
    }

    req.user.getUpdateHandler(req).process(req.body, {
      fields: 'password',
      flashErrors: true
    }, function(err) {

      if (err) {
        console.log(err)
        return next();
      }

      console.log('success');
      req.flash('success', 'Your changes have been saved.');
      return next();

    });

  });

 /* view.render('site/me', {credentials: JSON.stringify({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL
  })});*/

  view.render('user/user');

}
