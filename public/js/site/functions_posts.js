function topPost(data, options){

	// Preload Checks
	if (!$(options.selector)[0]) return;
	if (!data || data == undefined || data == null){
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

		// Creation Date in MM/DD/YYYY
		var newDate = new Date(theData.creation);
		newDate = (newDate.getMonth() < 10 ? ('0'+newDate.getMonth()) : newDate.getMonth() )+ '/' + (newDate.getDate() < 10 ? ('0'+newDate.getDate()) : newDate.getDate() ) + '/' + newDate.getFullYear();

		var newDetailsHTML = '';
		var newDetails = [[],[],[],[]];
		newDetails[0][0] = 'Total Engagement';
		newDetails[0][1] = theData.engagement;
		newDetails[1][0] = 'Shares';
		newDetails[1][1] = theData.shares
		newDetails[2][0] = 'Comments';
		newDetails[2][1] = theData.comments;
		newDetails[3][0] = 'Likes';
		newDetails[3][1] = theData.likes;

		for (var i = 0; i < newDetails.length; i++){
			newDetailsHTML += '<li><span>';
			newDetailsHTML += newDetails[i][0];
			newDetailsHTML += '</span><span>';
			newDetailsHTML += newDetails[i][1];
			newDetailsHTML += '</span></li>';
		}

		post.find('.post-title a')
			.html(theData.title)
			.attr('href', theData.url);
		post.find('.post-content')
			.html(theData.content);
		post.find('.post-creation')
			.html(newDate);
		post.find('.post-link')
			.attr('href', theData.url);
		post.find('.post-image img')
			.attr('src', theData.image);
		post.find('.post-details-list')
			.children().remove();
		post.find('.post-details-list')
			.append(newDetailsHTML);
	}

	$(options.selector).sectionLoad(true, true);
	
}

function topTweet(data, options){

	// Preload Checks
	if (!$(options.selector)[0]) return;
	if (!data || data == undefined || data == null){
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
	
}