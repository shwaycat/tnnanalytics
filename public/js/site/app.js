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

  $('[data-toggle="tooltip"]').tooltip();

  if($('.alert-warning').length > 0) {
    showErrors();
  }

  setTimeout(function(){
    equalHeightPairs(1200);
  },5000);

  setInterval(function(){
    if (eventsCheckStatusOnInterval){
      eventsCheckStatus();
    }
  }, 60000);

  //Front-End Functions
  attachBrowserVersion();
  compensateFooter();
  elementReveal();
  printClick();

});
