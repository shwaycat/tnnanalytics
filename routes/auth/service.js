var authServices = require('../../lib/auth');

module.exports = function(req, res, next) {
  var authService = authServices[req.params.service];

  if (!authService) {
    console.warn("Invalid service: %s", req.params.service);
    return res.redirect('/');
  }

  if (req.query.target) {
    res.cookie('target', req.query.target);
  }

  authService.authenticateUser(req, res, next);
};
