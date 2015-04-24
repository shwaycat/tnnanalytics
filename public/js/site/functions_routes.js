///////////////////////////
//   FRONT END ROUTES    //
///////////////////////////

function routesInit(){
	if ($('body.dashboard')[0]){
		console.log('    routesInit: dashboard');

		
	}
	if ($('body.facebook')[0]){
		console.log('    routesInit: facebook');

		donutGraph(GLOBAL_API_DATA.fakedata4,{
			selector: '#top_countries',
			source: 'facebook',
			color: '',
		});

		lineGraph(GLOBAL_API_DATA.fakedata3,{
			selector: '#reach',
			source: 'facebook',
			color: '',
		});

	}
	if ($('body.twitter')[0]){
		console.log('    routesInit: twitter');

				
	}
	if ($('body.instagram')[0]){
		console.log('    routesInit: instagram');

				
	}
	if ($('body.youtube')[0]){
		console.log('    routesInit: youtube');

				
	}
	if ($('body.google-plus')[0]){
		console.log('    routesInit: google-plus');

				
	}
	if ($('body.analytics-all')[0]){
		console.log('    routesInit: analytics-all');

				
	}
	if ($('body.analytics-global')[0]){
		console.log('    routesInit: analytics-global');

				
	}
	if ($('body.analytics-us')[0]){
		console.log('    routesInit: analytics-us');

				
	}
	if ($('body.events')[0]){
		console.log('    routesInit: events');

		if ($('#events-table')[0]){
			eventsTableData(GLOBAL_API_DATA.fakeEvents, $('#events-table'));
			eventsTable($('#events-table'));
		
			eventsCloseAll();
		}
		
	}
}