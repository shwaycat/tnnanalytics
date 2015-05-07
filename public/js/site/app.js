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

	

	//Front-End Functions
	attachBrowserVersion();
	compensateFooter();
	elementReveal();
	
	$('[data-toggle="tooltip"]').tooltip();
	
	if($('.alert-warning').length > 0) {
		showErrors();
	}

});
