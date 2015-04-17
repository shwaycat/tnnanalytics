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

// Take a set of elements and euqal their heights.
// function equalHeights(parent, selector){
// 	if (selector[0] && parent[0]){
// 		parent.each(function(parentI, parentE){
// 			var parent = $(this);
// 			var itemSet = $(this).find(selector);
// 			var newHeight = 0;
// 			itemSet.each(function(itemIndex, e){
// 				if ($(this).height() > newHeight){
// 					newHeight = $(this).height();
// 				}
// 			});
// 			itemSet.each(function(e, i){
// 				$(this).height(newHeight);
// 			});
// 		})

// 	}
// }

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

