var keystone = require('keystone')
  , async = require('async')
  , crypto = require('crypto')
  , _ = require('underscore')
  , request = require('request')
  , Types = keystone.Field.Types

/**
 * User model
 * @typedef {Object} User
 * @member {Field~Types~Name} name - human name
 * @member {Field~Types~Email} email - email address
 * @member {Field~Types~Password} password - password
 * @member {String} resetPasswordKey - TODO
 * @member {String} accountName - account that the user belongs to
 * @member {Boolean} isAccountRoot - indicates if the user is the top-level/root/main user of the account
 * @member {Boolean} isPublic - Profile - indicates if the profile is public
 * @member {String} twitter - Profile - TODO
 * @member {Field~Types~Url} website - Profile - TODO
 * @member {String} gravatar - Profile - TODO
 * @member {Field~Types~Textarea} notifications.keywords - Notifications - comma separated list of keywords/keyphrases for alerting
 * @member {Boolean} isAdmin - Permissions - TODO
 * @member {Boolean} isVerified - Permissions - TODO
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
}

User.add({
  name: { type: Types.Name, required: true, index: true },
  email: { type: Types.Email, required: true, initial: true, index: true },
  password: { type: Types.Password, initial: true },
  resetPasswordKey: { type: String, hidden: true },
  accountName: { type: String, required: true, index: true, initial: true },
  isAccountRoot: { type: Boolean, default: false }
}, 'Profile', {
  isPublic: { type: Boolean, default: true },
  twitter: { type: String, width: 'short' },
  website: { type: Types.Url },
  gravatar: { type: String, noedit: true }
}, 'Notifications', {
//TODO make keywords top-level, not nested
  notifications: {
    keywords: { type: Types.Textarea, label: 'Keywords'},
  }
}, 'Permissions', {
  isAdmin: { type: Boolean, label: 'Can Admin ' + keystone.get('brand') },
  isVerified: { type: Boolean, label: 'Has a verified email address' }
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
     * @member {Boolean} isConfigured -
     * @member {String} profileId -
     * @member {String} username -
     * @member {String} avatar -
     * @member {String} accessToken -
     * @member {String} refreshToken -
     * @member {String} lastPostTime -
     * @member {String} lastMessageTime -
    */
    facebook: {
      isConfigured: { type: Boolean, label: 'Facebook has been authenticated' },

      profileId: { type: String, label: 'Profile ID', dependsOn: deps.facebook },

      username: { type: String, label: 'Username', dependsOn: deps.facebook },
      avatar: { type: String, label: 'Image', dependsOn: deps.facebook },

      accessToken: { type: String, label: 'Access Token', dependsOn: deps.facebook },
      refreshToken: { type: String, label: 'Refresh Token', dependsOn: deps.facebook },

      lastPostTime: { type: String, label: 'Last Post Time', dependsOn: deps.facebook },
      lastMessageTime: { type: String, label: 'Last Message Time', dependsOn: deps.facebook}
        //pageIds: { type: [String], label: 'Page Ids', dependsOn: deps.pages }


    },
    google: {
      isConfigured: { type: Boolean, label: 'Google has been authenticated' },

      profileId: { type: String, label: 'Profile ID', dependsOn: deps.google },

      username: { type: String, label: 'Username', dependsOn: deps.google },
      avatar: { type: String, label: 'Image', dependsOn: deps.google },

      accessToken: { type: String, label: 'Access Token', dependsOn: deps.google },
      refreshToken: { type: String, label: 'Refresh Token', dependsOn: deps.google }
    },
    twitter: {
      isConfigured: { type: Boolean, label: 'Twitter has been authenticated' },

      profileId: { type: String, label: 'Profile ID', dependsOn: deps.twitter },

      username: { type: String, label: 'Username', dependsOn: deps.twitter },
      avatar: { type: String, label: 'Image', dependsOn: deps.twitter },

      accessToken: { type: String, label: 'Access Token', dependsOn: deps.twitter },
      refreshToken: { type: String, label: 'Refresh Token', dependsOn: deps.twitter },
      sinceId: { type: String, label: 'Since Id', dependsOn: deps.twitter },
      dmSinceId: { type: String, label: 'Since Id', dependsOn: deps.twitter }
    }
  }
});


/**
  Pre-save
  =============
*/

User.schema.pre('save', function(next) {
  var str = this.email.toLowerCase().trim()
  this.gravatar = crypto.createHash('md5').update(str).digest('hex')
  next()
});


/**
 * Virtuals
 * ========
 */

// Link to member
User.schema.virtual('url').get(function() {
  return '/member/' + this.key
})

// Provide access to Keystone
User.schema.virtual('canAccessKeystone').get(function() {
  return this.isAdmin
})

// Pull out avatar image
User.schema.virtual('avatarUrl').get(function() {
  if (this.services.facebook.isConfigured && this.services.facebook.avatar) {
    return this.services.facebook.avatar
  }
  if (this.services.google.isConfigured && this.services.google.avatar) {
    return this.services.google.avatar
  }
  if (this.services.twitter.isConfigured && this.services.twitter.avatar) {
    return this.services.twitter.avatar
  }
})

// Usernames
User.schema.virtual('twitterUsername').get(function() {
  return (this.services.twitter && this.services.twitter.isConfigured) ? this.services.twitter.username : ''
})


/**
 * Methods
 * =======
 */
User.schema.methods.resetPassword = function(callback) {
  this.resetPasswordKey = keystone.utils.randomString([16,24])

  var emailSendOpts = {
        user: this,
        link: '/reset-password/' + this.resetPasswordKey,
        subject: 'Reset your '+keystone.get('brand')+' Password',
        to: this.email,
        from: { name: keystone.get('brand'), email: keystone.get('brand email') }
      }

  return this.save(function(err) {
    if (err) {
      callback(err)
    } else {
      (new keystone.Email('forgotten-password')).send(emailSendOpts, callback)
    }
  });
}

User.schema.methods.getKeywords = function() {
  if (this.notifications && this.notifications.keywords) {
    return _.chain( this.notifications.keywords.trim().split(/\s*,\s*/) )
      .compact()
      .uniq()
      .value()
  } else {
    return []
  }
}

//TODO paging
User.schema.methods.getAlertDocuments = function(cb) {
  /*
  var orQueries = _.map(user.getKeywords(), function(kw) {
    return { query: { match_phrase: { doc_text: kw } } }
  })
  body: {
    query: {
      term: { cadence_user_id: user.id },
      term: { notified: false }
    },
    filter: {
      or: orQueries
    }
  }
  */

  keystone.elasticsearch.search({
    index: keystone.get('elasticsearch index'),
    from: 0,
    size: 1000000000,
    body: {
      filter: {
        and: [
          { term: { cadence_user_id: this.id } },
          { term: { notified: false } }
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
  }, cb)
}

User.schema.methods.sendNotificationEmail = function(links, callback) {
  //TODO set the subject and from values via keystone settings
  (new keystone.Email('notification')).send({
    subject: 'Cadence Notification',
    to: this.email,
    from: {
      name: 'Cadence',
      email: 'no-reply@maxmedia.com'
    },
    links: links
  }, function(err, info) {
    if (err) {
      console.error("Error sending notification email to %s", user.email)
    } else {
      console.info("Sent notification email to %s", user.email)
    }

    callback(err, info)
  })
  //
}

User.schema.methods.facebookPages = function(callback) {
  var self = this
  request({
    url: 'https://graph.facebook.com/v2.3/me/accounts?access_token=' + user.services.facebook.accessToken,
    json: true
  }, function (err, res, body) {
    if (err) {
      console.error("Error getting pages for %s\n%s", user.id, body)
      callback(err, body)
    } else {
      callback(null, body.data)
    }
  })
}

/**
 * Static Methods
 * ==============
 */
User.schema.statics.findConnectedFacebook = function(cb) {
  return this.find({ 'services.facebook.isConfigured': true }, cb)
}

User.schema.statics.findConnectedTwitter = function(cb) {
  return this.find({ 'services.twitter.isConfigured': true }, cb)
}

User.schema.statics.findConnected = function(sources, cb) {
  if (cb === undefined && _.isFunction(sources)) {
    cb = sources
    sources = ["facebook", "twitter"]
  }

  return this.find({
    "$or": _.map(sources, function(s) {
      var result = {}
      result['services.' + s + '.isConfigured'] = true
      return result
    })
  }, cb);
}
// alias (deprecated)
User.schema.statics.findConnectedUsers = User.schema.statics.findConnected

User.schema.statics.findWithKeywords = function(cb) {
  return this.find({
    "notifications.keywords": {
      "$exists": true,
      "$nin": [ null, "" ]
    }
  }, cb);
}

User.schema.statics.findConnectedWithKeywords = function(sources, cb) {
  if (cb === undefined && _.isFunction(sources)) {
    cb = sources
    sources = ["facebook", "twitter"]
  }

  return this.find({
    "notifications.keywords": {
      "$exists": true,
      "$nin": [ null, "" ]
    },
    "$or": _.map(sources, function(s) {
      var result = {}
      result['services.' + s + '.isConfigured'] = true
      return result
    })
  }, cb);
}


/**
 * Registration
 * ============
 */
User.defaultColumns = 'name, email, twitter, isAdmin';
User.register();
