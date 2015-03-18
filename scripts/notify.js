require('dotenv').load()

var async = require('async')
  , request = require('request')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , elasticsearch = require('elasticsearch')
  , _ = require('underscore')

var esClient = new elasticsearch.Client({
  host: process.env.BONSAI_URL
})


mongoose.connect(process.env.MONGOLAB_URI)

var userSchema = new Schema({
    notifications: {
      keywords: String
    },
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

function findDocuments(users, callback){
  async.each(users, function(user, nextUser){
    var keywords = user.notifications.keywords.split(',')
    console.log(keywords)

    if (keywords.length == 0){
      nextUser()
    }

    var orQueries = _.map(keywords, function(keyword){
      return { query: { match_phrase: {text: keyword} } }
    })


    esClient.search({
      index: 'cadence',
      body: {
        query: {
          filtered: {
            query: {
              match: {
                cadence_user_id: user.id
              }
            },
            filter: {
              or: orQueries
            }
          }
        }
      }
    }, function (error, response) {
      console.log(response.hits.hits)
      nextUser()
    })
  },function(err){
    callback(err)
  })
}

async.waterfall([
    findTwitterUsers,
    findDocuments,
],function(err){
  if (err){
    console.log(err)
    process.exit(1)
  }else {
    process.exit(0)
  }
})

