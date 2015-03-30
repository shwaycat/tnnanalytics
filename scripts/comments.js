require('dotenv').load()

var keystone = require('keystone')
  , async = require('async')
  , request = require('request')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , elasticsearch = require('elasticsearch')
  , _ = require('underscore')
  , c = require('../config.json')

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

userSchema.statics.findConnectedUsers = function (cb) {
  this.find({ 'services.twitter.isConfigured': true }, cb)
}

var User = mongoose.model('User', userSchema)


function findConnectedUsers(callback){
  User.findConnectedTwitter(function(err, users){
    if (err){
      console.log('Error findConnectedTwitter')
      console.log(err)
      callback(err)
    } else {
      callback(null, users)
    }
  })
}

function findComments(users, callback){
  async.each(users, function(user, nextUser){
    //console.log(user);
    console.log('-----------------------Find Posts and Comments-------------------');

    esClient.search({
      index: c.index,
      type: user.domain,
      body: {
        query: {
          filtered: {
            query: {
              match: {
                cadence_user_id: user.id
              }
            }
          }
        }
      }
    }, function (error, response) {
        if (error) {
          console.log('Error esClient.search')
          console.log(error)
          nextUser(error)
          return;
        }
        if (response.hits.total > 0){
          console.log('building email');
          var postsAndComments = _.filter(response.hits.hits, function(hit) {
             // console.log(hit);
              return hit._source.doc_type == 'post' || hit._source.doc_type == 'comment';
            });
          async.eachLimit(postsAndComments, 5, function(comment, nextComment) {
            console.log(comment);
            findFacebookComments(comment._source.cadence_user_id, comment._source.page_id, comment.id, comment._source.accessToken, function (err) {
              if(err != null) {
                nextComment(err);
              } else {
                nextComment(err);
              }
            })
          }, function (err){
            if(err != null) {
              nextUser(err);
            } else {
              nextUser();
            }
          });
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

function findFacebookComments(userId, pageId, id, accessToken, callback) {
  console.log('Get Messages for page: ' + page);
  //async.each(pages, function(page, nextPage){
  //get the conversations for each page
  var since = user.services.facebook.lastMessageTime;
  if(since === 'undefined' || since == null || since == '') {
    var now = new Date();
    since = Math.floor((new Date(now.getTime() - 30*24*60*60*1000)).getTime() / 1000);
  }
  var qp = 'fields=id,comment_count,from,message,created_time';//&since=' + since;
  var commentsUrl = 'https://graph.facebook.com/v2.3/' +id + '/comments?'+qp+'&access_token='+accessToken;
  //console.log(convoUrl);
  request({
    url: commentsUrl,
    json: true
  },function (e, r, b){
    if(e != null) {
      callback(e);
    } else {
      if(b.data.length > 0) {
        //iterate and store them in the database
        async.eachLimit(b.data, 5, function (comment, nextComment) {
          esClient.count({
            index: c.index,
            body: {
              query: {
                term: {doc_source: 'facebook'},
                term: {doc_type: 'comment'},
                term: {_id: comment.id}
              }
            }
          }, function (err, response) {
            if ((typeof err == 'undefined') && response.count == 0) {
              //console.log(comment);
              esClient.create({
                index: c.index,
                type: user.domain,
                id: comment.id,
                body: {
                  doc_source: 'facebook',
                  doc_type: 'comment',
                  doc_text: comment.message,
                  user_id: comment.from != null ? comment.from.id : '',
                  user_name: comment.from != null ? comment.from.name : '',
                  //user_lang: post.from.languages[0],
                  cadence_user_id: userId,
                  time_stamp: comment.created_time,
                  page_id: pageId,
                  access_token: accessToken
                }
              }, function (err, response) {
                if (err) {
                  console.log('Error async.each comment esClient.create')
                  console.log(err)
                  nextComment(err)
                } else {

                  console.log('facebook comment ' + comment.id + ' created.')
                  if(comment.comment_count > 0) {
                    console.log('facebook comment has ' + comment.comment_count + ' replies.');
                    findFacebookComments(userId, pageI, comment.id, accessToken, function (err) {
                      if(err) {
                        nextComment(err);
                      } else {
                        nextComment();
                      }
                    })
                  } else {
                    nextComment()
                  }

                }
              });
            } else {
              if (err) {
                //console.log(response);
                console.log('Error from count')
                console.log(err)
                nextComment(err)
              } else {
                //console.log('comment already exists in database')
                nextComment()
              }
            }
          })
        }, function (err) {
          if (err) {
            console.log('Error async.each comment complete');
            console.log(err);
            callback(err);
          } else {
            callback();
          }
        });

      } else {
        console.log('no new comments');
        callback();
      }
      console.log(b);
    }
  });
}



async.waterfall([
    findConnectedUsers,
    findComments,
],function(err){
  if (err){
    console.log('Error async.waterfall complete')
    console.log(err)
    process.exit(1)
  }else {
    process.exit(0)
  }
})

