$(window).resize(function(){

	//Front-End Functions
	compensateFooter();
	
	//Data Functions
	routesInit();

});


$(function() {

	//Front-End Functions
	compensateFooter();
	
	//Data Functions
	routesInit();

	var eventsObject = eventsCheckStatus(GLOBAL_API_DATA.fakeEvents);
	eventsDelegateAlerts(eventsObject);

});
