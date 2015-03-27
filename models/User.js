var keystone = require('keystone'),
  async = require('async'),
  crypto = require('crypto'),
  Types = keystone.Field.Types;

/**
 * Users Model
 * ===========
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
  domain: { type: String, hidden: true },
  password: { type: Types.Password, initial: true },
  resetPasswordKey: { type: String, hidden: true }
}, 'Profile', {
  isPublic: { type: Boolean, default: true },
  twitter: { type: String, width: 'short' },
  website: { type: Types.Url },
  gravatar: { type: String, noedit: true }
}, 'Notifications', {
  notifications: {
    keywords: { type: Types.Textarea, label: 'Keywords'},
  }
}, 'Permissions', {
  isAdmin: { type: Boolean, label: 'Can Admin ' + keystone.get('brand') },
  isVerified: { type: Boolean, label: 'Has a verified email address' }
}, 'Services', {
  services: {
    facebook: {
      isConfigured: { type: Boolean, label: 'Facebook has been authenticated' },

      profileId: { type: String, label: 'Profile ID', dependsOn: deps.facebook },

      username: { type: String, label: 'Username', dependsOn: deps.facebook },
      avatar: { type: String, label: 'Image', dependsOn: deps.facebook },

      accessToken: { type: String, label: 'Access Token', dependsOn: deps.facebook },
      refreshToken: { type: String, label: 'Refresh Token', dependsOn: deps.facebook },

      pages : {
        lastPostTime: { type: String, label: 'Last Post Time', dependsOn: deps.pages },
        lastMessageTime: { type: String, label: 'Last Message Time', dependsOn: deps.pages},
        pageIds: { type: [String], label: 'Page Ids', dependsOn: deps.pages }
      }

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

  var member = this;

  async.parallel([

    function(done) {

      var str = member.email.toLowerCase().trim()

      member.domain = str.substring(str.lastIndexOf("@") + 1, str.length)

      member.gravatar = crypto.createHash('md5').update(str).digest('hex');

      return done();

    }
    // add another function if needed
    // , function (done) {}
  ], next);

});



/**
 * Virtuals
 * ========
 */

// Link to member
User.schema.virtual('url').get(function() {
  return '/member/' + this.key;
});

// Provide access to Keystone
User.schema.virtual('canAccessKeystone').get(function() {
  return this.isAdmin;
});

// Pull out avatar image
User.schema.virtual('avatarUrl').get(function() {
  if (this.services.facebook.isConfigured && this.services.facebook.avatar) return this.services.facebook.avatar;
  if (this.services.google.isConfigured && this.services.google.avatar) return this.services.google.avatar;
  if (this.services.twitter.isConfigured && this.services.twitter.avatar) return this.services.twitter.avatar;
});

// Usernames
User.schema.virtual('twitterUsername').get(function() {
  return (this.services.twitter && this.services.twitter.isConfigured) ? this.services.twitter.username : '';
});

/**
 * Methods
 * =======
*/

User.schema.methods.resetPassword = function(callback) {

  var user = this;

  user.resetPasswordKey = keystone.utils.randomString([16,24]);

  user.save(function(err) {

    if (err) return callback(err);

    new keystone.Email('forgotten-password').send({
      user: user,
      link: '/reset-password/' + user.resetPasswordKey,
      subject: 'Reset your '+keystone.get('brand')+' Password',
      to: user.email,
      from: {
        name: keystone.get('brand'),
        email: keystone.get('brand email')
      }
    }, callback);

  });

}


/**
 * Registration
 * ============
*/

User.defaultColumns = 'name, email, twitter, isAdmin';
User.register();
