var keystone = require('keystone')
  , async = require('async')

exports = module.exports = function(req, res) {

  if (req.user) {
  	// Remove the facebook string once dashboard is back
    return res.redirect(req.cookies.target || '/accounts/'+req.user.accountName+'/facebook')
  } else {
  	return res.redirect('/signin')
  }

}
