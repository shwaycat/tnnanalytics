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

	$(options.selector).sectionLoad(true);
	
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

	$(options.selector).sectionLoad(true);
	
}