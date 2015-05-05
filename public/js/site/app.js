$(window).resize(function(){

	//Front-End Functions
	compensateFooter();
	
	//Data Functions
	routesInit(true);

});

$(function() {

	//Data Functions
	if($('.date-container')[0]){
		dateController();
	}
	routesInit();

	if (!$('body.session')[0]){
		var eventsObject = eventsCheckStatus(fakeEvents);
		eventsDelegateAlerts(eventsObject);
	}

	//Front-End Functions
	compensateFooter();
	elementReveal();
	eventsStatusUpdateController(fakeEvents);
	$('[data-toggle="tooltip"]').tooltip();
	

});
