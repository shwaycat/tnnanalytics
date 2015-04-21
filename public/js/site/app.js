$(window).resize(function(){

	compensateFooter();

	routesInit();

});


$(function() {

	//Front-End Functions
	compensateFooter();
	eventsTable();

	//Data Functions
	eventsCloseAll();

	routesInit();

});
