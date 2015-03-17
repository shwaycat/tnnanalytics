// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').load();

// Require keystone
var keystone = require('keystone');

keystone.init({

	'name': 'Cadence',
	'brand': 'MaxMedia Cadence',
	'brand email': 'cadence@maxmedia.com',
  'brand host': 'http://dev.cadence.maxmedia.com',

	'less': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': 'jade',

	'emails': 'templates/emails',

	'auto update': true,
	'session': true,
	'auth': true,
	'user model': 'User',
	'cookie secret': 'E]ltoJ_R@SwDxa6X,Z>6![Nl>&!1R"%Kw/8LA+r{~tJ5o(z=/.bcIlO(oFq*8_a2',

	'basedir': __dirname
});

if (keystone.get('env') == 'production'){
  keystone.set('brand host', 'http://cadence.maxmedia.com');

  keystone.set('session store', 'connect-redis');
  keystone.set('session store options',{url: 'redis://redistogo:f6b87ba0335d42e1f413ac1fd4c0f3c3@cobia.redistogo.com:9124/'});
}

keystone.import('models');

keystone.set('locals', {
	_: require('underscore'),
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable
});

keystone.set('routes', require('./routes'));

keystone.set('email locals', {
  utils: keystone.utils,
  host: keystone.get('host'),
  brand: keystone.get('brand'),
  logo_src: '/images/logo-email.gif',
  logo_width: 194,
  logo_height: 76,
  theme: {
    email_bg: '#f9f9f9',
    link_color: '#2697de',
    buttons: {
      color: '#fff',
      background_color: '#2697de',
      border_color: '#1a7cb7'
    }
  }
});

keystone.set('email tests', require('./routes/emails'));

keystone.set('nav', {
	'users': 'users'
});

keystone.start();
