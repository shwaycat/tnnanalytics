require('dotenv').load()

var keystone = require('../keystone-setup')(),
    debug = require('debug')('pull-stream'),
    User = keystone.list('User'),
    async = require('async'),
    _ = require('underscore'),
    twitter = require('twitter'),
    connectES = require('../lib/connect_es'),
    sources = {
      twitter: require('../lib/sources/twitter')
    };

require('../lib/keystone-script')(connectES, function(done) {

  User.model.findConnectedTwitter(function(err, users) {

    async.eachSeries(users, function(user, nextUser) {
      var client = new twitter({
            consumer_key: process.env.TWITTER_API_KEY,
            consumer_secret: process.env.TWITTER_API_SECRET,
            access_token_key: user.services.twitter.accessToken,
            access_token_secret: user.services.twitter.refreshToken
          }),
          params = {
            stall_warnings: true,
            stringify_friend_ids: true,
            with: 'user'
          };
  
      client.stream('user', params, function(stream) {
        debug('Stream started for user id %s', user.services.twitter.profileId);
        
        stream.on('data', function(data) {
          debug('Data: %j', data);
          if(data.friends_str || data.friends) {
            debug('Friend List Recived and Ignored');
          } else if (data.direct_message && data.direct_message.sender.id_str != user.services.twitter.profileId) {
            handleDirectMessage(user, data, handleESError);
          } else if (data.retweeted_status && data.user.id_str != user.services.twitter.profileId) { 
            handleMention(user, data.retweeted_status, handleESError);
          } else if (data.user && data.user.id_str != user.services.twitter.profileId) {
            handleMention(user, data, handleESError);
          } else if (data.user && data.user.id_str == user.services.twitter.profileId) {
            handleTweet(user, data, handleESError);
          } else {
            debug('Ignored');
          }
        });
       
        stream.on('follow', function(data) {
          if(data.source.id_str != user.services.twitter.profileId) {
            console.log('NEW FOLLOWER');
          }
        });

        // NOT NOTIFIED ON EXTERNAL USER
        stream.on('unfollow', function(data) {          
          if(data.source.id_str != user.services.twitter.profileId) {
            console.log('WE LOST A FOLLOWER');
          }        
        });

        stream.on('favorite', function(data) {
          if(data.source.id_str != user.services.twitter.profileId) {
            console.log('%s was favorited', data.target_object.id_str);
          }
        });

        stream.on('unfavorite', function(data) {
          if(data.source.id_str != user.services.twitter.profileId) {
            console.log('%s was unfavorited', data.target_object.id_str);
          }
        });

        stream.on('error', function(error) {
          debug(error);
          throw error;
        });
      });
    });
  });


});

function handleDirectMessage(user, data, callback) {
  debug('Handling Direct Message');

  var DirectMessage = sources.twitter.direct_message,
      message = data.direct_message,
      directMessage = new DirectMessage(message.id_str);

  _.extend(directMessage, {
    doc_text: message.text,
    user_id: message.sender.id_str,
    user_name: message.sender.screen_name,
    user_lang: message.sender.lang,
    cadence_user_id: user.id,
    time_stamp: message.created_at
  });

  directMessage.create(function(err, res) {
    if (err) {
      if(res.status == 409) {
        debug('duplicate direct message');
        callback();
      } else {
        callback(err);
      }
    } else {
      debug("created direct_message %s", directMessage.id);
      callback();
    }
  });
}

function handleMention(user, data, callback) {
  debug("Handling mention %s", data.id_str);
  var Mention = sources.twitter.mention,
      tweet = data,
      mention = new Mention(data.id_str);
      

  _.extend(mention, {
    doc_text: tweet.text,
    user_id: tweet.user.id_str,
    user_name: tweet.user.screen_name,
    user_lang: tweet.user.lang,
    cadence_user_id: user.id,
    in_reply_to_status_id_str: tweet.in_reply_to_status_id_str,    
    time_stamp: tweet.created_at
  });

  mention.create(function(err, res) {
    if (err) {
      if(res.status == 409) {
        debug('duplicate mention');
        callback(null, res);
      } else {
        callback(err);
      }
    } else {
      debug("created mention %s", mention.id);        
      return callback();
    }
  })
}

function handleTweet(user, data, callback) {
  debug("Handling tweet %s", data.id_str);
  var Tweet = sources.twitter.tweet,
      tweet = data,
      outgoingTweet = new Tweet(tweet.id_str);

  _.extend(outgoingTweet, {
    doc_text: tweet.text,
    user_id: tweet.user.id_str,
    user_name: tweet.user.screen_name,
    user_lang: tweet.user.lang,
    cadence_user_id: user.id,
    time_stamp: tweet.created_at
  });

  outgoingTweet.create(function(err, res) {
    if (err) {
      if(res.status == 409) {
        debug('duplicate tweet');
        callback();
      } else {
        callback();
      }
    } else {
      debug("created tweet %s", outgoingTweet.id);
      return callback();
    }
  });
}

function handleESError(err) {
  if(err) {
    console.error(err);
  }
}