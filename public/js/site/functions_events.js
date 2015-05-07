var STRING_STATUS_NEW = 'new',
		STRING_STATUS_NEW_CLASS = 'status-new',
		STRING_STATUS_NEW_BUTTON = 'Mark Complete',
		STRING_STATUS_OPEN = 'open',
		STRING_STATUS_OPEN_CLASS = 'status-open',
		STRING_STATUS_OPEN_BUTTON = 'Mark Complete',
		STRING_STATUS_CLOSED = 'closed',
		STRING_STATUS_CLOSED_CLASS = 'status-closed',
		STRING_STATUS_CLOSED_BUTTON = 'Mark Incomplete',
		statusClass = '',
		statusOrder = 0,
		urlHtml = '',
		STRING_ALERTS_MESSAGE = ' New or Open Adverse Event',
		STRING_ALERTS_MESSAGE_PLURAL = ' New or Open Adverse Events';
		STRING_CLOSEALL_ERROR = 'There was a error with the request.'

function eventsTable(table){
	globalDebug('   Events Call: eventsTable', 'color:purple;');

	if(table != undefined && table[0]){
		table.DataTable({
			"pageLength": 15,
			"pagingType": "simple_numbers",
			"dom": 'rtp',
			"order": [[ 0, 'asc' ]],
			"columns": [
			    null,
			    null,
			    null,
			    null,
			    null,
			    { "orderable": false },
			    { "orderable": false }
			  ],
			"oLanguage": {
	      "oPaginate": {
	        "sPrevious": "Prev"
	      }
	    }
		});

		eventsDirectMessage();
		$('.events-container').sectionLoad(false);
	}
}

function eventsTableData(data, table){
	globalDebug('   Events Call: eventsTableData', 'color:purple;');

	if(table != undefined && table[0]){
		var tableHTML = '';
		for (var i = 0; i < data.events.length; i++){

			statusClass = '';
			actionText = '';
			statusOrder = 0;
			urlHtml = '';

			// Get the Current Event Data
			var currentEvent = data.events[i];
			
			// Creation Date
			var currentEvent_creation = new Date(currentEvent.timestamp);
			currentEvent_creation = currentEvent_creation.getFullYear() + '/' + (currentEvent_creation.getMonth() < 10 ? ('0'+currentEvent_creation.getMonth()) : currentEvent_creation.getMonth() ) + '/' + (currentEvent_creation.getDate() < 10 ? ('0'+currentEvent_creation.getDate()) : currentEvent_creation.getDate() );
			
			// Creation Date in MM/DD/YYYY
			var currentEvent_creation_human = new Date(currentEvent.timestamp);
			currentEvent_creation_human = (currentEvent_creation_human.getMonth() < 10 ? ('0'+currentEvent_creation_human.getMonth()) : currentEvent_creation_human.getMonth() )+ '/' + (currentEvent_creation_human.getDate() < 10 ? ('0'+currentEvent_creation_human.getDate()) : currentEvent_creation_human.getDate() ) + '/' + currentEvent_creation_human.getFullYear();
			
			// Last Accessed Date
			var currentEvent_accessed = new Date(currentEvent.alertStateUpdatedAt);
			currentEvent_accessed = currentEvent_accessed.getFullYear() + '/' + (currentEvent_accessed.getMonth() < 10 ? ('0'+currentEvent_accessed.getMonth()) : currentEvent_accessed.getMonth() ) + '/' + (currentEvent_accessed.getDate() < 10 ? ('0'+currentEvent_accessed.getDate()) : currentEvent_accessed.getDate() );
			
			// Last Accessed Date in TimeAgo format
			var currentEvent_accessed_human = $.timeago(currentEvent_accessed);

			// Delegates whether an event is new or open
			if (currentEvent.alertState == STRING_STATUS_NEW){

				statusClass = STRING_STATUS_NEW_CLASS;
				actionText = STRING_STATUS_NEW_BUTTON;
				statusOrder = 0;

			} else if (currentEvent.alertState == STRING_STATUS_OPEN){

				statusClass = STRING_STATUS_OPEN_CLASS;
				actionText = STRING_STATUS_OPEN_BUTTON;
				statusOrder = 1;

			} else if (currentEvent.alertState == STRING_STATUS_CLOSED){

				statusClass = STRING_STATUS_CLOSED_CLASS;
				actionText = STRING_STATUS_CLOSED_BUTTON;
				statusOrder = 2;

			}

			if (currentEvent.doc_type == 'direct_message') {
				urlHtml = '<a data-toggle="modal" data-events-url='+currentEvent.url+' data-events-has-modal="true" data-target="#eventsDirectMessageModal">View DM'
			} else {
				urlHtml = '<a target="_blank" href="'+currentEvent.url+'" title="'+currentEvent.source+' Link">View Post'
			}

			// Create the table row with the given data
			tableHTML += '<tr data-id="'+currentEvent.id+'"" class="'+statusClass+'">';
			tableHTML += '<td class="event-item-status"><span class="event-item-robot">'+statusOrder+'</span>'+currentEvent.alertState.capitalizeFirstLetter()+'</td>';
			tableHTML += '<td><span class="event-item-robot">'+currentEvent_creation+'</span>'+currentEvent_creation_human+'</td>';
			tableHTML += '<td>'+currentEvent.source.capitalizeFirstLetter()+'</td>';
			tableHTML += '<td>'+currentEvent.id+'</td>';
			tableHTML += '<td><span class="event-item-robot">'+currentEvent_accessed+'</span><span class="event-item-human">'+currentEvent_accessed_human.capitalizeFirstLetter()+'</span></td>';
			tableHTML += '<td><button class="btn btn-default event-action-btn '+statusClass+'">'+actionText+'</td>';
			tableHTML += '<td class="event-link-cell">'+urlHtml+'<span class="entypo entypo-chevron-right"></span></td>';
			tableHTML += '</tr>';

			table.find('tbody').append(tableHTML);
			tableHTML = '';
		}
	}
}

function eventsDirectMessage(){
	$('[data-events-has-modal="true"]').on('click', function(){
		var url = $(this).data('events-url');
		$('#eventsDirectMessageButton').attr('href', url);
	})
}

function eventsTableUpdateController(data){
	$('.event-action-btn').on('click',function(){
		var clicked = $(this);
		var row = clicked.parents('tr');
		var statusItem = row.children('.event-item-status');
		var eventID = row.data('id');

		if (clicked.hasClass(STRING_STATUS_NEW_CLASS)){

			row.removeClass(STRING_STATUS_NEW_CLASS).addClass(STRING_STATUS_CLOSED_CLASS);
			clicked.removeClass(STRING_STATUS_NEW_CLASS).addClass(STRING_STATUS_CLOSED_CLASS);
			clicked.html(STRING_STATUS_CLOSED_BUTTON);
			statusItem.html(STRING_STATUS_CLOSED.capitalizeFirstLetter());

		} else if (clicked.hasClass(STRING_STATUS_OPEN_CLASS)) {

			row.removeClass(STRING_STATUS_OPEN_CLASS).addClass(STRING_STATUS_CLOSED_CLASS);
			clicked.removeClass(STRING_STATUS_OPEN_CLASS).addClass(STRING_STATUS_CLOSED_CLASS);
			clicked.html(STRING_STATUS_CLOSED_BUTTON);
			statusItem.html(STRING_STATUS_CLOSED.capitalizeFirstLetter());

		} else if (clicked.hasClass(STRING_STATUS_CLOSED_CLASS)) {

			row.removeClass(STRING_STATUS_CLOSED_CLASS).addClass(STRING_STATUS_OPEN_CLASS);
			clicked.removeClass(STRING_STATUS_CLOSED_CLASS).addClass(STRING_STATUS_OPEN_CLASS);
			clicked.html(STRING_STATUS_OPEN_BUTTON);
			statusItem.html(STRING_STATUS_OPEN.capitalizeFirstLetter());

		}
		// TODO: Push updated status here.
		globalDebug('   Events Call: ' + eventID + ' Updated', 'color:purple;');
		eventsStatusUpdate(data);

	});

	$('#eventsCloseAll').on('click',function(){
		globalDebug('   Events Call: eventsCloseAll', 'color:purple;');

		var postObj = {
			
		}
		eventsStatusUpdate(postObj)
		

	});

	
}

function eventsStatusUpdate(postObj){
	var apiString = "/api/1.0/events/update";
	console.log('1')
	console.log(postObj);
	$.post(apiString, function( postObj ) {
  	console.log('2')
  	console.log(postObj);
	})
	.done(function(data) {
		console.log('3')
		console.log(data);
		globalDebug('   Ajax SUCCESS!: '+apiString, 'color:green;');
  })
	.fail(function( data ) {
		console.log('4')
		console.log(postObj);
	  globalDebug('   Ajax FAILED!: '+apiString, 'color:red;');
	})
	.always(function( data ) {
		console.log('5')
		console.log(postObj);
		if (postObj.all){
			location.reload();
		} else {
			eventsCheckStatus();
		}
	});

}


function eventsCheckStatus(data){
	globalDebug('   Events Call: eventsCheckStatus', 'color:purple;');

	var fakesummarydata = {
	    "success": true,
	    "type": "alert summary",
	    "source": "all",
	    "data": {
	        "closed": 2,
	        "new": 1,
	        "open": 1
	    }
	}

	var apiString = '/api/1.0/events/summary',
			apiObj = {
				"success": false,
				"type": false,
				"source": "all",
				"data": {
					"closed": 0,
					"new": 0,
					"open": 0
				}
			};
	$.get(apiString, function( data ) {
		data = fakesummarydata;
		apiObj.success = data.success;
		apiObj.type = data.type;
		apiObj.source = data.source;
		apiObj.data = data.data;

		globalDebug('   Ajax SUCCESS!: '+apiString, 'color:green;');
	})
	.fail(function( data ) {
	  globalDebug('   Ajax FAILED!: '+apiString, 'color:red;');
	  apiObj = false;
	})
	.always(function( data ) {
		if (apiObj.success){
			eventsDelegateAlerts(apiObj);
			return true;
		} else {
			return false;
		}
	});

}

function eventsDelegateAlerts(apiObj){
	globalDebug('   Events Call: eventsDelegateAlerts', 'color:purple;');

	var count = 0;

	if (apiObj.success && $('.alerts-block')[0] && (apiObj.data.new || apiObj.data.open) ){

		count = apiObj.data.new + apiObj.data.open;

		if (count){
			$('.alerts-block').data('events-count', count)
			if (count == 1){
				$('.alerts-message p').html('1'+STRING_ALERTS_MESSAGE);
			} else {
				$('.alerts-message p').html(count+STRING_ALERTS_MESSAGE_PLURAL);
			}
			setTimeout(function(){
				$('.alerts-block').addClass('active');
			}, 200);
		}

		$('.event-alert').data('events-count', count)
		$('.event-alert span').html(count);
		setTimeout(function(){
			$('.event-alert').addClass('active');
		}, 200);

	} else {
		$('.event-alert').data('events-count', count);
		$('.event-alert').removeClass('active');
	}
}



