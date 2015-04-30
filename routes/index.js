var keystone = require('keystone')
  , User = keystone.list('User')
  , middleware = require('./middleware')
  , importRoutes = keystone.importer(__dirname)

// Common Middleware
keystone.pre('routes', middleware.initErrorHandlers)
keystone.pre('routes', middleware.initLocals)
keystone.pre('render', middleware.flashMessages)

keystone.set('404', function(req, res, next) {
  res.notfound()
})

keystone.set('500', function(err, req, res, next) {
  var title, message

  if (err instanceof Error){
    message = err.message
    err = err.stack
  }

  res.err(err, title, message)
});

// Import Route Controllers
var routes = {
  views: importRoutes('./views'),
  auth: importRoutes('./auth'),
  api: importRoutes('./api')
}

// Setup Route Bindings
exports = module.exports = function(app) {
  app.param('account_name', function(req, res, next, accountName) {
    User.model.findOne({ accountName: accountName, isAccountRoot: true }, function(err, user) {
      if (err) {
        next(err)
      } else if (user) {
        req.account = user
        next()
      } else {
        next(new Error('Failed to load account user'));
      }
    });
  })

  // Unrestricted/General
  app.get('/', routes.views.session.signin);
  app.get('/privacy', routes.views.privacy);
  app.all('/accounts*', middleware.requireUser);
  app.all('/user*', middleware.requireUser);

  // Session
  app.all('/signin', routes.views.session.signin);
  app.get('/signout', routes.views.session.signout);
  app.all('/forgot-password', routes.views.session['forgot-password']);
  app.all('/reset-password/:key', routes.views.session['reset-password']);

  // User
  app.all('/user', routes.views.user.user);
  app.all('/user/:uid', routes.views.user.user);

  // Account
  app.all('/accounts/:account_name', routes.views.account.dashboard);
  app.all('/accounts/:account_name', routes.views.account.dashboard);
  app.all('/accounts/:account_name/facebook', routes.views.account.facebook);
  app.all('/accounts/:account_name/twitter', routes.views.account.twitter);
  app.all('/accounts/:account_name/instagram', routes.views.account.instagram);
  app.all('/accounts/:account_name/youtube', routes.views.account.youtube);
  app.all('/accounts/:account_name/google-plus', routes.views.account.google_plus);
  app.all('/accounts/:account_name/analytics-all', routes.views.account.analytics_all);
  app.all('/accounts/:account_name/analytics-global', routes.views.account.analytics_global);
  app.all('/accounts/:account_name/analytics-us', routes.views.account.analytics_us);
  app.all('/accounts/:account_name/events', routes.views.account.events);

  // Auth
  app.all('/auth/confirm', routes.auth.confirm);
  app.all('/auth/app', routes.auth.app);
  app.all('/auth/:service', routes.auth.service);


  // API
  app.get('/api*', keystone.middleware.api);

  // Twitter Endpoints 
  // They all expect query strings with startTime endTime
  app.get('/api/1.0/twitter/engagement', routes.api.twitter.engagement);
  app.get('/api/1.0/twitter/acquisition', routes.api.twitter.acquisition);
  app.get('/api/1.0/twitter/topTweet', routes.api.twitter.topTweet);
  app.get('/api/1.0/twitter/topCountries', routes.api.twitter.topCountries);

  // Facebook Endpoints
  // They all expect query strings with startTime endTime
  app.get('/api/1.0/facebook/engagement', routes.api.facebook.engagement);
  app.get('/api/1.0/facebook/acquisition', routes.api.facebook.acquisition);
  app.get('/api/1.0/facebook/reach', routes.api.facebook.reach);
  app.get('/api/1.0/facebook/topPost', routes.api.facebook.topPost);
  app.get('/api/1.0/facebook/topCountries', routes.api.facebook.topCountries);

  // Adverse Events
  // /events expects query strings with page
  app.get('/api/1.0/events', routes.api.events.index);
  app.get('/api/1.0/events/summary', routes.api.events.summary);

  // expects a JSON object with an array of IDs and updated statuses
  app.post('/api/1.0/events/update', routes.api.events.update)










}
