// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').load()

var keystone = require('./keystone-setup')(),
    connectES = require('./lib/connect_es');

keystone.set('locals', {
  _: require('underscore'),
  env: keystone.get('env'),
  utils: keystone.utils,
  editable: keystone.content.editable
});

connectES(function(err) {
  if (err) throw err;
})

keystone.set('routes', require('./routes'));

keystone.set('nav', {
  'users': 'users'
});

require('./logo');

keystone.start();
