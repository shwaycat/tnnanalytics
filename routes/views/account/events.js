var keystone = require('keystone');

exports = module.exports = function(req, res) {

  var view = new keystone.View(req, res),
    locals = res.locals;

  locals.section = 'events';
  locals.showDates = false;
  locals.title = 'Keyword Alerts';

  view.render('account/events');
};
