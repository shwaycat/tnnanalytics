function topFacebookPost(data, options, success){

  // Preload Checks
  if (!$(options.selector)[0]) return;
  if (!data || !success || !data.data.url || data.data.url == undefined){
    $(options.selector).before(dataErrorHTML);
    $(options.selector).remove();
    return;
  } else if (data == null || data.length == 0){
    $(options.selector).before(noDataHTML);
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

    var fbPost = '<div data-href="'+theData.data.url+'" class="fb-post"></div>'

    var newDetailsHTML = '';
    var newDetails = [];

    newDetails[0] = [];
    newDetails[0][0] = 'Total Engagement';
    newDetails[0][1] = numberWithCommas(theData.data.score);

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
  if (!data || !success){
    $(options.selector).before(dataErrorHTML);
    $(options.selector).remove();
    return;
  } else if (data == null || data.length == 0){
    $(options.selector).before(noDataHTML);
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
    var newDetails = [];

    newDetails[0] = [];
    newDetails[0][0] = 'Total Engagement';
    newDetails[0][1] = numberWithCommas(theData.data.score);
    newDetails[1] = [];
    newDetails[1][0] = 'Favorites';
    newDetails[1][1] = numberWithCommas(theData.data.favorite_count);
    newDetails[2] = [];
    newDetails[2][0] = 'Replies';
    newDetails[2][1] = numberWithCommas(theData.data.reply_count);
    newDetails[3] = [];
    newDetails[3][0] = 'Retweets';
    newDetails[3][1] = numberWithCommas(theData.data.retweet_count);

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




function topInstagramPost(data, options, success){

  // Preload Checks
  if (!$(options.selector)[0]) return;
  if (!data || !success || !data.data.oembed || data.data.oembed == undefined){
    $(options.selector).before(dataErrorHTML);
    $(options.selector).remove();
    return;
  } else if (data == null || data.length == 0){
    $(options.selector).before(noDataHTML);
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

  if(options.source == 'instagram'){

    var post = $(options.selector);

    var oembedHTML = theData.oembed.html;

    var newDetailsHTML = '';
    var newDetails = [];
    newDetails[0] = [];
    newDetails[0][0] = 'Total Engagement';
    newDetails[0][1] = numberWithCommas(theData.data.score);
    newDetails[1] = [];
    newDetails[1][0] = 'Likes';
    newDetails[1][1] = numberWithCommas(theData.data.likes);
    newDetails[2] = [];
    newDetails[2][0] = 'Comments';
    newDetails[2][1] = numberWithCommas(theData.data.comments);

    for (var i = 0; i < newDetails.length; i++){
      newDetailsHTML += '<li><span>';
      newDetailsHTML += newDetails[i][0];
      newDetailsHTML += '</span><span>';
      newDetailsHTML += newDetails[i][1];
      newDetailsHTML += '</span></li>';
    }
    post.find('.instagram-container')
      .append(oembedHTML);
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




function topGooglePost(data, options, success){

  // Preload Checks
  if (!$(options.selector)[0]) return;
  if (!data || !success || !data.data.url || data.data.url == undefined){
    $(options.selector).before(dataErrorHTML);
    $(options.selector).remove();
    return;
  } else if (data == null || data.length == 0){
    $(options.selector).before(noDataHTML);
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

  if(options.source == 'googleplus'){

    var post = $(options.selector);

    var google_id = theData.data.account_id;
    var post_id = theData.data._id;
    var googleURL = theData.data.url;
    var googleHtml = '<div class="g-post" data-href="'+googleURL+'"></div>'

    var newDate = new Date(theData.data.createdAt);
    newDate = (newDate.getMonth() < 10 ? ('0'+newDate.getMonth()) : newDate.getMonth() )+ '/' + (newDate.getDate() < 10 ? ('0'+newDate.getDate()) : newDate.getDate() ) + '/' + newDate.getFullYear();


    var newDetailsHTML = '';
    var newDetails = [];

    newDetails[0] = [];
    newDetails[0][0] = 'Total Engagement';
    newDetails[0][1] = numberWithCommas(theData.data.score);
    newDetails[1] = [];
    newDetails[1][0] = "Comments";
    newDetails[1][1] = numberWithCommas(theData.data.comments);
    newDetails[2] = [];
    newDetails[2][0] = 'Shares';
    newDetails[2][1] = numberWithCommas(theData.data.resharers);
    newDetails[3] = [];
    newDetails[3][0] = "Plus 1's";
    newDetails[3][1] = numberWithCommas(theData.data.plusoners);

    for (var i = 0; i < newDetails.length; i++){
      newDetailsHTML += '<li><span>';
      newDetailsHTML += newDetails[i][0];
      newDetailsHTML += '</span><span>';
      newDetailsHTML += newDetails[i][1];
      newDetailsHTML += '</span></li>';
    }
    // post.find('.g-post')
    //   .data().href = googleURL;
    post.find('.google-container')
      .append(googleHtml);
    post.find('.post-details-list')
      .children().remove();
    post.find('.post-details-list')
      .append(newDetailsHTML);
    if (theData.data.createdAt){
      post.find('.post-creation')
        .append(newDate);
    }
    if (theData.data.url){
      post.find('.post-link')
        .attr('href', theData.data.url);
    }

    $.getScript("https://apis.google.com/js/plusone.js");

  }

  $(options.selector).sectionLoad(true, true);
  setTimeout(function(){
     equalHeightPairs();
  },1000);

}




function topYoutubeVideo(data, options, success){

  // Preload Checks
  if (!$(options.selector)[0]) return;
  if (!data || !success || !data.data._id || data.data._id == undefined){
    $(options.selector).before(dataErrorHTML);
    $(options.selector).remove();
    return;
  } else if (data == null || data.length == 0){
    $(options.selector).before(noDataHTML);
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

  if(options.source == 'youtube'){

    var post = $(options.selector);

    var youtube_id = theData.data._id;
    var youtubeHTML = '<iframe src="https://www.youtube.com/embed/'+youtube_id+'" frameborder="0" allowfullscreen></iframe>';
    var newDate = new Date(theData.data.createdAt);
    newDate = (newDate.getMonth() < 10 ? ('0'+newDate.getMonth()) : newDate.getMonth() )+ '/' + (newDate.getDate() < 10 ? ('0'+newDate.getDate()) : newDate.getDate() ) + '/' + newDate.getFullYear();

    var newDetailsHTML = '';
    var newDetails = [[]];
    newDetails[0][0] = 'Total Engagement';
    newDetails[0][1] = numberWithCommas(theData.data.score);
    newDetails[1][0] = 'Likes';
    newDetails[1][1] = numberWithCommas(theData.data.likes);
    newDetails[2][0] = 'Shares';
    newDetails[2][1] = numberWithCommas(theData.data.shares);
    newDetails[3][0] = 'Replies';
    newDetails[3][1] = numberWithCommas(theData.data.replies);
    newDetails[4][0] = 'Mentions';
    newDetails[4][1] = numberWithCommas(theData.data.mentions);
    newDetails[5][0] = 'Comments';
    newDetails[5][1] = numberWithCommas(theData.data.comments);
    newDetails[6][0] = 'View';
    newDetails[6][1] = numberWithCommas(theData.data.views);

    for (var i = 0; i < newDetails.length; i++){
      newDetailsHTML += '<li><span>';
      newDetailsHTML += newDetails[i][0];
      newDetailsHTML += '</span><span>';
      newDetailsHTML += newDetails[i][1];
      newDetailsHTML += '</span></li>';
    }
    post.find('.post-media')
      .append(youtubeHTML);
    post.find('.post-details-list')
      .children().remove();
    post.find('.post-details-list')
      .append(newDetailsHTML);
    if (theData.data.title){
      post.find('.post-title a')
        .append(theData.data.title);
    }
    if (theData.data.url){
      post.find('.post-title a')
        .attr('href', theData.data.url);
      post.find('.post-link')
        .attr('href', theData.data.url);
    }
    if (theData.data.createdAt){
      post.find('.post-creation')
        .append(newDate);
    }
    if (theData.data.content){
      post.find('.post-content')
        .append(theData.data.content);
    }

  }

  $(options.selector).sectionLoad(true, true);
  setTimeout(function(){
     equalHeightPairs();
  },1000);

}
