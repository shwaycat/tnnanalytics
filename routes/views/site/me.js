var keystone = require('keystone')
	, _ = require('underscore')
	, Twitter = require('twitter')
	, FB = require('fb')

exports = module.exports = function(req, res) {

	var view = new keystone.View(req, res),
		locals = res.locals;

	locals.section = 'me';
	locals.page.title = locals.site.brand + ' Settings';
	locals.data = {
		twitter: []
	}


	/*/
		Load Facebook data

	 	Nookwit page id 464286813678947
	/*/
	view.on('init', function(next) {
		return next()
		FB.setAccessToken(req.user.services.facebook.accessToken)

		FB.api('TeamNovoNordisk/feed',function (results) {
			if(!results || results.error) {
				console.log(!results ? 'error occurred' : results.error);
				return;
			}
			_.each(results,function(result){
				//console.log('1111111111111111111111111111111111111111111')
				_.each(result, function(res) {
					//console.log('2222222222222222222222222222222222222222222')
					//console.log(res)
					FB.api(res.id+'/comments',function (comments) {
						console.log('3333333333333333333333333333333333333333333')
						console.log(comments)
						_.each(comments.data, function(comment){
							console.log('4444444444444444444444444444444444444444444')
							console.log(comment.from)
							FB.api(comment.from.id,function (profile) {
								console.log('5555555555555555555555555555555555555555555')
								console.log(profile)
							})
						})
					})
				})
			})
			next()
		});
	})

	// Load Twitter data
	view.on('init', function(next) {
	//skip for now
		return next()
		var client = new Twitter({
			consumer_key: process.env.TWITTER_API_KEY,
			consumer_secret: process.env.TWITTER_API_SECRET,
			access_token_key: req.user.services.twitter.accessToken,
			access_token_secret: req.user.services.twitter.refreshToken,
		})

		client.get('statuses/user_timeline', {}, function(err, tweets, response){
				if (err) {
					console.log(err)
					next(err)
				}
				console.log(tweets)
				locals.data.twitter = tweets
				next()
		});
	})

	/*/
		Handle disconnect requests
	/*/
	view.on('init', function(next) {

		if (!_.has(req.query, 'disconnect')) return next();

		var serviceName = '';

		switch(req.query.disconnect)
		{
			case 'facebook': req.user.services.facebook.isConfigured = null; serviceName = 'Facebook'; break;
			case 'google': req.user.services.google.isConfigured= null; serviceName = 'Google'; break;
			case 'twitter': req.user.services.twitter.isConfigured = null; serviceName = 'Twitter'; break;
		}

		req.user.save(function(err) {

			if (err) {
				req.flash('success', 'The service could not be disconnected, please try again.');
				return next();
			}

			req.flash('success', serviceName + ' has been successfully disconnected.');
			return res.redirect('/me');

		});

	});

	/*/
		Handle profile updates
	/*/
	view.on('post', { action: 'profile.details' }, function(next) {

		req.user.getUpdateHandler(req).process(req.body, {
			fields: 'name, email',
			flashErrors: true
		}, function(err) {

			if (err) {
				return next();
			}

			req.flash('success', 'Your changes have been saved.');
			return next();

		});

	});

	/*/
		Handle change password posts
	/*/
	view.on('post', { action: 'profile.password' }, function(next) {

		if (!req.body.password || !req.body.password_confirm) {
			req.flash('error', 'Please enter a password.');
			return next();
		}

		req.user.getUpdateHandler(req).process(req.body, {
			fields: 'password',
			flashErrors: true
		}, function(err) {

			if (err) {
				return next();
			}

			req.flash('success', 'Your changes have been saved.');
			return next();

		});

	});

	view.render('site/me');
	
}
