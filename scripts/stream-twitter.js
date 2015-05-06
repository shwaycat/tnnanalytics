require('dotenv').load()

var keystone = require('../keystone-setup')(),
    debug = require('debug')('cadence:stream:twitter'),
    User = keystone.list('User'),
    async = require('async'),
    _ = require('underscore'),
    twitter = require('twitter'),
    connectES = require('../lib/connect_es'),
    sources = {
      twitter: require('../lib/sources/twitter')
    },
    Tweet = sources.twitter.tweet,
    Mention = sources.twitter.mention,
    DirectMessage = sources.twitter.direct_message,
    FollowerCount = sources.twitter.followerCount,
    AWS = require('aws-sdk'),
    sns = new AWS.SNS();


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
          if(data.friends_str || data.friends) {
            debug('Friend List Recived and Ignored');
          } else if (data.direct_message && data.direct_message.sender.id_str != user.services.twitter.profileId) {
            // Handle a DM
            handleDirectMessage(user, data, handleESError);
          } else if (data.retweeted_status && data.user.id_str != user.services.twitter.profileId) { 
            // Handle a Retweet no comment
            handleMention(user, data, handleESError);
            handleTweet(user, data.retweeted_status, handleESError);
          } else if (data.user && data.user.id_str != user.services.twitter.profileId) {
            // Handle a mention
            handleMention(user, data, handleESError);
          } else if (data.user && data.user.id_str == user.services.twitter.profileId) {
            // Handle a outgoing Tweet
            handleTweet(user, data, handleESError);
          } else {
            console.warn('Ignored Data: %j', data);
            sendSNS("ignore", data);
          }
        });
       
        stream.on('follow', function(data) {
          if(data.source.id_str != user.services.twitter.profileId) {
            handleFollow(user, data.target, handleESError);
          }
        });

        stream.on('favorite', function(data) {
          if(data.source.id_str != user.services.twitter.profileId) {
            handleFavorite(user, data, handleESError);
          }
        });

        stream.on('unfavorite', function(data) {
          if(data.source.id_str != user.services.twitter.profileId) {
            handleUnfavorite(user, data, handleESError);
          }
        });

        stream.on('error', function(error) {
          console.error(error);
          sendSNS("error", error);
          // throw error;
        });
      });
    });
  });


});

function sendSNS(type, data) {
  var subject = ''
  if(type == 'ignore') {
    subject = 'Ignored Data'
  } if (type == 'esError') {
    subject = 'Elastic Search Error';
  } else {
    subject = 'Alert/Error/Warning';
  }

  var params = {
    Message: JSON.stringify(data), /* required */
    MessageAttributes: {
      default: {
        DataType: 'String', /* required */
        StringValue: '????'
      },
    },
    MessageStructure: 'String',
    Subject: process.env.AWS_SNS_SUBJECT_PREFIX + subject,
    TopicArn: process.env.AWS_SNS_TOPIC_ARN
  };

  sns.publish(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });
}

function handleFavorite(user, data, callback) {
  debug('Handling Favorited Tweet');

  console.log('%s was favorited', data.target_object.id_str);
  // Add one to fix "off by 1 error"
  if(data && data.target_object) {
    data.target_object.favorite_count++;
  }
  Tweet.process(user, data.target_object, callback);
}

function handleUnfavorite(user, data, callback) {
  debug('Handling Unfavorited Tweet');

  console.log('%s was unfavorited', data.target_object.id_str);
  // Subtract one to fix "off by 1 error"
  if(data && data.target_object) {
    data.target_object.favorite_count--;
  }
  Tweet.process(user, data.target_object, callback);
}

function handleFollow(user, twitterUser, callback) {
  console.log('Handle Follow');
  // Add one to fix "off by 1 error"
  if(twitterUser) {
    twitterUser.followers_count++;
  }
  FollowerCount.process(user, twitterUser, callback);
}

function handleDirectMessage(user, data, callback) {
  debug('Handling Direct Message');
  var message = data.direct_message;
  DirectMessage.process(user, message, callback);

}

function handleMention(user, data, callback) {
  debug("Handling mention %s", data.id_str);
  var mention = data;
  console.log(mention);
  Mention.process(user, mention, callback);
}

function handleTweet(user, data, callback) {
  debug("Handling tweet %s", data.id_str);
  var tweet = data;
  Tweet.process(user, tweet, callback);
}

function handleESError(err) {
  if(err) {
    console.error(err);
    sendSNS('esError', err);
  }
}