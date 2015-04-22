// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').load()

var keystone = require('./keystone-setup')()

keystone.set('locals', {
  _: require('underscore'),
  env: keystone.get('env'),
  utils: keystone.utils,
  editable: keystone.content.editable
});

keystone.set('routes', require('./routes'));

keystone.set('nav', {
  'users': 'users'
});

keystone.start();
