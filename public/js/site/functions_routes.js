///////////////////////////
//   FRONT END ROUTES    //
///////////////////////////

function routesInit(resizeOnce){
	if ($('body.dashboard')[0]){
		globalDebug('    routesInit: dashboard');

		
	}
	if ($('body.facebook')[0]){
		globalDebug('    routesInit: facebook');

		dataController('line',     '/api/1.0/facebook/reach', false, false, {selector: '#reach'});
		dataController('line',     '/api/1.0/facebook/engagement', false, false, {selector: '#engagement'});
		dataController('line',     '/api/1.0/facebook/acquisition', false, false, {selector: '#acquisition'});
		dataController('donut',    '/api/1.0/facebook/topCountries', false, false, {selector: '#top_countries'});
		dataController('top_post', '/api/1.0/facebook/topPost', false, false, {selector: '#top_post'});

	}
	if ($('body.twitter')[0]){
		globalDebug('    routesInit: twitter');

		dataController('line',      '/api/1.0/twitter/engagement',   false, false, {selector: '#engagement'});
		dataController('line',      '/api/1.0/twitter/acquisition',  false, false, {selector: '#acquisition'});
		dataController('donut',     '/api/1.0/twitter/topCountries', false, false, {selector: '#top_countries'});
		dataController('top_tweet', '/api/1.0/twitter/topTweet',     false, false, {selector: '#top_tweet'});

	}
	if ($('body.instagram')[0]){
		globalDebug('    routesInit: instagram');

				
	}
	if ($('body.youtube')[0]){
		globalDebug('    routesInit: youtube');

				
	}
	if ($('body.google-plus')[0]){
		globalDebug('    routesInit: google-plus');

				
	}
	if ($('body.analytics-all')[0]){
		globalDebug('    routesInit: analytics-all');

				
	}
	if ($('body.analytics-global')[0]){
		globalDebug('    routesInit: analytics-global');

				
	}
	if ($('body.analytics-us')[0]){
		globalDebug('    routesInit: analytics-us');

				
	}
	if ($('body.events')[0] && !resizeOnce){
		//globalDebug('    routesInit: events');

		if ($('#events-table')[0]){
			eventsTableData(fakeEvents, $('#events-table'));
			eventsTable($('#events-table'));
		
			eventsCloseAll();
		}
		
	}
}