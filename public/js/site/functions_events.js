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

function eventsTableController(apiString, table){
	globalDebug('   Events Call: eventsTable', 'color:purple;');



	var	apiObj = {
				"data": [],
				"page": 0,
				"pageSize": 0,
				"total": 0,
				"source": "all",
				"success": false,
				"type": ""
			};
	$.get(apiString, function( data ) {
		
		apiObj.data = data.data;
		apiObj.page = data.page;
		apiObj.source = data.source;
		apiObj.success = data.success;
		apiObj.type = data.type;

		globalDebug('   Ajax SUCCESS!: '+apiString, 'color:green;');
	})
	.fail(function( data ) {
	  globalDebug('   Ajax FAILED!: '+apiString, 'color:red;');
	  apiObj = false;
	})
	.always(function( data ) {
		if (apiObj.success && apiObj.data.length && apiObj.page){

			eventsTableData(apiObj, table)
			
		}
		if (apiObj.data.length == 0){
			$('.events-no-data-warning').addClass('active')
		}
	});
}

function eventsTableData(apiObj, table){
	globalDebug('   Events Call: eventsTableData', 'color:purple;');

	if(table != undefined && table[0]){
		var tableHTML = '',
				paginationHTML = '',
				page = apiObj.page,
				pageSize = apiObj.pageSize,
				total = apiObj.total;

		for (var i = 0; i < apiObj.data.length; i++){

			statusClass = '';
			actionText = '';
			statusOrder = 0;
			urlHtml = '';

			var currentEvent,
					currentEvent_creation,
					currentEvent_creation_human,
					currentEvent_accessed,
					currentEvent_accessed_human;

			// Get the Current Event Data
			currentEvent = apiObj.data[i];
			
			// Creation Date
			currentEvent_creation = new Date(currentEvent.timestamp);
			currentEvent_creation = currentEvent_creation.getFullYear() + '/' + (currentEvent_creation.getMonth()+1 < 10 ? ('0'+(currentEvent_creation.getMonth()+1)) : currentEvent_creation.getMonth()+1 ) + '/' + (currentEvent_creation.getDate() < 10 ? ('0'+currentEvent_creation.getDate()) : currentEvent_creation.getDate() );
			
			// Creation Date in MM/DD/YYYY
			currentEvent_creation_human = new Date(currentEvent.timestamp);
			currentEvent_creation_human = (currentEvent_creation_human.getMonth()+1 < 10 ? ('0'+(currentEvent_creation_human.getMonth()+1)) : currentEvent_creation_human.getMonth()+1 )+ '/' + (currentEvent_creation_human.getDate() < 10 ? ('0'+currentEvent_creation_human.getDate()) : currentEvent_creation_human.getDate() ) + '/' + currentEvent_creation_human.getFullYear();
			
			
			if (currentEvent.alertStateUpdatedAt) {
				// Last Accessed Date
				currentEvent_accessed = new Date(currentEvent.alertStateUpdatedAt);
				currentEvent_accessed = currentEvent_accessed.getFullYear() + '/' + (currentEvent_accessed.getMonth()+1 < 10 ? ('0'+(currentEvent_accessed.getMonth()+1)) : currentEvent_accessed.getMonth()+1 ) + '/' + (currentEvent_accessed.getDate() < 10 ? ('0'+currentEvent_accessed.getDate()) : currentEvent_accessed.getDate() );
				
				// Last Accessed Date in TimeAgo format
				currentEvent_accessed_human = $.timeago(currentEvent_accessed);
			} else {
				currentEvent_accessed = '';
				currentEvent_accessed_human = '';
			}
			

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
				urlHtml = '<a target="_blank" href="'+currentEvent.url+'" title="'+currentEvent._type+' Link">View Event'
			}

			// Create the table row with the given data
			tableHTML += '<tr data-id="'+currentEvent._id+'"" class="'+statusClass+'">';
			tableHTML += '<td class="event-item-status"><span class="event-item-robot">'+statusOrder+'</span>'+currentEvent.alertState.capitalizeFirstLetter()+'</td>';
			tableHTML += '<td><span class="event-item-robot">'+currentEvent_creation+'</span>'+currentEvent_creation_human+'</td>';
			tableHTML += '<td>'+currentEvent._type.capitalizeFirstLetter()+'</td>';
			tableHTML += '<td>'+currentEvent._id+'</td>';
			tableHTML += '<td><span class="event-item-robot">'+currentEvent_accessed+'</span><span class="event-item-human">'+currentEvent_accessed_human.capitalizeFirstLetter()+'</span></td>';
			tableHTML += '<td><button class="btn btn-default event-action-btn '+statusClass+'">'+actionText+'</td>';
			tableHTML += '<td class="event-link-cell">'+urlHtml+'<span class="entypo entypo-chevron-right"></span></td>';
			tableHTML += '</tr>';

		}

		table.find('tbody').append(tableHTML);
		tableHTML = '';

		paginationHTML = eventsTablePagination(page, pageSize, total);

		eventsTableDraw($('#events-table'), paginationHTML);

	}
}

function eventsTableDraw(table, paginationHTML){

	table.DataTable({
		"paging": false,
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
	  ]
	});

	if($('#events-table_wrapper')[0]){
		$('#events-table_wrapper').append(paginationHTML);
	}
	

	eventsDirectMessage();
	$('.events-container').sectionLoad(false);

}

function eventsTablePagination(page, pageSize, total){
	if (total > pageSize){
		var paginateHTML = '<div class="dataTables_paginate paging_simple_numbers" id="events-table_paginate">',
				extended = false,
				ifFirst = '',
				ifLast = '',
				totalPages = false,
				prevHref = '',
				nextHref = '';

		totalPages = Math.ceil(total/pageSize);
		if (totalPages > 7) {
			extended = true;
		}
		if (page == 1){
			ifFirst = 'disabled';
		} else {
			prevHref = 'href="?page='+(page-1)+'"';
		}
		if (page == totalPages){
			ifLast = 'disabled';
		} else {
			nextHref = 'href="?page='+(page+1)+'"';
		}

		if (extended) {
			paginateHTML += '<a href="?page=1" class="paginate_button first '+ifFirst+'">First</a>';
		}
		
		paginateHTML += '<a '+prevHref+' class="paginate_button previous '+ifFirst+'">Prev</a><span>';
		
		var i = 1,
				offset = 1,
				max = 8;

		if (extended && page > 4 && (page < totalPages-2)) {
			offset = page-3;
			max = 7+offset;
		}
		if (extended && (page >= totalPages-2)) {
			offset = totalPages - 6;
			max = offset+7;
		}

		for (i = offset; i < max; i++) {
			var current = '';
			if (i == page){
				current = 'current';
			}
			paginateHTML += '<a href="?page='+i+'" class="paginate_button '+current+'" aria-controls="events-table" data-dt-idx="1" tabindex="0">'+i+'</a>';
		}
		
		paginateHTML += '</span><a '+nextHref+' class="paginate_button next '+ifLast+'">Next</a>';
		
		if (extended) {
			paginateHTML += '<a href="?page='+totalPages+'" class="paginate_button last '+ifLast+'">Last</a>';
		}
		
		paginateHTML += '</div>';
		
		return paginateHTML;

	} else {
		return '';
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

	var apiString = '/api/1.0/alerts/summary',
			apiObj = {
				"success": false,
				"type": false,
				"source": "all",
				"data": {}
			};
	$.get(apiString, function( data ) {
		
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

		count = (apiObj.data.new ? apiObj.data.new : 0) + (apiObj.data.open ? apiObj.data.open : 0);

		if (count){
			$('.alerts-block').data('events-count', count)
			if (count == 1){
				$('.alerts-message p').html('1'+STRING_ALERTS_MESSAGE);
			} else {
				$('.alerts-message p').html(count+STRING_ALERTS_MESSAGE_PLURAL);
			}
			$('.event-alert').data('events-count', count)
			$('.event-alert span').html(count);
			setTimeout(function(){
				$('.event-alert').addClass('active');
				$('.alerts-block').addClass('active');
			}, 200);
		}
	} else {
		$('.event-alert').data('events-count', count);
		$('.event-alert').removeClass('active');
	}
}



