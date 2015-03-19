require('dotenv').load()

var keystone = require('keystone')
  , async = require('async')
  , request = require('request')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , elasticsearch = require('elasticsearch')
  , _ = require('underscore')

keystone.set('emails', '../templates/emails')

var esClient = new elasticsearch.Client({
  host: process.env.BONSAI_URL
})

mongoose.connect(process.env.MONGOLAB_URI)

var userSchema = new Schema({
    email: String,
    domain: String,
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
      console.log('Error findConnectTwitter')
      console.log(err)
      callback(err)
    } else {
      callback(null, users)
    }
  })
}

function findDocuments(users, callback){
  async.each(users, function(user, nextUser){
    console.log('-----------------------Find Documents-------------------');
    console.log(user);
    var keywords = user.notifications.keywords.split(',')

    if (keywords.length == 0){
      nextUser()
    }

    var orQueries = _.map(keywords, function(keyword){
      return { query: { match_phrase: {doc_text: keyword} } }
    })

    esClient.search({
      index: 'cadence',
      type: user.domain,
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
        if (error){
          console.log('Error esClient.search')
          console.log(error)
          nextUser(error)
        }

        var links = []
        if (response.hits.total > 0){
          links = _.map(response.hits.hits, function(hit){
            return {
              text: hit._source.doc_text,
              href: 'https://twitter.com/'+hit._source.user_handle+'/status/'+hit._source._id
            }
          })

          new keystone.Email('notification').send({
            subject: 'Cadence Notification',
            to: user.email,
            from: {
              name: 'Cadence',
              email: 'no-reply@maxmedia.com'
            },
            links: links
          }, nextUser);
        } else {
          nextUser()
        }
    })
  },function(err){
    if (err) {
      console.log('Error async.each users complete')
      console.log(err)
      callback(err)
    } else {
      callback()
    }
  })
}

async.waterfall([
    findTwitterUsers,
    findDocuments,
],function(err){
  if (err){
    console.log('Error async.waterfall complete')
    console.log(err)
    process.exit(1)
  }else {
    process.exit(0)
  }
})

