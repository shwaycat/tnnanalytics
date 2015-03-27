require('dotenv').load()

var async = require('async')
  , request = require('request')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , elasticsearch = require('elasticsearch')
  , tw = require('twitter')
  , c = require('../config.json')

var esClient = new elasticsearch.Client({
  host: process.env.BONSAI_URL
})


mongoose.connect(process.env.MONGOLAB_URI)

var userSchema = new Schema({
    domain: String,
    services: {
      twitter: {
        isConfigured: Boolean,
        profileId: String,
        username: String,
        avatar: String,
        accessToken: String,
        refreshToken: String,
        sinceId: String,
        dmSinceId: String
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
      console.log('Error in findTwitterUsers')
      console.log(err)
      callback(err)
    } else {
      callback(null, users)
    }
  })
}

function deleteTwitterDirectMessages(callback) {
  esClient.deleteByQuery({
    index: c.index,
    body: {
      query: {
        term: {doc_type: 'direct_message'}
      }
    }
  }, function(err, response){
    callback();
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

    var params = {count: 200, include_rts: 1}

    // We've made a query already, let's not get anything before that tweet
    if (user.services.twitter.sinceId) {
      //params.since_id = user.services.twitter.sinceId
    }

    client.get('statuses/mentions_timeline', params, function(err, tweets, response){

      if (err) {
        console.log('Error statuses/mentions_timeline')
        console.log(err)
        nextUser(err)
      }
      if (tweets.length > 0) {
        // Update User with most recent tweet
        User.update({ _id: user.id },{ $set: {'services.twitter.sinceId': tweets[0].id_str} }, function (err, numberAffected, raw){
          if (err){
            console.log('Error User.update')
            console.log(err)
            nextUser(err)
          } else {
            async.eachLimit(tweets, 5, function(tweet, nextTweet){
              console.log(tweet.id_str);
              esClient.count({
                index: c.index,
                body: {
                  query: {
                    term: {_id: tweet.id_str}
                  }
                }
              }, function(err, response){
                if ( (typeof err == 'undefined') && (response.count == 0) ){
                    esClient.create({
                      index: c.index,
                      type: user.domain,
                      id: tweet.id_str,
                      body: {
                        doc_source: 'twitter',
                        doc_type: 'mention',
                        doc_text: tweet.text,
                        user_id: tweet.user.id_str,
                        user_handle: tweet.user.screen_name,
                        user_lang: tweet.user.lang,
                        cadence_user_id: user.id
                      }
                    }, function(err, response){
                      if (err){
                        console.log('Error async.each esClient.create')
                        console.log(err)
                        nextTweet(err)
                      } else {
                        nextTweet()
                      }
                    })
                }else{
                  if (typeof err != 'undefined'){
                    console.log(response);
                    console.log('Error from count')
                    console.log(err)
                    nextTweet(err)
                  }else{
                    nextTweet()
                  }
                }
              })

            }, function (err){
                if (err){
                  console.log('Error async.each tweets complete')
                  console.log(err)
                  nextUser(err)
                } else {
                  nextUser()
                }
            })
          }
        })
      } else {
        nextUser()
      }
    })

  },function(err){
    if (err){
      console.log('Error async.each users complete')
      console.log(err)
      callback(err, users)
    } else {
      callback(null, users);
    }
  })

  //callback(null, users);
}
function findTwitterDirectMessages(users, callback) {
  async.each(users, function(user, nextUser){
    var client = new tw({
      consumer_key: process.env.TWITTER_API_KEY,
      consumer_secret: process.env.TWITTER_API_SECRET,
      access_token_key: user.services.twitter.accessToken,
      access_token_secret: user.services.twitter.refreshToken
    });

    var params = {count: 200, include_entities: 0};

    // We've made a query already, let's not get anything before that tweet
    if (user.services.twitter.dmSinceId ) {
      //params.since_id = user.services.twitter.dmSinceId;
    }

    client.get('direct_messages', params, function(err, messages, response){
      console.log('direct_messages retrieved');
      if (err) {
        console.log('Error direct_messages');
        console.log(err);
        nextUser(err);
      }
      if (messages.length > 0) {
        // Update User with most recent direct message
        User.update({ _id: user.id },{ $set: {'services.twitter.dmSinceId': messages[0].id_str} },
          function (err, numberAffected, raw){
          if (err){
            console.log('Error User.update')
            console.log(err)
            nextUser(err)
          } else {
            async.eachLimit(messages, 5, function(message, nextMessage){
              console.log(message.id_str);
              esClient.count({
                index: c.index,
                body: {
                  query: {
                    term: {_id: message.id_str}
                  }
                }
              }, function(err, response){
                if ( (typeof err == 'undefined') && response.count == 0){
                  esClient.create({
                    index: c.index,
                    type: user.domain,
                    id: message.id_str,
                    body: {
                      doc_source: 'twitter',
                      doc_type: 'direct_message',
                      doc_text: message.text,
                      user_id: message.sender.id_str,
                      user_handle: message.sender.screen_name,
                      user_lang: message.sender.lang,
                      cadence_user_id: user.id,
                      time_stamp: message.created_at
                    }
                  }, function(err, response){
                    if (err){
                      console.log('Error async.each esClient.create')
                      console.log(err)
                      nextMessage(err)
                    } else {
                      console.log('direct message ' + message.id_str + ' created.')
                      nextMessage()
                    }
                  })
                }else{
                  if (typeof err != 'undefined'){
                    console.log(response);
                    console.log('Error from count')
                    console.log(err)
                    nextMessage(err)
                  }else{
                    nextMessage()
                  }
                }
              })
            }, function (err){
              if (err){
                console.log('Error async.each direct messages complete');
                console.log(err);
                nextUser(err);
              } else {
                nextUser();
              }
            })
          }
        })
      } else {
        nextUser()
      }
    })

  },function(err){
    if (err){
      console.log('Error async.each users complete')
      console.log(err)
      callback(err)
    } else {
      callback()
    }
  })
}

function findFacebookUsers(callback){
  User.findConnectedFacebook(function(err, users){
    if (err){
      console.log('Error findConnectedFacebook')
      console.log(err)
      callback(err)
    } else {
      callback(null, users)
    }
  })
}

//fields=id,message,updated_time,commments{id,message},likes{id,name},shares{id,name}
function findFacebookPosts(users, callback){
  async.each(users, function(user, nextUser){
    //console.log(user.services.facebook);
    var since = user.services.facebook.lastPostTime;
    if(since === 'undefined' || since == null || since == '') {
      var now = new Date();
      since = (new Date(now.getTime() - 30*24*60*60*1000)).getTime() / 1000;
    }
    var qp = 'fields=id,message,updated_time,comments{id,message},likes{id,name},shares&since=' + since;
    var url = 'https://graph.facebook.com/v2.3/me/posts?'+qp+'&access_token='+user.services.facebook.accessToken;
    //console.log(url);
    request({
      url: url,
      json: true
    },function (error, response, body){
      //update the last post time so we don't pull any more posts than we have to in the future

     // console.log(response);
      console.log(body);
      nextUser(error)
    })
  },function(err){
    callback(err)
  })
}

async.waterfall([
   // deleteTwitterDirectMessages,
    findTwitterUsers,
    findTweets,
    findTwitterDirectMessages,
    findFacebookUsers,
    findFacebookPosts
],function(err){
  if (err){
    console.log('Error async.waterfall complete')
    console.log(err)
    process.exit(1)
  }else {
    process.exit(0)
  }
})

