///////////////////////////
//   FRONT END ROUTES    //
///////////////////////////

function routesInit(resizeOnce){

  if ($('body.dashboard')[0]){
    globalDebug('   Route: Dashboard', 'color:gray;');

    dataController('line',  'reach', '/api/1.0/dashboard/reach',               currentSelectedDate, {selector: '#reach', source: 'dashboard'});
    dataController('line',  'engagement', '/api/1.0/dashboard/engagement',     currentSelectedDate, {selector: '#engagement', source: 'dashboard'});
    dataController('line',  'acquisition', '/api/1.0/dashboard/acquisition',   currentSelectedDate, {selector: '#acquisition', source: 'dashboard'});
    dataController('donut', 'refTraffic', '/api/1.0/analyticsAll/refTraffic', currentSelectedDate, {selector: '#refTraffic', source: 'analyticsAll'});

  }
  if ($('body.facebook')[0]){
    globalDebug('   Route: Facebook', 'color:gray;');

    dataController('line',  'reach', '/api/1.0/facebook/reach',               currentSelectedDate, {selector: '#reach', source: 'facebook'});
    dataController('line',  'engagement', '/api/1.0/facebook/engagement',     currentSelectedDate, {selector: '#engagement', source: 'facebook'});
    dataController('line',  'acquisition', '/api/1.0/facebook/acquisition',   currentSelectedDate, {selector: '#acquisition', source: 'facebook'});
    dataController('donut', 'topCountries', '/api/1.0/facebook/topCountries', currentSelectedDate, {selector: '#topCountries', source: 'facebook'});
    if (!resizeOnce){
      dataController('topFacebookPost', 'topFacebookPost', '/api/1.0/facebook/topPost', currentSelectedDate, {selector: '#topFacebookPost', source: 'facebook' });
    }
  }
  if ($('body.twitter')[0]){
    globalDebug('   Route: Twitter', 'color:gray;');

    dataController('line',  'engagement', '/api/1.0/twitter/engagement',   currentSelectedDate, {selector: '#engagement', source: 'twitter'});
    dataController('line',  'acquisition', '/api/1.0/twitter/acquisition',  currentSelectedDate, {selector: '#acquisition', source: 'twitter'});
    dataController('donut', 'topCountries', '/api/1.0/twitter/topCountries', currentSelectedDate, {selector: '#topCountries', source: 'twitter'});
    if (!resizeOnce){
      dataController('topTweet', 'topTweet', '/api/1.0/twitter/topTweet',     currentSelectedDate, {selector: '#topTweet', source: 'twitter'});
    }
  }
  if ($('body.instagram')[0]){
    globalDebug('   Route: Instagram', 'color:gray;');

    dataController('line',  'engagement', '/api/1.0/instagram/engagement',   currentSelectedDate, {selector: '#engagement', source: 'instagram'});
    dataController('line',  'acquisition', '/api/1.0/instagram/acquisition',  currentSelectedDate, {selector: '#acquisition', source: 'instagram'});
    if (!resizeOnce){
      dataController('topInstagramPost', 'topInstagramPost', '/api/1.0/instagram/topPost',     currentSelectedDate, {selector: '#topInstagramPost', source: 'instagram'});
    }
  }
  if ($('body.google-plus')[0]){
    globalDebug('   Route: Google-Plus', 'color:gray;');

    dataController('line',  'reach', '/api/1.0/google/reach',               currentSelectedDate, {selector: '#reach', source: 'google'});
    dataController('line',  'engagement', '/api/1.0/google/engagement',     currentSelectedDate, {selector: '#engagement', source: 'google'});
    dataController('line',  'acquisition', '/api/1.0/google/acquisition',   currentSelectedDate, {selector: '#acquisition', source: 'google'});
    if (!resizeOnce){
      dataController('topGooglePost', 'topGooglePost', '/api/1.0/google/topPost', currentSelectedDate, {selector: '#topGooglePost', source: 'google' });
    }
  }
  if ($('body.youtube')[0]){
    globalDebug('   Route: Youtube', 'color:gray;');

    dataController('line',  'reach', '/api/1.0/youtube/reach',               currentSelectedDate, {selector: '#reach', source: 'youtube'});
    dataController('line',  'engagement', '/api/1.0/youtube/engagement',     currentSelectedDate, {selector: '#engagement', source: 'youtube'});
    dataController('line',  'acquisition', '/api/1.0/youtube/acquisition',   currentSelectedDate, {selector: '#acquisition', source: 'youtube'});
    dataController('donut', 'topCountries', '/api/1.0/youtube/topCountries', currentSelectedDate, {selector: '#topCountries', source: 'youtube'});
    if (!resizeOnce){
      dataController('topYoutubeVideo', 'topYoutubeVideo', '/api/1.0/youtube/topVideo', currentSelectedDate, {selector: '#topYoutubeVideo', source: 'youtube' });
    }
  }
  if ($('body.analytics-all')[0]){
    globalDebug('   Route: Analytics-All', 'color:gray;');

    dataController('donut', 'refTraffic', '/api/1.0/analyticsAll/refTraffic', currentSelectedDate, {selector: '#refTraffic', source: 'analyticsAll'});

  }
  if ($('body.analytics-global')[0]){
    globalDebug('   Route: Analytics-Global', 'color:gray;');

    dataController('donut', 'refTraffic', '/api/1.0/analyticsGlobal/refTraffic', currentSelectedDate, {selector: '#refTraffic', source: 'analyticsGlobal'});

  }
  if ($('body.analytics-us')[0]){
    globalDebug('   Route: Analytics-Us', 'color:gray;');

    dataController('donut', 'refTraffic', '/api/1.0/analyticsUs/refTraffic', currentSelectedDate, {selector: '#refTraffic', source: 'analyticsUs'});

  }
  if ($('body.events')[0] && !resizeOnce){
    globalDebug('   Route: Events', 'color:gray;');

    eventsTableController('/api/1.0/alerts/'+queryStringPage(), $('#events-table'));
  }
  if (!$('body.session')[0] && !resizeOnce){
    eventsCheckStatus();
  }
}
