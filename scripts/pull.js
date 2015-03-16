var async = require('async')
	, mongoose = require('mongoose')
	, Schema = mongoose.Schema
	, _ = require('underscore')
	, fb = require('fb')
	, tw = require('twitter')

mongoose.connect('mongodb://localhost/cadence')

var userSchema = new Schema({
		services: {
			twitter: {
				isConfigured: Boolean,
				profileId: String,
				username: String,
				avatar: String,
				accessToken: String,
				refreshToken: String
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
	  this.find({ 'services.facebook.isConfigured': true }, cb);
}

userSchema.statics.findConnectedTwitter = function (cb) {
	  this.find({ 'services.twitter.isConfigured': true }, cb);
}

var User = mongoose.model('User', userSchema)

function findFacebookUsers(callback){
	User.findConnectedFacebook(function(err, users){
		if (err){
			callback(err)
		} else {
			callback(null, users)
		}
	})
}

function findFacebookPosts(users, callback){
	async.each(users, function(user, done){
		fb.setAccessToken(user.services.facebook.accessToken)
		fb.api('MaxMediaATL/feed',function (results) {
			console.log(results)
			done()
		})
	},function(err){
		callback(err)
	})
}

async.waterfall([
		findFacebookUsers,
		findFacebookPosts,
],function(err){
	if (err){
		console.log(err)
		process.exit(1)
	}else {
		process.exit(0)
	}
})

