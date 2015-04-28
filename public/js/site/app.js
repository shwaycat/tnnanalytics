$(window).resize(function(){

	//Front-End Functions
	compensateFooter();
	
	//Data Functions
	routesInit(true);

});


$(function() {

	//Data Functions
	routesInit();

	if (!$('body.session')[0]){
		var eventsObject = eventsCheckStatus(GLOBAL_API_DATA.events);
		eventsDelegateAlerts(eventsObject);
	}

	//Front-End Functions
	compensateFooter();
	elementReveal();

});
