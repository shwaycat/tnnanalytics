function compensateFooter(){
	if($('.footer-container')[0]){
		var windowHeight = document.documentElement.clientHeight;
		var mainHeight = parseInt($('.main-container').css('height'));
		var headerHeight = parseInt($('.header-container').css('height'));
		var footerHeight = parseInt($('.footer-container').css('height'));
		var newHeight = (mainHeight+headerHeight+footerHeight);
		if (newHeight < windowHeight) {
			newHeight = ((windowHeight - newHeight) + newHeight) - headerHeight - footerHeight;
			$('.main-container').css('height', newHeight);
		}
	}
}

function eventsTable(){
	if($('#events-table')[0]){
		$('#events-table').DataTable({
			"pageLength": 50,
			"pagingType": "simple_numbers",
			"dom": 'rtp',
			"order": [[ 1, 'desc' ]],
			"oLanguage": {
	      "oPaginate": {
	        "sPrevious": "Prev"
	      }
	    }
		});
	}
}

function eventsCloseAll(){
	var button = $('.analytics-cta').filter("[data-events-action='close-all']");
	button.on('click', function(e){
		if (confirm('Are you sure you want to close all Adverse Events?')) {
		    console.log('TODO: Close All Events');
		}
	})
}

function abbreviateNumber(value) {
  var newValue = value;
  if (value >= 1000) {
    var suffixes = ["", "k", "m", "b","t"];
    var suffixNum = Math.floor( (""+value).length/3 );
    var shortValue = '';
    for (var precision = 2; precision >= 1; precision--) {
      shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
      var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
      if (dotLessShortValue.length <= 2) { break; }
    }
    if (shortValue % 1 != 0)  shortNum = shortValue.toFixed(1);
    newValue = shortValue+suffixes[suffixNum];
  }
  return newValue;
}