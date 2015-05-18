var keystone = require('keystone')
  , async = require('async')

exports = module.exports = function(req, res) {

  if (req.user) {
    return res.redirect(req.cookies.target || '/accounts/'+req.user.accountName)
  }

  var view = new keystone.View(req, res)
    , locals = res.locals

  locals.section = 'session';
  locals.form = req.body;
  locals.title = 'Sign In';


  view.on('post', { action: 'signin' }, function(next) {

    if (!req.body.email || !req.body.password) {
      req.flash('warning', 'Please enter your username and password.');
      return next();
    }

    var onSuccess = function() {
      if (req.body.target && !/signin/.test(req.body.target)) {
        res.redirect(req.body.target);
      } else {
        res.redirect('/signin');
      }
    }

    var onFail = function() {
      req.flash('warning', 'Your username or password were incorrect, please try again.');
      return next();
    }

    keystone.session.signin({ email: req.body.email, password: req.body.password }, req, res, onSuccess, onFail);

  });

  view.render('session/signin');

}
