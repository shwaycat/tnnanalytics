var keystone = require('keystone'),
    crypto = require('crypto'),
    _ = require('underscore'),
    request = require('request'),
    Types = keystone.Field.Types;
    AWS = require('aws-sdk'),
    ses = new AWS.SES(),
    jade = require('jade'),
    hostname = process.env.PDOMAIN;

/**
 * User model
 * @typedef {Object} User
 * @member {Field~Types~Name} name - human name
 * @member {Field~Types~Email} email - email address
 * @member {Field~Types~Password} password - password
 * @member {String} resetPasswordKey - TODO
 * @member {String} accountName - account that the user belongs to
 * @member {Boolean} isAccountRoot - indicates if the user is the top-level/root/main user of the account
 * @member {Field~Types~Textarea} keywords - Notifications - comma separated list of keywords/keyphrases for alerting
 * @member {Boolean} isAdmin - Permissions - TODO
 * @member {UserServices} services - hashtable of services by key
 */

var User = new keystone.List('User', {
  track: true,
  autokey: { path: 'key', from: 'name', unique: true }
});

var deps = {
  facebook: { 'services.facebook.isConfigured': true },
  google: { 'services.google.isConfigured': true },
  twitter: { 'services.twitter.isConfigured': true }
};

User.add({
  name: { type: Types.Name, required: true, index: true },
  email: { type: Types.Email, required: true, initial: true, index: true },
  password: { type: Types.Password, initial: true },
  resetPasswordKey: { type: String, hidden: true },
  accountName: { type: String, required: true, index: true, initial: true },
  isAccountRoot: { type: Boolean, "default": false },
  wasNew: { type: Boolean, default: true, hidden: true },
  keywords: { type: Types.Textarea, label: 'Keywords'}
}, 'Permissions', {
  isAdmin: { type: Boolean, label: 'Can Admin ' + keystone.get('brand') }
}, 'Services', {
  /**
   * User Services object - hashtable of services by key
   * @typedef {Object} UserServices
   * @member {UserServices~Facebook} facebook - Facebook
   * @member {UserServices~Twitter} twitter - Twitter
   * @member {UserServices~Google} google - Google TODO
   * @member {UserServices~Instagram} instagram - Instagram TODO
   * @member {UserServices~Youtube} youtube - Youtube TODO
   */
  services: {
    /**
     * Facebook Service
     * @typedef {Object} UserServices~Facebook
     * @member {Boolean} isConfigured - `true` if configured
     * @member {String} profileId - Facebook user profile ID
     * @member {String} username - Facebook username
     * @member {String} accessToken - OAuth access token
     * @member {String} refreshToken - OAuth refresh token
     * @member {String} pageID - Facebook page ID
    */
    facebook: {
      isConfigured: { type: Boolean, label: 'Facebook has been authenticated' },
      profileId: { type: String, label: 'Profile ID', dependsOn: deps.facebook },
      username: { type: String, label: 'Username', dependsOn: deps.facebook },
      accessToken: { type: String, label: 'Access Token', dependsOn: deps.facebook },
      refreshToken: { type: String, label: 'Refresh Token', dependsOn: deps.facebook },
      pageID: { type: String, label: 'Page ID', dependsOn: deps.pages }
    },
    /**
     * Google Service
     * @typedef {Object} UserServices~Google
     * @member {Boolean} isConfigured - `true` if configured
     * @member {String} profileId - Google user profile ID
     * @member {String} username - Google username
     * @member {String} accessToken - OAuth access token
     * @member {String} refreshToken - OAuth refresh token
    */
    google: {
      isConfigured: { type: Boolean, label: 'Google has been authenticated' },
      profileId: { type: String, label: 'Profile ID', dependsOn: deps.google },
      username: { type: String, label: 'Username', dependsOn: deps.google },
      accessToken: { type: String, label: 'Access Token', dependsOn: deps.google },
      refreshToken: { type: String, label: 'Refresh Token', dependsOn: deps.google }
    },
    /**
     * Twitter Service
     * @typedef {Object} UserServices~Twitter
     * @member {Boolean} isConfigured - `true` if configured
     * @member {String} profileId - Twitter user profile ID
     * @member {String} username - Twitter username
     * @member {String} accessToken - OAuth access token
     * @member {String} direct_messageSinceId - last DirectMessage
    */
    twitter: {
      isConfigured: { type: Boolean, label: 'Twitter has been authenticated' },
      profileId: { type: String, label: 'Profile ID', dependsOn: deps.twitter },
      username: { type: String, label: 'Username', dependsOn: deps.twitter },
      accessToken: { type: String, label: 'Access Token', dependsOn: deps.twitter },
      refreshToken: { type: String, label: 'Refresh Token', dependsOn: deps.twitter }
    }
  }
});


/**
 * Virtuals
 * ========
 */
User.schema.virtual('canAccessKeystone').get(function() {
  return this.isAdmin;
});


/**
 * Methods
 * =======
 */
User.schema.methods.resetPassword = function(callback) {
  this.resetPasswordKey = keystone.utils.randomString([16,24]);

  var emailSendOpts = {
        user: this,
        link: '/reset-password/' + this.resetPasswordKey,
        subject: 'Reset your ' + keystone.get('brand') + ' Password',
        to: this.email,
        from: {
          name: keystone.get('brand'),
          email: keystone.get('brand email')
        }
      };

  return this.save(function(err) {
    if (err) return callback(err);
    var email = new keystone.Email('forgotten-password');
    email.send(emailSendOpts, callback);
  });
};

User.schema.methods.getKeywords = function() {
  if (this.keywords) {
    return _.chain( this.keywords.trim().split(/\s*,\s*/) )
      .compact()
      .uniq()
      .value();
  } else {
    return [];
  }
};

//TODO paging
User.schema.methods.getAlertDocuments = function(callback) {
  if(this.getKeywords().length > 0) {
    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      from: 0,
      size: 1000000000,
      body:  {
        filter: {
          and: [
            { term: { cadence_user_id: this.id } },
            { 
              not: {
                term: { isNotified: "exists" }
              }
            }
          ]
        },
        query: {
          match_phrase: {
            doc_text: {
              query: this.getKeywords(),
              operator: "or"
            }
          }
        }
      }
    }, callback);
  } else {
    callback();
  }
};

User.schema.methods.sendNotificationEmail = function(links, callback) {
  var self = this;

  var html = jade.renderFile('templates/emails/notification.jade', {
      filename: 'templates/emails/forgotten-password.jade',
      username: self.name.full,
      host: hostname,
      links: links,
    });  
    var params = {
      Destination: { 
        ToAddresses: [
          self.email
        ]
      },
      Message: {
        Body: {
          Html: {
            Data: html
          }
        },
        Subject: { 
          Data: 'Cadence Notification'
        }
      },
      Source: 'no-reply@cadence.novo.mxmcloud.com',
      ReplyToAddresses: [
        'no-reply@cadence.novo.mxmcloud.com',
      ],
      ReturnPath: 'no-reply@cadence.novo.mxmcloud.com'
    };
    
    ses.sendEmail(params, function(err, data) {
      if (err) callback(err, err.stack); // an error occurred
      else     callback();               // successful response
    });




  // (new keystone.Email('notification')).send({
  //   subject: 'Cadence Notification',
  //   to: this.email,
  //   from: {
  //     name: 'Cadence',
  //     email: 'no-reply@maxmedia.com'
  //   },
  //   links: links
  // }, function(err, info) {
  //   if (err) {
  //     console.error("Error sending notification email to %s", self.email);
  //   } else {
  //     console.info("Sent notification email to %s", self.email);
  //   }

  //   callback(err, info);
  // });
};

User.schema.methods.facebookPages = function(callback) {
  var self = this;
  request({
    url: 'https://graph.facebook.com/v2.3/me/accounts',
    qs: {
      access_token: this.services.facebook.accessToken
    },
    json: true
  }, function (err, res, body) {
    if (err) {
      console.error("Error getting Facebook pages for %s\n%s", self.id, body);
      callback(err, body);
    } else {
      callback(null, body.data);
    }
  });
};

/**
 * Static Methods
 * ==============
 */
User.schema.statics.findConnectedFacebook = function(callback) {
  return this.find({ 'services.facebook.isConfigured': true }, callback);
};

User.schema.statics.findConnectedTwitter = function(callback) {
  return this.find({ 'services.twitter.isConfigured': true }, callback);
};

User.schema.statics.findConnectedGoogle = function(callback) {
  return this.find({ 'services.google.isConfigured': true }, callback);
};

User.schema.statics.findAccountRoots = function(callback) {
  return this.find({ 'isAccountRoot' : true }, callback);
}

User.schema.statics.findConnected = function(sources, callback) {
  if (callback === undefined && _.isFunction(sources)) {
    callback = sources;
    sources = ["facebook", "twitter"];
  }

  if (!_.isArray(sources)) {
    sources = [sources];
  }

  if (sources && !_.isArray(sources)) {
    sources = [sources];
  }

  return this.find({
    "$or": _.map(sources, function(s) {
      var result = {};
      result['services.' + s + '.isConfigured'] = true;
      return result;
    })
  }, callback);
};
// alias (deprecated)
User.schema.statics.findConnectedUsers = User.schema.statics.findConnected;

User.schema.statics.findWithKeywords = function(callback) {
  return this.find({
    "keywords": {
      "$exists": true,
      "$nin": [ null, "" ]
    }
  }, callback);
};

User.schema.statics.findConnectedWithKeywords = function(sources, callback) {
  if (callback === undefined && _.isFunction(sources)) {
    callback = sources;
    sources = ["facebook", "twitter"];
  }

  return this.find({
    "keywords": {
      "$exists": true,
      "$nin": [ null, "" ]
    },
    "$or": _.map(sources, function(s) {
      var result = {};
      result['services.' + s + '.isConfigured'] = true;
      return result;
    })
  }, callback);
};

User.schema.statics.findByID = function(id, callback) {
  return this.find({id: id}, callback);
};

User.schema.statics.findByEmail = function(email, callback) {
  return this.find({email: email}, callback);
};

User.schema.pre('save', function(next) {
  this.wasNew = this.isNew;
  next();
});

User.schema.post('save', function() {

  var self = this;
  if(self.wasNew) {
    
    self.resetPasswordKey = keystone.utils.randomString([16,24]);
    self.wasNew = false;

    self.save(function(err) {
      if(err) return callback(err);

      sendAccountEmail(self, true);
    });
  }

});

User.schema.methods.resetPassword = function(callback) {

  var self = this;
  self.resetPasswordKey = keystone.utils.randomString([16,24]);

  self.save(function(err) {
    if(err) return callback(err);

    sendAccountEmail(self, false, callback);
  });

};

function sendAccountEmail(user, isNewUser, callback) {
  if ('function' !== typeof callback) {
    callback = function() {};
  }

  var html = jade.renderFile('templates/emails/forgotten-password.jade', {
      filename: 'templates/emails/forgotten-password.jade',
      username: user.name.full,
      host: hostname,
      link: '/reset-password/' + user.resetPasswordKey,
      newUser: isNewUser
    });  
    var params = {
      Destination: { 
        ToAddresses: [
          user.email
        ]
      },
      Message: {
        Body: {
          Html: {
            Data: html
          }
        },
        Subject: { 
          Data: 'Cadence Account Information'
        }
      },
      Source: 'no-reply@cadence.novo.mxmcloud.com',
      ReplyToAddresses: [
        'no-reply@cadence.novo.mxmcloud.com',
      ],
      ReturnPath: 'no-reply@cadence.novo.mxmcloud.com'
    };
    
    ses.sendEmail(params, function(err, data) {
      if (err) callback(err, err.stack); // an error occurred
      else     callback();               // successful response
    });
}

/**
 * Registration
 * ============
 */
User.defaultColumns = 'name, email, twitter, isAdmin';
User.register();
