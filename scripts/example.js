require('dotenv').load()

var keystone = require('../keystone-setup')()
  , debug = require('debug')('test')
  , User = keystone.list('User')
  , async = require('async')
  , _ = require('underscore')
  , connectES = require('../lib/connect_es')
  , sources = {
      facebook: require('../lib/sources/facebook')
    , twitter: require('../lib/sources/twitter')
    }

require('../lib/keystone-script')(connectES, function(done) {
  User.model.findConnectedWithKeywords(function(err, users) {
    if (err) {
      return done(err)
    }

    async.eachSeries(users, function(user, next) {
      try {
        console.log(user)
        next()
      } catch (e) {
        next(e)
      }
    }, done)
  })
})
