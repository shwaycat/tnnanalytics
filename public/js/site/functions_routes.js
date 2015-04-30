///////////////////////////
//   FRONT END ROUTES    //
///////////////////////////

function routesInit(resizeOnce){
	if ($('body.dashboard')[0]){
		globalDebug('    routesInit: dashboard');

		var source = 'dashboard';

		// Reach
		lineGraph(GLOBAL_API_DATA.dashboard.reach,{
			selector: '#reach',
			source: source,
			color: '',
		});

		// Engagement
		lineGraph(GLOBAL_API_DATA.dashboard.engagement,{
			selector: '#engagement',
			source: source,
			color: '',
		});

		// Acquisition
		lineGraph(GLOBAL_API_DATA.dashboard.acquisition,{
			selector: '#acquisition',
			source: source,
			color: '',
		});

		// Top Post
		// topPost(GLOBAL_API_DATA.dashboard.top_post,{
		// 	selector: '#top_post',
		// 	source: source,
		// 	color: '',
		// });

		// Top Countries
		donutGraph(GLOBAL_API_DATA.dashboard.top_countries,{
			selector: '#top_countries',
			source: source,
			color: '',
		});
		
	}
	if ($('body.facebook')[0]){
		globalDebug('    routesInit: facebook');

		var source = 'facebook';

		// Reach
		lineGraph(GLOBAL_API_DATA.facebook.reach,{
			selector: '#reach',
			source: source,
			color: '',
		});

		// Engagement
		lineGraph(GLOBAL_API_DATA.facebook.engagement,{
			selector: '#engagement',
			source: source,
			color: '',
		});

		// Acquisition
		lineGraph(GLOBAL_API_DATA.facebook.acquisition,{
			selector: '#acquisition',
			source: source,
			color: '',
		});

		// Top Post
		topPost(GLOBAL_API_DATA.facebook.top_post,{
			selector: '#top_post',
			source: source,
			color: '',
		});

		// Top Countries
		donutGraph(GLOBAL_API_DATA.facebook.top_countries,{
			selector: '#top_countries',
			source: source,
			color: '',
		});		

	}
	if ($('body.twitter')[0]){
		globalDebug('    routesInit: twitter');

		var source = 'twitter';

		// Engagement
		lineGraph(GLOBAL_API_DATA.twitter.engagement,{
			selector: '#engagement',
			source: source,
			color: '',
		});

		// Acquisition
		lineGraph(GLOBAL_API_DATA.twitter.acquisition,{
			selector: '#acquisition',
			source: source,
			color: '',
		});

		// Top Post
		// topPost(GLOBAL_API_DATA.twitter.top_post,{
		// 	selector: '#top_post',
		// 	source: source,
		// 	color: '',
		// });

		// Top Countries
		donutGraph(GLOBAL_API_DATA.twitter.top_countries,{
			selector: '#top_countries',
			source: source,
			color: '',
		});	
				
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
		globalDebug('    routesInit: events');

		if ($('#events-table')[0]){
			eventsTableData(GLOBAL_API_DATA.events, $('#events-table'));
			eventsTable($('#events-table'));
		
			eventsCloseAll();
		}
		
	}
}