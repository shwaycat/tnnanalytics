module.exports = function() {
  var keystone = require('keystone');

  keystone.init({
    'name': 'Cadence',
    'brand': 'Cadence',
    'brand email': 'no-reply@tnnanalytics.net',
    'brand host': 'http://dev.tnnanalytics.net',

    'less': 'public',
    'static': 'public',
    'favicon': 'public/images/favicons/favicon.ico',
    'views': 'templates/views',
    'view engine': 'jade',

    'emails': 'templates/emails',

    'auto update': true,
    'session': true,
    'auth': true,
    'user model': 'User',
    'cookie secret': 'E]ltoJ_R@SwDxa6X,Z>6![Nl>&!1R"%Kw/8LA+r{~tJ5o(z=/.bcIlO(oFq*8_a2',

    'mongo': process.env.MONGO_URI,

    'elasticsearch': process.env.ELASTICSEARCH_URI,
    'elasticsearch index': process.env.ELASTICSEARCH_INDEX,
    'elasticsearch trace': process.env.ELASTICSEARCH_TRACE,

    'logger': ':date[iso] :method :url :status :res[content-length] :response-time ms',

    'basedir': __dirname
  });

  if (keystone.get('env') == 'production') {
    keystone.set('brand host', 'http://tnnanalytics.net');
  }

  if (keystone.get('env') == 'development' && !keystone.get('elasticsearch log')) {
    keystone.set('elasticsearch log', 'debug');
  }

  if (process.env.REDIS_URI) {
    keystone.set('session store', 'connect-redis');
    keystone.set('session store options', { url: process.env.REDIS_URI });
  }

  if (process.env.COOKIE_SECRET) {
    keystone.set('cookie secret', process.env.COOKIE_SECRET);
  }

  keystone.import('models');

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

  return keystone;
};
