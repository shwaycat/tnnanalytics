require('dotenv').load()

var async = require('async')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , elasticsearch = require('elasticsearch')
  , _ = require('underscore')
  , fb = require('fb')
  , tw = require('twitter')

mongoose.connect('mongodb://localhost/cadence')

var userSchema = new Schema({
    services: {
      twitter: {
        isConfigured: Boolean,
        profileId: String,
        username: String,
        avatar: String,
        accessToken: String,
        refreshToken: String,
        sinceId: String
      },
      facebook: {
        accessToken: String,
        avatar: String,
        isConfigured: Boolean,
        profileId: String
      }
    }
})


userSchema.statics.findConnectedFacebook = function (cb) {
    this.find({ 'services.facebook.isConfigured': true }, cb)
}

userSchema.statics.findConnectedTwitter = function (cb) {
    this.find({ 'services.twitter.isConfigured': true }, cb)
}

var User = mongoose.model('User', userSchema)

function getAppAccessToken(callback){
  fb.api('oauth/access_token', {
    client_id: process.env.FACEBOOK_APP_ID,
    client_secret:  process.env.FACEBOOK_APP_SECRET,
    grant_type: 'client_credentials'
  }, function (res) {
    if(!res || res.error) {
      callback(res.error)
    }else {
      console.log(res.access_token)
      callback()
    }
  })
}

function findTwitterUsers(callback){
  User.findConnectedTwitter(function(err, users){
    if (err){
      callback(err)
    } else {
      callback(null, users)
    }
  })
}

function findTweets(users, callback){
  async.each(users, function(user, done){
    var client = new tw({
      consumer_key: process.env.TWITTER_API_KEY,
      consumer_secret: process.env.TWITTER_API_SECRET,
      access_token_key: user.services.twitter.accessToken,
      access_token_secret: user.services.twitter.refreshToken,
    })

    var params = {}

    // We've made a query already, let's not get anything before that tweet
    if (user.services.twitter.sinceId ) {
      params = {since_id: user.services.twitter.sinceId}
    }

    client.get('statuses/user_timeline', params, function(err, tweets, response){
      if (err) {
        done(err)
      }
      if (tweets.length > 0) {
        // Update User with most recent tweet
        User.update({ _id: user.id },{ $set: {'services.twitter.sinceId': tweets[0].id_str} }, function (err, numberAffected, raw){
          if (err){
            done(err)
          } else {
            console.log(tweets)
            done()
          }
        })
      } else {
        done()
      }
    })

  },function(err){
    callback(err)
  })
}

function findFacebookUsers(callback){
  User.findConnectedFacebook(function(err, users){
    if (err){
      callback(err)
    } else {
      callback(null, users)
    }
  })
}


//fields=id,message,updated_time,commments{id,message},likes{id,name},shares{id,name}
function findFacebookPosts(users, callback){
  async.each(users, function(user, done){
    fb.setAccessToken(user.services.facebook.accessToken)
    fb.api('TeamNovoNordisk/feed',function (results) {
      done()
    })
  },function(err){
    callback(err)
  })
}

async.waterfall([
    // getAppAccessToken,
    findTwitterUsers,
    findTweets
    // findFacebookUsers,
    // findFacebookPosts
],function(err){
  if (err){
    console.log(err)
    process.exit(1)
  }else {
    process.exit(0)
  }
})

