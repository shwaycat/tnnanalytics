var keystone = require('keystone'),
    User = keystone.list('User'),
    middleware = require('./middleware'),
    importRoutes = keystone.importer(__dirname),
    apiRouteBuilder = require('./api/builder');

// Common Middleware
keystone.pre('routes', middleware.initErrorHandlers);
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

keystone.set('404', function(req, res) {
  res.notfound();
});

keystone.set('500', function(err, req, res) {
  if (err instanceof Error) {
    console.error("%s\n    Stack: %s", err, err.stack);
  } else {
    console.error(err);
  }

  res.err(err);
});

// Import Route Controllers
var routes = {
  views: importRoutes('./views'),
  auth: importRoutes('./auth'),
  api: importRoutes('./api')
};

// Setup Route Bindings
exports = module.exports = function(app) {
  app.param('account_name', function(req, res, next, accountName) {
    User.model.findOne({ accountName: accountName, isAccountRoot: true }, function(err, user) {
      if (err) {
        next(err);
      } else if (user) {
        req.account = user;
        next();
      } else {
        next(new Error('Failed to load account user'));
      }
    });
  });

  // Unrestricted/General
  app.get('/', routes.views.index);
  app.get('/privacy', routes.views.privacy);
  app.all('/accounts*', middleware.requireUser);
  app.all('/user*', middleware.requireUser);

  // Session
  app.all('/signin', routes.views.session.signin);
  app.get('/signout', routes.views.session.signout);
  app.all('/forgot-password', routes.views.session['forgot-password']);
  app.all('/reset-password/', routes.views.session['reset-password']);
  app.all('/reset-password/:key', routes.views.session['reset-password']);

  // User
  app.all('/user', routes.views.user.user);
  app.all('/user/:uid', routes.views.user.user);

  // Account
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

  // API
  app.all('/api*', keystone.middleware.api);

  // Twitter Endpoints
  // They all expect query strings with startTime endTime
  app.get('/api/1.0/twitter/engagement', apiRouteBuilder('twitter', 'engagement'));
  app.get('/api/1.0/twitter/acquisition', apiRouteBuilder('twitter', 'acquisition'));
  app.get('/api/1.0/twitter/topTweet', apiRouteBuilder('twitter', 'topTweet'));
  app.get('/api/1.0/twitter/topCountries', apiRouteBuilder('twitter', 'topCountries'));

  // Facebook Endpoints
  // They all expect query strings with startTime endTime
  app.get('/api/1.0/facebook/engagement', apiRouteBuilder('facebook', 'engagement'));
  app.get('/api/1.0/facebook/acquisition', apiRouteBuilder('facebook', 'acquisition'));
  app.get('/api/1.0/facebook/reach', apiRouteBuilder('facebook', 'reach'));
  app.get('/api/1.0/facebook/topPost', apiRouteBuilder('facebook', 'topPost'));
  app.get('/api/1.0/facebook/topCountries', apiRouteBuilder('facebook', 'topCountries'));

  // Instagram Endpoints
  // They all expect query strings with startTime endTime
  app.get('/api/1.0/instagram/engagement', apiRouteBuilder('instagram', 'engagement'));
  app.get('/api/1.0/instagram/acquisition', apiRouteBuilder('instagram', 'acquisition'));
  app.get('/api/1.0/instagram/topPost', apiRouteBuilder('instagram', 'topPost'));


  // YouTube Endpoints
  // They all expect query strings with startTime endTime
  app.get('/api/1.0/youtube/engagement', apiRouteBuilder('youtube', 'engagement'));
  app.get('/api/1.0/youtube/acquisition', apiRouteBuilder('youtube', 'acquisition'));
  app.get('/api/1.0/youtube/reach', apiRouteBuilder('youtube', 'reach'));
  app.get('/api/1.0/youtube/topVideo', apiRouteBuilder('youtube', 'topVideo'));
  app.get('/api/1.0/youtube/topCountries', apiRouteBuilder('youtube', 'topCountries'));

  // Google+ Endpoints
  // They all expect query strings with startTime endTime
  app.get('/api/1.0/googleplus/engagement', apiRouteBuilder('googleplus', 'engagement'));
  app.get('/api/1.0/googleplus/acquisition', apiRouteBuilder('googleplus', 'acquisition'));
  app.get('/api/1.0/googleplus/topPost', apiRouteBuilder('googleplus', 'topPost'));

  // Google+ Endpoints
  // They all expect query strings with startTime endTime
  app.get('/api/1.0/googleanalytics/:profileName/overview', routes.api.googleanalytics.overview);
  app.get('/api/1.0/googleanalytics/:profileName/sources', routes.api.googleanalytics.sources);
  app.get('/api/1.0/googleanalytics/:profileName/topCountries', routes.api.googleanalytics.topCountries);

  // Dashboard Endpoints
  // They all expect query strings with startTime endTime
  app.get('/api/1.0/dashboard/engagement', apiRouteBuilder('dashboard', 'engagement'));
  app.get('/api/1.0/dashboard/acquisition', apiRouteBuilder('dashboard', 'acquisition'));
  app.get('/api/1.0/dashboard/reach', apiRouteBuilder('dashboard', 'reach'));

  // Keyword Alerts
  // /alerts expects query strings with page
  app.get('/api/1.0/alerts', routes.api.alerts.index);
  app.get('/api/1.0/alerts/summary', routes.api.alerts.summary);

  // expects a JSON object with an array of IDs and updated statuses
  app.post('/api/1.0/alerts/update', routes.api.alerts.update);

  // Auth
  app.all('/auth/:service', routes.auth.service);
  app.all('/auth/:service/setup', routes.auth.setup);
};
