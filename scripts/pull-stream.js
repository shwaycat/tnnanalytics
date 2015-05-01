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
    },
    Tweet = sources.twitter.Tweet,
    Mention = sources.twitter.mention,
    DirectMessage = sources.twitter.direct_message,
    FollowerCount = require('../lib/sources/twitter/followerCount.js')


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
            // Handle a DM
            handleDirectMessage(user, data, handleESError);
          } else if (data.retweeted_status && data.user.id_str != user.services.twitter.profileId) { 
            // Handle a Retweet no comment
            handleMention(user, data.retweeted_status, handleESError);
          } else if (data.user && data.user.id_str != user.services.twitter.profileId) {
            // Handle a mention
            handleMention(user, data, handleESError);
          } else if (data.user && data.user.id_str == user.services.twitter.profileId) {
            // Handle a outgoing Tweet
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

        stream.on('favorite', function(data) {
          if(data.source.id_str != user.services.twitter.profileId) {
            handleFavorite(user, data, handleESError);
          }
        });

        stream.on('unfavorite', function(data) {
          if(data.source.id_str != user.services.twitter.profileId) {
            handleFavorite(user, data, handleESError);
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

function handleFavorite(user, data, callback) {
  debug('Handling Favorited Tweet');

  console.log('%s was favorited', data.target_object.id_str);

  Tweet.findOneWithDelta(data.target_object.id_str, function(err, tweet) {
    if(err) return callback(err);

    if(tweet.favorites_count != data.target_object.favorites_count) {
      tweet.createDelta('favorites_count', data.target_object.favorites_count, callback);
    } else {
      callback();
    }

  });
}

function handleDirectMessage(user, data, callback) {
  debug('Handling Direct Message');

      message = data.direct_message,
      directMessage = new DirectMessage(message.id_str);

  directMessage.populateFields(user, message);

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
      tweet = data,
      mention = new Mention(data.id_str);
      

  mention.populateFields(user, tweet);

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
      tweet = data,
      outgoingTweet = new Tweet(tweet.id_str);

  tweet.populateFields(user, tweet);

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