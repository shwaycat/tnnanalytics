$(window).resize(function(){

	//Front-End Functions
	compensateFooter();
	
	//Data Functions
	routesInit(true);

});


$(function() {

	//Data Functions
	routesInit();

	var eventsObject = eventsCheckStatus(GLOBAL_API_DATA.events);
	eventsDelegateAlerts(eventsObject);

	//Front-End Functions
	compensateFooter();

});
