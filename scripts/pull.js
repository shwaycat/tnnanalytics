require('dotenv').load()

var async = require('async')
  , request = require('request')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , elasticsearch = require('elasticsearch')
  , _ = require('underscore')
  , tw = require('twitter')

var esClient = new elasticsearch.Client({
  host: process.env.ELASTICSEARCH_HOST || process.env.BONSAI_URL
})


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
  async.each(users, function(user, nextUser){
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
        nextUser(err)
      }
      if (tweets.length > 0) {
        // Update User with most recent tweet
        User.update({ _id: user.id },{ $set: {'services.twitter.sinceId': tweets[0].id_str} }, function (err, numberAffected, raw){
          if (err){
            nextUser(err)
          } else {
            async.each(tweets, function(tweet, nextTweet){
              esClient.create({
                index: 'cadence',
                type: 'twitter',
                body: tweet
              }, function(err, response){
                nextTweet(err)
              })
            }, function (err){
              nextUser(err)
            })
          }
        })
      } else {
        nextUser()
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
  async.each(users, function(user, nextUser){
    var qp = 'fields=id,message,updated_time,comments{id,message},likes{id,name},shares&since=1426377600'
    request({
      url: 'https://graph.facebook.com/v2.2/nookwit/feed?'+qp+'&access_token='+user.services.facebook.accessToken,
      json: true
    },function (error, response, body){
      console.log(body)
      nextUser(error)
    })
  },function(err){
    callback(err)
  })
}

async.waterfall([
    findTwitterUsers,
    findTweets,
    findFacebookUsers,
    findFacebookPosts
],function(err){
  if (err){
    console.log(err)
    process.exit(1)
  }else {
    process.exit(0)
  }
})
