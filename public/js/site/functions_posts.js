function topFacebookPost(data, options, success){

	// Preload Checks
	if (!$(options.selector)[0]) return;
	if (!data || data == undefined || data == null || !success || !data.data || !data.data.url || data.data.url == undefined){
		$(options.selector).before(dataErrorHTML);
		$(options.selector).remove();
		return;
	} else {
		$(options.selector).before(loadingGifHTML);
	}

	var theData = data;

	// Gets options in a data attr on the obj. Used to pass Keystone generated data.
	if ($(options.selector).data('admin-options') != '' || $(options.selector).data('admin-options') != null){
		options.admin_options = $(options.selector).data('admin-options');
	} else {
		options.admin_options = false;
	}

	if(options.source == 'facebook'){

		var post = $(options.selector);

		// theData = { data: { url: 'https://www.facebook.com/MaxMediaATL/posts/10153318926083185', score: '1234' } };

		var fbPost = '<div data-href="'+theData.data.url+'" class="fb-post"></div>'

		var newDetailsHTML = '';
		var newDetails = [[]];
		newDetails[0][0] = 'Total Engagement';
		newDetails[0][1] = theData.data.score;

		for (var i = 0; i < newDetails.length; i++){
			newDetailsHTML += '<li><span>';
			newDetailsHTML += newDetails[i][0];
			newDetailsHTML += '</span><span>';
			newDetailsHTML += newDetails[i][1];
			newDetailsHTML += '</span></li>';
		}
		post.find('.post')
			.append(fbPost);
		post.find('.post-details-list')
			.children().remove();
		post.find('.post-details-list')
			.append(newDetailsHTML);
	}

	$(options.selector).sectionLoad(true, true);
	setTimeout(function(){
		 equalHeightPairs();
	},1000);
	
}

function topTweet(data, options){

	// Preload Checks
	if (!$(options.selector)[0]) return;
	if (!data || data == undefined || data == null || !data.success){
		$(options.selector).before(dataErrorHTML);
		$(options.selector).remove();
		return;
	} else {
		//For Top Tweets, because oembed takes a while, I am loading this in the dataController
		//$(options.selector).before(loadingGifHTML);
	}

	var theData = data;

	// Gets options in a data attr on the obj. Used to pass Keystone generated data.
	if ($(options.selector).data('admin-options') != '' || $(options.selector).data('admin-options') != null){
		options.admin_options = $(options.selector).data('admin-options');
	} else {
		options.admin_options = false;
	}

	if(options.source == 'twitter'){

		var post = $(options.selector);

		// Creation Date in MM/DD/YYYY
		var newDate = new Date(theData.creation);
		newDate = (newDate.getMonth() < 10 ? ('0'+newDate.getMonth()) : newDate.getMonth() )+ '/' + (newDate.getDate() < 10 ? ('0'+newDate.getDate()) : newDate.getDate() ) + '/' + newDate.getFullYear();

		var newDetailsHTML = '';
		var newDetails = [[],[],[],[]];
		newDetails[0][0] = 'Total Engagement';
		newDetails[0][1] = theData.data.score;
		newDetails[1][0] = 'Favorites';
		newDetails[1][1] = theData.data.favorite_count;
		newDetails[2][0] = 'Replies';
		newDetails[2][1] = theData.data.reply_count;
		newDetails[3][0] = 'Retweets';
		newDetails[3][1] = theData.data.retweet_count;

		for (var i = 0; i < newDetails.length; i++){
			newDetailsHTML += '<li><span>';
			newDetailsHTML += newDetails[i][0];
			newDetailsHTML += '</span><span>';
			newDetailsHTML += newDetails[i][1];
			newDetailsHTML += '</span></li>';
		}

		post.find('.twitter-container')
			.append(theData.oembed.html);
		post.find('.post-details-list')
			.children().remove();
		post.find('.post-details-list')
			.append(newDetailsHTML);
	}

	$(options.selector).sectionLoad(true, true);
	setTimeout(function(){
		 equalHeightPairs(1200);
	},1000);
	
}