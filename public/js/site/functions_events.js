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
		STRING_ALERTS_MESSAGE = ' New Adverse Event',
		STRING_ALERTS_MESSAGE_PLURAL = ' New Adverse Events';

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

			// Get the Current Event Data
			var currentEvent = data.events[i];
			
			// Creation Date
			var currentEvent_creation = new Date(currentEvent.creation);
			currentEvent_creation = currentEvent_creation.getFullYear() + '/' + (currentEvent_creation.getMonth() < 10 ? ('0'+currentEvent_creation.getMonth()) : currentEvent_creation.getMonth() ) + '/' + (currentEvent_creation.getDate() < 10 ? ('0'+currentEvent_creation.getDate()) : currentEvent_creation.getDate() );
			
			// Creation Date in MM/DD/YYYY
			var currentEvent_creation_human = new Date(currentEvent.creation);
			currentEvent_creation_human = (currentEvent_creation_human.getMonth() < 10 ? ('0'+currentEvent_creation_human.getMonth()) : currentEvent_creation_human.getMonth() )+ '/' + (currentEvent_creation_human.getDate() < 10 ? ('0'+currentEvent_creation_human.getDate()) : currentEvent_creation_human.getDate() ) + '/' + currentEvent_creation_human.getFullYear();
			
			// Last Accessed Date
			var currentEvent_accessed = new Date(currentEvent.accessed);
			currentEvent_accessed = currentEvent_accessed.getFullYear() + '/' + (currentEvent_accessed.getMonth() < 10 ? ('0'+currentEvent_accessed.getMonth()) : currentEvent_accessed.getMonth() ) + '/' + (currentEvent_accessed.getDate() < 10 ? ('0'+currentEvent_accessed.getDate()) : currentEvent_accessed.getDate() );
			
			// Last Accessed Date in TimeAgo format
			var currentEvent_accessed_human = $.timeago(currentEvent_accessed);

			// Delegates whether an event is new or open
			if (currentEvent.status == STRING_STATUS_NEW){

				statusClass = STRING_STATUS_NEW_CLASS;
				actionText = STRING_STATUS_NEW_BUTTON;
				statusOrder = 0;

			} else if (currentEvent.status == STRING_STATUS_OPEN){

				statusClass = STRING_STATUS_OPEN_CLASS;
				actionText = STRING_STATUS_OPEN_BUTTON;
				statusOrder = 1;

			} else if (currentEvent.status == STRING_STATUS_CLOSED){

				statusClass = STRING_STATUS_CLOSED_CLASS;
				actionText = STRING_STATUS_CLOSED_BUTTON;
				statusOrder = 2;

			}

			// Create the table row with the given data
			tableHTML += '<tr data-id="'+currentEvent.id+'"" class="'+statusClass+'">';
			tableHTML += '<td class="event-item-status"><span class="event-item-robot">'+statusOrder+'</span>'+currentEvent.status.capitalizeFirstLetter()+'</td>';
			tableHTML += '<td><span class="event-item-robot">'+currentEvent_creation+'</span>'+currentEvent_creation_human+'</td>';
			tableHTML += '<td>'+currentEvent.channel.capitalizeFirstLetter()+'</td>';
			tableHTML += '<td>'+currentEvent.id+'</td>';
			tableHTML += '<td><span class="event-item-robot">'+currentEvent_accessed+'</span><span class="event-item-human">'+currentEvent_accessed_human.capitalizeFirstLetter()+'</span></td>';
			tableHTML += '<td><button class="btn btn-default event-action-btn '+statusClass+'">'+actionText+'</td>';
			tableHTML += '<td class="event-link-cell"><a target="_blank" href="'+currentEvent.link+'" title="'+currentEvent.channel+' Link">View Post<span class="entypo entypo-chevron-right"></span></td>';
			tableHTML += '</tr>';

			table.find('tbody').append(tableHTML);
			tableHTML = '';
		}
	}
}

function eventsCloseAll(){
	var button = $('.analytics-cta').filter("[data-events-action='close-all']");
	button.on('click', function(e){
		globalDebug('    Events Call: eventsCloseAll', 'color:purple;');

		if (confirm('Are you sure you want to close all Adverse Events?')) {
		    globalDebug('TODO: Close All Events');
		}
	})
}

function eventsStatusUpdateController(data){
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

		// TODO: Push updated status here.

		// Then reload page.
		location.reload();

	});

	
}

function eventsStatusUpdate(data){
	console.log("TODO");

	eventsDelegateAlerts(eventsCheckStatus(fakeEvents));
}


function eventsCheckStatus(data){
	globalDebug('   Events Call: eventsCheckStatus', 'color:purple;');

	var events = { "new": [], "open": [], count: 0 }
	for (var i = 0; i < data.events.length; i++){
		if (data.events[i].status == STRING_STATUS_NEW){
			events.new.push(data.events[i]);
			events.count++;
		} else if (data.events[i].status == STRING_STATUS_OPEN){
			events.open.push(data.events[i]);
			events.count++;
		}
	}
	return events;
}

function eventsDelegateAlerts(events){
	globalDebug('   Events Call: eventsDelegateAlerts', 'color:purple;');

	if (events.count && $('.alerts-block')[0]){

		if (events.new.length){
			$('.alerts-block').data('events-new-count', events.count)
			if (events.count == 1){
				$('.alerts-message p').html('1'+STRING_ALERTS_MESSAGE);
			} else {
				$('.alerts-message p').html(events.count+STRING_ALERTS_MESSAGE_PLURAL);
			}
			setTimeout(function(){
				$('.alerts-block').addClass('active');
			}, 200);
		}

		$('.event-alert').data('events-new-count', events.count)
		$('.event-alert span').html(events.count);
		setTimeout(function(){
			$('.event-alert').addClass('active');
		}, 200);

	}
}



