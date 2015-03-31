require('dotenv').load()

var async = require('async')
  , request = require('request')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , elasticsearch = require('elasticsearch')
  , tw = require('twitter')
  , c = require('../config.json')
  , _ = require('underscore')

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
        profileId: String,
        lastPostTime: String,
        lastMessageTime: String
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
      ////console.log('Error in findTwitterUsers')
      ////console.log(err)
      callback(err)
    } else {
      //console.log('found users');
      callback(null, users)
    }
  })
}

function resetUsersLastTimes(users, callback) {
  async.eachLimit(users, 5, function(user, nextUser) {
    User.update({ _id: user.id },{ $set: {'services.twitter.sinceId': ''},
      $set: {'services.twitter.dmSinceId': ''},
      $set: {'services.facebook.lastPostTime': ''},
      $set: {'services.facebook.lastMessageTime': ''}},
      function (err, numberAffected, raw) {
      if(err) {
        console.log('error User.update');
        console.log(err);
        nextUser(err);
      } else {
        console.log('User ' + user.id + ' last times reset');
        nextUser();
      }
    });
  }, function (err) {
    if(err) {
      console.log('error resetUsersLastTimes');
      console.log(err);
      callback(err, users);
    } else {
      console.log('resetUsersLastTimes completed');
      callback(users);
    }
  });
}

function deleteTwitterMentions(callback) {
  esClient.count({
    index: c.index,
    body: {
      query: {
        term: {doc_type: 'mention'}
      }
    }
  }, function(err, response){
    if(err == null && response.count > 0) {
      console.log('Mentions To Delete: ' + response.count);
      esClient.deleteByQuery({
        index: c.index,
        body: {
          query: {
            term: {doc_type: 'mention'}
          }
        }
      }, function(err, response){
        callback();
      })
    } else if(err != null) {
      callback(err);
    } else {
      console.log('No Mentions to Delete');
      callback();
    }
  });
}

function deleteTwitterDirectMessages(callback) {
  esClient.count({
    index: c.index,
    body: {
      query: {
        term: {doc_type: 'direct_message'}
      }
    }
  }, function(err, response) {
    if (err == null && response.count > 0) {
      console.log('Direct Messages To Delete: ' + response.count);
      esClient.deleteByQuery({
        index: c.index,
        body: {
          query: {
            term: {doc_type: 'direct_message'}
          }
        }
      }, function (err, response) {
        callback();
      })
    } else if(err != null) {
      callback(err);
    } else {
      console.log('No Direct Messages to Delete');
      callback();
    }
  });
}

function deleteFacebookDirectMessages(callback) {
  esClient.count({
    index: c.index,
    body: {
      query: {
        term: {doc_type: 'message'}
      }
    }
  }, function(err, response) {
    if (err == null && response.count > 0) {
      console.log('Messages To Delete: ' + response.count);
      esClient.deleteByQuery({
        index: c.index,
        body: {
          query: {
            term: {doc_type: 'message'}
          }
        }
      }, function (err, response) {
        callback();
      })
    } else if(err != null) {
      callback(err);
    } else {
      console.log('No Messages to Delete');
      callback();
    }
  });
}

function deleteFacebookPosts(callback) {
  esClient.count({
    index: c.index,
    body: {
      query: {
        term: {doc_type: 'post'}
      }
    }
  }, function(err, response) {
    if (err == null && response.count > 0) {
      console.log('Posts To Delete: ' + response.count);
      esClient.deleteByQuery({
        index: c.index,
        body: {
          query: {
            term: {doc_type: 'post'}
          }
        }
      }, function (err, response) {
        console.log('Posts Deleted');
        // ////console.log(response);
        callback();
      })
    } else if(err != null) {
      callback(err);
    } else {
      console.log('No Posts to Delete');
      callback();
    }
  });
}

function deleteFacebookComments(callback) {
  esClient.count({
    index: c.index,
    body: {
      query: {
        term: {doc_type: 'comment'}
      }
    }
  }, function(err, response) {
    if (err == null && response.count > 0) {
      console.log('Comments To Delete: ' + response.count);
      esClient.deleteByQuery({
        index: c.index,
        body: {
          query: {
            term: {doc_type: 'comment'}
          }
        }
      }, function (err, response) {
        console.log('Comments Deleted');
        console.log(err);
        callback();
      })
    } else if(err != null) {
      callback(err);
    } else {
      console.log('No Comments to Delete');
      callback();
    }
  });
}
function findTweets(users, callback){
  console.log('finding tweets');
  async.each(users, function(user, nextUser){
    var client = new tw({
      consumer_key: process.env.TWITTER_API_KEY,
      consumer_secret: process.env.TWITTER_API_SECRET,
      access_token_key: user.services.twitter.accessToken,
      access_token_secret: user.services.twitter.refreshToken,
    })

    var params = {count: 200, include_rts: 1}

    // We've made a query already, let's not get anything before that tweet
    if (user.services.twitter.sinceId && user.services.twitter.sinceId != '') {
      //params.since_id = user.services.twitter.sinceId;
    }
    //console.log(params);
    client.get('statuses/mentions_timeline', params, function(err, tweets, response){

      if (err) {
        console.log('Error statuses/mentions_timeline')
        console.log(err)
        nextUser(err)
      }
      if (tweets.length > 0) {
        console.log(tweets.length + ' tweets recovered');
        // Update User with most recent tweet
        User.update({ _id: user.id },{ $set: {'services.twitter.sinceId': tweets[0].id_str} }, function (err, numberAffected, raw){
          if (err){
            console.log('Error User.update')
            console.log(err)
            nextUser(err)
          } else {
            async.eachLimit(tweets, 5, function(tweet, nextTweet){
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
                        cadence_user_id: user.id,
                        notified: false,
                      }
                    }, function(err, response){
                      if (err){
                        console.log('Error async.each esClient.create')
                        console.log(err)
                        nextTweet(err)
                      } else {
                        console.log('tweet ' + tweet.id_str + ' created');
                        nextTweet()
                      }
                    })
                }else{
                  if (typeof err != 'undefined'){
                    console.log('Error from count')
                    console.log(err)
                    nextTweet(err)
                  }else{
                    console.log('tweet ' + tweet.id_str + ' already exists in database');
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
  console.log('finding direct messages');
  async.each(users, function(user, nextUser){
    var client = new tw({
      consumer_key: process.env.TWITTER_API_KEY,
      consumer_secret: process.env.TWITTER_API_SECRET,
      access_token_key: user.services.twitter.accessToken,
      access_token_secret: user.services.twitter.refreshToken
    });

    var params = {count: 200, include_entities: 0};

    // We've made a query already, let's not get anything before that tweet
    if (user.services.twitter.dmSinceId && user.services.twitter.dmSinceId != '' ) {
     // params.since_id = user.services.twitter.dmSinceId;
    }

    client.get('direct_messages', params, function(err, messages, response){
      if (err) {
        console.log('Error direct_messages');
        console.log(err);
        nextUser(err);
      }
      if (messages.length > 0) {
        console.log(messages.length + ' twitter direct messages to create');
        // Update User with most recent direct message
        User.update({ _id: user.id },{ $set: {'services.twitter.dmSinceId': messages[0].id_str} },
          function (err, numberAffected, raw){
          if (err){
            console.log('Error User.update')
            console.log(err)
            nextUser(err)
          } else {
            async.eachLimit(messages, 5, function(message, nextMessage){
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
                      time_stamp: message.created_at,
                      notified: false
                    }
                  }, function(err, response){
                    if (err){
                      console.log('Error async.each esClient.create')
                      console.log(err)
                      nextMessage(err)
                    } else {
                      console.log('twitter direct message ' + message.id_str + ' created in database');
                      nextMessage()
                    }
                  })
                }else{
                  if (typeof err != 'undefined'){
                    console.log('Error from count')
                    console.log(err)
                    nextMessage(err)
                  }else{
                    console.log('twitter direct message ' + message.id_str + ' exists in database');
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
      console.log('found facebook users');
      callback(null, users)
    }
  })
}

function findFacebookPages(users, callback) {
  //console.log('finding facebook pages');
  var pageArray = [];
  async.eachLimit(users, 1, function(user, nextUser){
    //console.log('find pages for user: ' + user.id);
    var pageUrl = 'https://graph.facebook.com/v2.3/me/accounts?access_token='+user.services.facebook.accessToken;
    request({
      url: pageUrl,
      json: true
    }, function (error, response, body) {

      if(error != null) {
        //console.log('error request accounts completed');
        ////console.log(error);
        nextUser(error);
      } else {
        async.reduce(body.data, pageArray, function(pages, page, cb) {
          page.user = user;
          //console.log('Assigned User to Page: ' + page.id + ' - ' + page.user.id);
          pages.push(page);
         // //console.log(pages.length);
         // //console.log(page);
          cb(null, pages);
        }, function (err, result) {
          ////console.log(result);
          pageArray = result;
          if(err) {
            nextUser(err);
          } else {
            nextUser();
          }
        });
      }
    })
  },function(err){
    ////console.log(pageArray);
    ////console.log(pages);

    if(err != null) {
      console.log("Error async.each users complete");
      console.log(err);
      callback(err, pageArray);
    }
    else {
      callback(null, pageArray);
    }
  })
}
//fields=id,message,updated_time,commments{id,message},likes{id,name},shares{id,name}
function findFacebookPosts(pages, callback){
  //console.log('finding facebook posts for ' + pages.length + ' pages');
    async.eachLimit(pages, 5, function(page, nextPage){
      var since = page.user.services.facebook.lastPostTime;
      if(since === 'undefined' || since == null || since == '') {
        var now = new Date();
        since = Math.floor((new Date(now.getTime() - 30*24*60*60*1000)).getTime() / 1000);
      }
      var qp = 'fields=id,message,created_time,from&since=' + since;
      var postsUrl = 'https://graph.facebook.com/v2.3/' + page.id + '/posts?'+qp+'&access_token='+page.access_token;
      request({
        url: postsUrl,
        json: true
      },function (e, r, b){
        if(e != null) {
          console.log('error request posts failed');
          console.log(e);
          nextPage(e);
        } else {
          if(b.data.length > 0) {
            //console.log('Recording ' + b.data.length + ' posts');
            var lastPostTimeUnix = Math.floor(new Date(b.data[0].created_time).getTime() / 1000);

            User.update({ _id: page.user.id },{ $set: {'services.facebook.lastPostTime': lastPostTimeUnix} },
              function (err, numberAffected, raw){
                if(err != null) {
                  console.log('error update last post time');
                  console.log(err);
                  nextPage(err);
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
                        esClient.create({
                          index: c.index,
                          type: page.user.domain,
                          id: post.id,
                          body: {
                            doc_source: 'facebook',
                            doc_type: 'post',
                            doc_text: post.message,
                            user_id: post.from != null ? post.from.id : '',
                            user_name: post.from != null ? post.from.name : '',
                            //user_lang: post.from.languages[0],
                            cadence_user_id: page.user.id,
                            time_stamp: post.created_time,
                            page_id: page.id,
                            access_token: page.access_token
                          }
                        }, function(err, response){
                          if (err){
                            console.log('Error async.each post esClient.create')
                            console.log(err)
                            nextPost(err)
                          } else {
                            console.log('facebook post created: ' + post.id + ' for user: ' + page.user.id);
                            nextPost()
                          }
                        })
                      }else{
                        if (err){
                          console.log('Error from post count')
                          console.log(err)
                          nextPost(err)
                        }else {
                          console.log('facebook post already recorded to database');
                          nextPost();
                        }
                      }
                    })
                  }, function (err){
                    if (err){
                      console.log('Error async.each posts complete');
                      console.log(err);
                      nextPage(err);
                    } else {
                      console.log('no new posts to record');
                      nextPage();
                    }
                  });
                }
              });
          } else {
            nextPage();
          }
        }
      });
      }, function (err){
        if (err){
          console.log('Error async.each pages complete');
          console.log(err);
          callback(err, pages);
        } else {
          callback(null, pages);
        }
    });
}

function findFacebookMessages(pages, callback) {
  console.log('finding facebook messages');
  async.eachLimit(pages, 5, function (page, nextPage) {
    var since = page.user.services.facebook.lastMessageTime;
    console.log('Last Message Time' + since);
    if (since === 'undefined' || since == null || since == '') {
      var now = new Date();
      since = Math.floor((new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)).getTime() / 1000);
    }
    var qp = 'fields=id,updated_time,messages&since=' + since;
    var convoUrl = 'https://graph.facebook.com/v2.3/' + page.id + '/conversations?' + qp + '&access_token=' + page.access_token;
    request({
      url: convoUrl,
      json: true
    }, function (e, r, b) {
      if (e != null) {
        callback(e);
      } else {
        if (b.data.length > 0) {
          var lastMessageTimeUnix = Math.floor(new Date(b.data[0].updated_time).getTime() / 1000);
          User.update({_id: page.user.id}, {$set: {'services.facebook.lastMessageTime': lastMessageTimeUnix}},
            function (err, numberAffected, raw) {
              if (err != null) {
                console.log('Error user.update complete');
                console.log(err);
                callback(err);
              } else {
                //iterate and store them in the database
                async.eachLimit(b.data, 5, function (convo, nextConvo) {
                  if (convo.messages.data.length > 0) {
                    console.log(convo.messages.data.length + ' messages found in conversation ' + convo.id);
                    async.eachLimit(convo.messages.data, 5, function (message, nextMessage) {
                      esClient.count({
                        index: c.index,
                        body: {
                          query: {
                            term: {doc_type: 'message'},
                            term: {_id: message.id}
                          }
                        }
                      }, function (err, response) {
                        if ((typeof err == 'undefined') && response.count == 0) {
                          esClient.create({
                            index: c.index,
                            type: page.user.domain,
                            id: message.id,
                            body: {
                              doc_source: 'facebook',
                              doc_type: 'message',
                              doc_text: message.message,
                              user_id: message.from != null ? message.from.id : '',
                              user_name: message.from != null ? message.from.name : '',
                              //user_lang: post.from.languages[0],
                              cadence_user_id: page.user.id,
                              time_stamp: message.created_time,
                              page_id: page.id,
                              notified: false
                            }
                          }, function (err, response) {
                            if (err) {
                              console.log('Error async.each message esClient.create')
                              console.log(err)
                              nextMessage(err)
                            } else {
                              console.log('message created');
                              nextMessage()
                            }
                          });
                        } else {
                          if (typeof err != 'undefined') {
                            console.log('Error from count')
                            console.log(err)
                            nextConvo(err)
                          } else {
                            console.log('message already recorded to database');
                            nextConvo()
                          }
                        }
                      })
                    }, function (err) {
                      if (err) {
                        console.log('Error async.each messages complete');
                        console.log(err);
                        nextConvo(err);
                      } else {
                        nextConvo();
                      }
                    })
                  } else {
                    console.log('no new messages found');
                    nextConvo();
                  }
                }, function (err) {
                  if (err != null) {
                    console.log('Error async.each conversations complete');
                    console.log(err);
                    nextPage(err);
                  } else {
                    nextPage();
                  }
                });
              }
            });
        } else {
          nextPage();
        }
      }
    });
  }, function (err) {
    var uniqueUsers = _.pluck(_.uniq(pages, false, function (page) {
      return page.user.id;
    }), 'user');
    if(err) {
      console.log("Error async.each users complete");
      console.log(err);
      callback(err, uniqueUsers);
    } else {
      callback(null, uniqueUsers);
    }
  })
}

function findFacebookComments(users, callback){
  async.each(users, function(user, nextUser){
    console.log('finding comments for user ' + user.id);
    esClient.search({
      index: c.index,
      type: user.domain,
      body: {
        query: {
          term: { cadence_user_id: user.id },
          term: { doc_source: 'facebook' }
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
        var postsAndComments = _.filter(response.hits.hits, function(hit) {
          console.log('Document Type: ' + hit._source.doc_source + '.' + hit._source.doc_type);
          return hit._source.doc_type == 'post' || hit._source.doc_type == 'comment';
        });

        console.log('Found Total of ' + postsAndComments.length + ' commentable objects');
        async.eachLimit(postsAndComments, 5, function(object, nextObject) {
          //console.log(object);
          findFacebookCommentsForObject(user, object._source.page_id, object._id, object._source.access_token, function (err) {
            if(err != null) {
              console.log('Error findFacebookCommentsForObject complete');
              console.log(err);
              nextObject(err);
            } else {
              nextObject();
            }
          })
        }, function (err){
          if(err != null) {
            console.log('error async.each commentableObject completed');
            console.log(err);
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

function findFacebookCommentsForObject(user, pageId, commentableId, accessToken, callback) {
  var qp = 'fields=id,comment_count,from,message,created_time';
  var commentsUrl = 'https://graph.facebook.com/v2.3/' + commentableId + '/comments?'+qp+'&access_token='+accessToken;
  //console.log(commentsUrl);
  request({
    url: commentsUrl,
    json: true
  },function (e, r, b){
    if(e != null) {
      callback(e);
    } else {
      if(b.data.length > 0) {
        var newLastCommentTimeUnix = Math.floor(new Date(b.data[0].created_time).getTime() / 1000);
        User.update({_id: user.id}, {$set: {'services.facebook.lastCommentTime': newLastCommentTimeUnix}},
          function (err, numberAffected, raw) {
            if (err) {
              console.log('Error last comment time update');
              console.log('err');
              callback(err);
            } else {
              //iterate and store them in the database
              async.eachLimit(b.data, 5, function (comment, nextComment) {
                //console.log(comment);
                esClient.count({
                  index: c.index,
                  body: {
                    query: {
                      term: {doc_type: 'comment'},
                      term: {_id: comment.id}
                    }
                  }
                }, function (err, response) {
                  if ((typeof err == 'undefined') && response.count == 0) {
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
                        cadence_user_id: user.id,
                        time_stamp: comment.created_time,
                        page_id: pageId,
                        access_token: accessToken,
                        notified:false
                      }
                    }, function (err, response) {
                      if (err) {
                        console.log('Error async.each comment esClient.create')
                        console.log(err)
                        nextComment(err)
                      } else {
                        console.log('facebook comment created with id: ' + comment.id);
                        if(comment.comment_count > 0) {
                         console.log('facebook comment ' + comment.id + ' has ' + comment.comment_count + ' replies.');
                         findFacebookCommentsForObject(user, pageId, comment.id, accessToken, function (err) {
                           if(err) {
                             console.log('Error findFacebookCommentsForObject recursion');
                             console.log(err);
                            nextComment(err);
                           } else {
                            nextComment();
                           }
                         });
                       } else {
                         console.log('facebook comment ' + comment.id + ' has no replies');
                         nextComment()
                       }
                      }
                    });
                  } else {
                    if (err) {
                      console.log('Error from comment count')
                      console.log(err)
                      nextComment(err)
                    } else {
                      console.log('facebook comment ' + comment.id + ' already in database');
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
            }
          });
      } else {
        console.log('facebook object ' + commentableId + ' has no comments');
        callback();
      }
    }
  });
}

async.waterfall([
    /*deleteTwitterMentions,
    deleteTwitterDirectMessages,
    deleteFacebookDirectMessages,
    deleteFacebookPosts,
    deleteFacebookComments,*/
    findTwitterUsers,
    //resetUsersLastTimes,
    findTweets,
    findTwitterDirectMessages,
    findFacebookUsers,
    //resetUsersLastTimes,
    findFacebookPages,
    findFacebookPosts,
    findFacebookMessages,
    findFacebookComments
],function(err){
  if (err){
    console.log('Error async.waterfall complete')
    console.log(err)
    process.exit(1)
  }else {
    process.exit(0)
  }
})

