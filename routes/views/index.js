var keystone = require('keystone')
  , async = require('async')

exports = module.exports = function(req, res) {

  if (req.user) {
    return res.redirect(req.cookies.target || '/accounts/'+req.user.accountName)
  } else {
  	return res.redirect('/signin')
  }

  // var view = new keystone.View(req, res)
  //   , locals = res.locals

  // locals.section = 'session';
  // locals.form = req.body;

  // view.render('session/signin');

}
