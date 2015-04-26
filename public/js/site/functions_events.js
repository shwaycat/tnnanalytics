var STRING_STATUS_NEW = 'new',
		STRING_STATUS_OPEN = 'open',
		statusClass = '',
		STRING_ALERTS_MESSAGE = ' New Adverse Event',
		STRING_ALERTS_MESSAGE_PLURAL = ' New Adverse Events';

function eventsTable(table){
	globalDebug('    Call: eventsTable');

	if(table != undefined && table[0]){
		table.DataTable({
			"pageLength": 15,
			"pagingType": "simple_numbers",
			"dom": 'rtp',
			"order": [[ 1, 'desc' ]],
			"oLanguage": {
	      "oPaginate": {
	        "sPrevious": "Prev"
	      }
	    }
		});

		$('.events-container').sectionLoad();
	}
}

function eventsTableData(data, table){
	globalDebug('    Call: eventsTableData');

	if(table != undefined && table[0]){
		var tableHTML = '';
		for (var i = 0; i < data.events.length; i++){

			statusClass = '';
			var currentEvent = data.events[i];
			var currentEvent_creation = new Date(currentEvent.creation);
			currentEvent_creation = currentEvent_creation.getFullYear() + '/' + (currentEvent_creation.getMonth() < 10 ? ('0'+currentEvent_creation.getMonth()) : currentEvent_creation.getMonth() ) + '/' + (currentEvent_creation.getDate() < 10 ? ('0'+currentEvent_creation.getDate()) : currentEvent_creation.getDate() );
			var currentEvent_accessed = new Date(currentEvent.accessed);
			currentEvent_accessed = currentEvent_accessed.getFullYear() + '/' + (currentEvent_accessed.getMonth() < 10 ? ('0'+currentEvent_accessed.getMonth()) : currentEvent_accessed.getMonth() ) + '/' + (currentEvent_accessed.getDate() < 10 ? ('0'+currentEvent_accessed.getDate()) : currentEvent_accessed.getDate() );
			var currentEvent_accessed_human = $.timeago(currentEvent_accessed);

			if (currentEvent.status == STRING_STATUS_NEW){
				statusClass = 'status-new';
			} else if (currentEvent.status == STRING_STATUS_OPEN){
				statusClass = 'status-open';
			}

			tableHTML += '<tr data-id="'+currentEvent.id+'"" class="'+statusClass+'"><td>Checkbox</td>';
			tableHTML += '<td>'+currentEvent_creation+'</td>';
			tableHTML += '<td>'+currentEvent.channel.capitalizeFirstLetter()+'</td>';
			tableHTML += '<td>'+currentEvent.status.capitalizeFirstLetter()+'</td>';
			tableHTML += '<td>'+currentEvent.id+'</td>';
			tableHTML += '<td><span class="event-item-robot">'+currentEvent_accessed+'</span><span class="event-item-human">'+currentEvent_accessed_human.capitalizeFirstLetter()+'</span></td>';
			tableHTML += '<td class="event-link-cell"><a href="'+currentEvent.link+'" title="'+currentEvent.channel+' Link">View Post<span class="entypo entypo-chevron-right"></span></td>';
			tableHTML += '</tr>';

			table.find('tbody').append(tableHTML);
			tableHTML = '';
		}
	}
}

function eventsCloseAll(){
	var button = $('.analytics-cta').filter("[data-events-action='close-all']");
	button.on('click', function(e){
		globalDebug('    Call: eventsCloseAll');

		if (confirm('Are you sure you want to close all Adverse Events?')) {
		    globalDebug('TODO: Close All Events');
		}
	})
}

function eventsCheckStatus(data){
	globalDebug('    Call: eventsCheckStatus');

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
	globalDebug('    Call: eventsDelegateAlerts');

	if (events.count && $('.alerts-block')[0]){

		if (events.new.length){
			$('.alerts-block').data('events-new-count', events.new.length)
			if (events.new.length == 1){
				$('.alerts-message p').html('1'+STRING_ALERTS_MESSAGE);
			} else {
				$('.alerts-message p').html(events.new.length+STRING_ALERTS_MESSAGE_PLURAL);
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



