///////////////////////////
//   FRONT END ROUTES    //
///////////////////////////

function routesInit(resizeOnce){
	if ($('body.dashboard')[0]){
		globalDebug('   Route: Dashboard', 'color:gray;');

		
	}
	if ($('body.facebook')[0]){
		globalDebug('   Route: Facebook', 'color:gray;');

		dataController('line',      'reach', '/api/1.0/facebook/reach',               currentSelectedDate, {selector: '#reach', source: 'facebook'});
		dataController('line',      'engagement', '/api/1.0/facebook/engagement',     currentSelectedDate, {selector: '#engagement', source: 'facebook'});
		dataController('line',      'acquisition', '/api/1.0/facebook/acquisition',   currentSelectedDate, {selector: '#acquisition', source: 'facebook'});
		dataController('donut',     'topCountries', '/api/1.0/facebook/topCountries', currentSelectedDate, {selector: '#topCountries', source: 'facebook'});
		if (!resizeOnce){
			dataController('topPost', 'topPost', '/api/1.0/facebook/topPost',           currentSelectedDate, {selector: '#topPost', source: 'facebook' });
		}
		

	}
	if ($('body.twitter')[0]){
		globalDebug('   Route: Twitter', 'color:gray;');

		dataController('line',      'engagement', '/api/1.0/twitter/engagement',   currentSelectedDate, {selector: '#engagement', source: 'twitter'});
		dataController('line',      'acquisition', '/api/1.0/twitter/acquisition',  currentSelectedDate, {selector: '#acquisition', source: 'twitter'});
		dataController('donut',     'topCountries', '/api/1.0/twitter/topCountries', currentSelectedDate, {selector: '#topCountries', source: 'twitter'});
		if (!resizeOnce){
			dataController('topTweet', 'topTweet', '/api/1.0/twitter/topTweet',     currentSelectedDate, {selector: '#topTweet', source: 'twitter'});
		}

	}
	if ($('body.instagram')[0]){
		globalDebug('   Route: Instagram', 'color:gray;');

				
	}
	if ($('body.youtube')[0]){
		globalDebug('   Route: Youtube', 'color:gray;');

				
	}
	if ($('body.google-plus')[0]){
		globalDebug('   Route: Google-Plus', 'color:gray;');

				
	}
	if ($('body.analytics-all')[0]){
		globalDebug('   Route: Analytics-All', 'color:gray;');

				
	}
	if ($('body.analytics-global')[0]){
		globalDebug('   Route: Analytics-Global', 'color:gray;');

				
	}
	if ($('body.analytics-us')[0]){
		globalDebug('   Route: Analytics-Us', 'color:gray;');

				
	}
	if ($('body.events')[0] && !resizeOnce){
		globalDebug('   Route: Events', 'color:gray;');

		if ($('#events-table')[0]){
			eventsTableData(fakeEvents, $('#events-table'));
			eventsTable($('#events-table'));
		
			eventsCloseAll();
		}
		
	}
}