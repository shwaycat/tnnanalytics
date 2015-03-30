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

function deleteFacebookDirectMessages(callback) {
  esClient.deleteByQuery({
    index: c.index,
    body: {
      query: {
        term: {doc_type: 'message'}
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
function findFacebookData(users, callback){
  async.each(users, function(user, nextUser){
    //get the pages for each user
    //var pageQP = "fields=id,name,name_with_location_descriptor";
    var pageUrl = 'https://graph.facebook.com/v2.3/me/accounts?access_token='+user.services.facebook.accessToken;
    request({
      url: pageUrl,
      json: true
    }, function (error, response, body) {

      if(error != null) {
        nextUser(error);
      } else {
        var getMessagsFunc = function (user, page, callback) {
          findFacebookMessages(user, page, function (err) {
            if(err == null) {
              callback();
            } else {
              callback(err);
            }
          });
        };
        async.eachLimit(body.data, 5, function(page, nextPage){
          console.log(page);
          var since = user.services.facebook.lastPostTime;
          if(since === 'undefined' || since == null || since == '') {
            var now = new Date();
            since = Math.floor((new Date(now.getTime() - 30*24*60*60*1000)).getTime() / 1000);
          }
          var qp = 'fields=id,message,created_time,from';//&since=' + since;
          var postsUrl = 'https://graph.facebook.com/v2.3/' + page.id + '/posts?'+qp+'&access_token='+page.access_token;
          //console.log(postsUrl);
          request({
            url: postsUrl,
            json: true
          },function (e, r, b){
            if(e != null) {
              getMessagsFunc(user, page, function (err) {
                if(err != null) {
                  nextPage(err);
                } else {
                  nextPage();
                }
              })
            } else {
              if(b.data.length > 0) {
                var lastPostTimeUnix = Math.floor(new Date(b.data[0].created_time).getTime() / 1000);
                User.update({ _id: user.id },{ $set: {'services.facebook.lastPostTime': lastPostTimeUnix} },
                  function (err, numberAffected, raw){
                    if(err != null) {
                      getMessagsFunc(user, page, function (err) {
                        if(err != null) {
                          nextPage(err);
                        } else {
                          nextPage();
                        }
                      })
                    } else {
                      //iterate and store them in the database
                      async.eachLimit(b.data, 5, function (post, nextPost) {
                        esClient.count({
                          index: c.index,
                          body: {
                            query: {
                              term: {doc_source: 'facebook'},
                              term: {doc_type: 'post'},
                              term: {_id: post.id}
                            }
                          }
                        }, function(err, response){
                          if ((typeof err == 'undefined') && response.count == 0){
                            console.log(post);
                            esClient.create({
                              index: c.index,
                              type: user.domain,
                              id: post.id,
                              body: {
                                doc_source: 'facebook',
                                doc_type: 'post',
                                doc_text: post.message,
                                user_id: post.from != null ? post.from.id : '',
                                user_name: post.from != null ? post.from.name : '',
                                //user_lang: post.from.languages[0],
                                cadence_user_id: user.id,
                                time_stamp: post.created_time
                              }
                            }, function(err, response){
                              if (err){
                                console.log('Error async.each post esClient.create')
                                console.log(err)
                                nextPost(err)
                              } else {
                                console.log('facebook post ' + post.id + ' created.')
                                nextPost()
                              }
                            })
                          }else{
                            if (typeof err != 'undefined'){
                              console.log(response);
                              console.log('Error from count')
                              console.log(err)
                              nextPost(err)
                            }else{
                              console.log('post already exists in database')
                              nextPost()
                            }
                          }
                        })
                      }, function (err){

                        if (err){
                          console.log('Error async.each posts complete');
                          console.log(err);
                          getMessagsFunc(user, page, function (merr) {
                            if(merr == null) {
                              nextPage();
                            } else {
                              nextPage(merr);
                            }
                          });
                        } else {
                          getMessagsFunc(user, page, function (merr) {
                            if(merr == null) {
                              nextPage();
                            } else {
                              nextPage(merr);
                            }
                          });
                        }
                      });
                    }
                  });
              } else {
                console.log('no new posts');
                //nextPage();
                getMessagsFunc(user, page, function (err) {
                  if(err == null) {
                    nextPage();
                  } else {
                    nextPage(err);
                  }
                });
              }

            }

          });

          }, function (err){
          if (err){
            console.log('Error async.each pages complete');
            console.log(err);
            nextUser(err);
          } else {
            nextUser();
          }
        });
      }
    })
  },function(err){
      callback(err);
  })
}

function findFacebookMessages(user, page, callback){
  console.log('Get Messages for page: ' + page);
  //async.each(pages, function(page, nextPage){
    //get the conversations for each page
      var since = user.services.facebook.lastMessageTime;
      if(since === 'undefined' || since == null || since == '') {
        var now = new Date();
        since = Math.floor((new Date(now.getTime() - 30*24*60*60*1000)).getTime() / 1000);
      }
      var qp = 'fields=id,updated_time';//&since=' + since;
      var convoUrl = 'https://graph.facebook.com/v2.3/' + page.id + '/conversations?'+qp+'&access_token='+page.access_token;
      //console.log(convoUrl);
      request({
        url: convoUrl,
        json: true
      },function (e, r, b){
        if(e != null) {
          callback(e);
        } else {
          if(b.data.length > 0) {
            var lastMessageTimeUnix = Math.floor(new Date(b.data[0].updated_time).getTime() / 1000);
            User.update({ _id: user.id },{ $set: {'services.facebook.lastMessageTimeUnix': lastMessageTimeUnix} },
              function (err, numberAffected, raw){
                if(err != null) {
                  callback(err);
                } else {
                  //iterate and store them in the database
                  async.eachLimit(b.data, 5, function (convo, nextConvo) {
                    //get the messages for the conversation since the last message time
                    var mqp = 'fields=id,from,message,subject,created_time';//&since=' + since;
                    var messagesUrl = 'https://graph.facebook.com/v2.3/' + convo.id + '/messages?'+mqp+'&access_token='+page.access_token;
                    request({
                      url: messagesUrl,
                      json: true
                    }, function(me, mr, mb) {
                      if(me != null) {
                        nextConvo(err);
                      } else {
                        if(mb.data.length > 0) {
                          async.eachLimit(mb.data, 5, function (message, nextMessage) {
                            console.log(message);
                            esClient.count({
                               index: c.index,
                               body: {
                                 query: {
                                   term: {doc_source: 'facebook'},
                                   term: {doc_type: 'message'},
                                   term: {_id: message.id}
                                 }
                               }
                             }, function(err, response){
                              if ((typeof err == 'undefined') && response.count == 0){
                                console.log(message);
                                esClient.create({
                                 index: c.index,
                                 type: user.domain,
                                 id: message.id,
                                 body: {
                                   doc_source: 'facebook',
                                   doc_type: 'message',
                                   doc_text: message.message,
                                   user_id: message.from != null ? message.from.id : '',
                                   user_name: message.from != null ? message.from.name : '',
                                   //user_lang: post.from.languages[0],
                                   cadence_user_id: user.id,
                                   time_stamp: message.created_time,
                                   page_id: page.id
                                 }
                              }, function(err, response){
                                if (err){
                                   console.log('Error async.each message esClient.create')
                                   console.log(err)
                                  nextMessage(err)
                                } else {
                                   console.log('facebook message ' + message.id + ' created.')
                                  nextMessage()
                                }
                              });
                             }else{

                               if (typeof err != 'undefined'){
                                 console.log(response);
                                 console.log('Error from count')
                                 console.log(err)
                                 nextConvo(err)
                               }else{
                                 console.log('message already exists in database')
                                 nextConvo()
                               }
                             }
                             })
                          }, function (err) {
                            if(err) {
                              console.log('Error async.each messages complete');
                              console.log(err);
                              nextConvo(err);
                            } else {
                              nextConvo();
                            }
                          })
                        } else {
                          console.log('no new messages in ocnversation');
                          nextConvo();
                        }
                      }
                    })

                  }, function (err){
                    if (err != null){
                      console.log('Error async.each conversations complete');
                      console.log(err);
                      callback(err);
                    } else {
                      callback();
                    }
                  });
                }
              });
          } else {
            console.log('no new conversations');
            callback();
          }
          console.log(b);
        }
      });
}

async.waterfall([
   // deleteTwitterDirectMessages,
    deleteFacebookDirectMessages,
    findTwitterUsers,
    findTweets,
    findTwitterDirectMessages,
    findFacebookUsers,
    findFacebookData,
],function(err){
  if (err){
    console.log('Error async.waterfall complete')
    console.log(err)
    process.exit(1)
  }else {
    process.exit(0)
  }
})

