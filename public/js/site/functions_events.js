var STRING_STATUS_NEW = 'new',
    STRING_STATUS_NEW_FRONT = 'New',
    STRING_STATUS_NEW_CLASS = 'status-new',
    STRING_STATUS_NEW_BUTTON = 'Reported',
    STRING_STATUS_OPEN = 'open',
    STRING_STATUS_OPEN_FRONT = 'Open',
    STRING_STATUS_OPEN_CLASS = 'status-open',
    STRING_STATUS_OPEN_BUTTON = 'Reported',
    STRING_STATUS_CLOSED = 'closed',
    STRING_STATUS_CLOSED_FRONT = 'Reported',
    STRING_STATUS_CLOSED_CLASS = 'status-closed',
    STRING_STATUS_CLOSED_BUTTON = 'N/A',
    STRING_STATUS_FALSE = 'benign',
    STRING_STATUS_FALSE_FRONT = 'No Action',
    STRING_STATUS_FALSE_CLASS = 'status-false',
    STRING_STATUS_FALSE_ACTION_CLASS = 'status-false-action',
    STRING_STATUS_FALSE_BUTTON = 'N/A',
    STRING_STATUS_FALSE_ACTION_BUTTON = 'No Action',
    statusClass = '',
    statusOrder = 0,
    statusText = '',
    urlHtml = '',
    actionButtonHtml =  '',
    STRING_ALERTS_MESSAGE = ' New or Open Keyword Alert',
    STRING_ALERTS_MESSAGE_PLURAL = ' New or Open Keyword Alerts';
    STRING_CLOSEALL_ERROR = 'There was a error with the request.'

function eventsTableController(apiString, table){
  globalDebug('   Events Get Data', 'color:purple;');

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
    apiObj.page = parseInt(data.page);
    apiObj.pageSize = parseInt(data.pageSize);
    apiObj.total = parseInt(data.total);
    apiObj.source = data.source;
    apiObj.success = data.success;
    apiObj.type = data.type;

    globalDebug('   Ajax SUCCESS!: '+apiString, 'color:green;');
  })
  .fail(function( data ) {
    globalDebug('   Ajax FAILED!: '+apiString, 'color:red;');
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
  globalDebug('   Events Setup Table Data', 'color:purple;');

  if(table != undefined && table[0]){
    var tableHTML = '',
        paginationHTML = '',
        page = apiObj.page,
        pageSize = apiObj.pageSize,
        total = apiObj.total;

    for (var i = 0; i < apiObj.data.length; i++){

      statusClass = '';
      actionText = '';
      statusText = '';
      statusOrder = 0;
      urlHtml = '';
      actionButtonHtml = '';

      var currentEvent,
          currentEvent_creation,
          currentEvent_creation_human,
          currentEvent_accessed,
          currentEvent_accessed_human,
          currentEvent_id_short;

      // Get the Current Event Data
      currentEvent = apiObj.data[i];

      // Shorten the ID
      if (currentEvent._id.length > 10) {
        currentEvent_id_short = currentEvent._id.slice(0,10);
        currentEvent_id_short += '...';
      } else {
        currentEvent_id_short = currentEvent._id;
      }


      // Creation Date
      currentEvent_creation = new Date(currentEvent.timestamp);
      currentEvent_creation = currentEvent_creation.getFullYear() + '/' + (currentEvent_creation.getMonth()+1 < 10 ? ('0'+(currentEvent_creation.getMonth()+1)) : currentEvent_creation.getMonth()+1 ) + '/' + (currentEvent_creation.getDate() < 10 ? ('0'+currentEvent_creation.getDate()) : currentEvent_creation.getDate() );

      // Creation Date in MM/DD/YYYY
      currentEvent_creation_human = new Date(currentEvent.timestamp);
      currentEvent_creation_human = (currentEvent_creation_human.getMonth()+1 < 10 ? ('0'+(currentEvent_creation_human.getMonth()+1)) : currentEvent_creation_human.getMonth()+1 )+ '/' + (currentEvent_creation_human.getDate() < 10 ? ('0'+currentEvent_creation_human.getDate()) : currentEvent_creation_human.getDate() ) + '/' + currentEvent_creation_human.getFullYear();


      if (currentEvent.alertStateUpdatedAt) {
        // Last Accessed Date
        currentEvent_accessed = new Date(currentEvent.alertStateUpdatedAt);
        currentEvent_accessed_human = (currentEvent_accessed.getMonth()+1 < 10 ? ('0'+(currentEvent_accessed.getMonth()+1)) : currentEvent_accessed.getMonth()+1 )+ '/' + (currentEvent_accessed.getDate() < 10 ? ('0'+currentEvent_accessed.getDate()) : currentEvent_accessed.getDate() ) + '/' + currentEvent_accessed.getFullYear();
        currentEvent_accessed = currentEvent_accessed.getFullYear() + '/' + (currentEvent_accessed.getMonth()+1 < 10 ? ('0'+(currentEvent_accessed.getMonth()+1)) : currentEvent_accessed.getMonth()+1 ) + '/' + (currentEvent_accessed.getDate() < 10 ? ('0'+currentEvent_accessed.getDate()) : currentEvent_accessed.getDate() );

        // Last Accessed Date in TimeAgo format

      } else {
        currentEvent_accessed = '';
        currentEvent_accessed_human = '';
      }


      // Delegates whether an event is new or open
      if (currentEvent.alertState == STRING_STATUS_NEW){

        statusText = STRING_STATUS_NEW_FRONT;
        statusClass = STRING_STATUS_NEW_CLASS;
        actionText = STRING_STATUS_NEW_BUTTON;
        statusOrder = 0;
        actionButtonHtml = '<button class="btn btn-default event-action-btn '+statusClass+'">'+actionText+'</button><button class="btn btn-default event-false-action-btn '+STRING_STATUS_FALSE_ACTION_CLASS+'">'+STRING_STATUS_FALSE_ACTION_BUTTON+'</button>';

      } else if (currentEvent.alertState == STRING_STATUS_OPEN){

        statusText = STRING_STATUS_OPEN_FRONT;
        statusClass = STRING_STATUS_OPEN_CLASS;
        actionText = STRING_STATUS_OPEN_BUTTON;
        statusOrder = 1;
        actionButtonHtml = '<button class="btn btn-default event-action-btn '+statusClass+'">'+actionText+'</button><button class="btn btn-default event-false-action-btn '+STRING_STATUS_FALSE_ACTION_CLASS+'">'+STRING_STATUS_FALSE_ACTION_BUTTON+'</button>';

      } else if (currentEvent.alertState == STRING_STATUS_CLOSED){

        statusText = STRING_STATUS_CLOSED_FRONT;
        statusClass = STRING_STATUS_CLOSED_CLASS;
        actionText = STRING_STATUS_CLOSED_BUTTON;
        statusOrder = 2;
        actionButtonHtml = '';//'<button class="btn btn-default event-action-btn '+statusClass+'">'+actionText+'</button><button class="btn btn-default event-false-action-btn '+STRING_STATUS_FALSE_ACTION_CLASS+'">'+STRING_STATUS_FALSE_ACTION_BUTTON+'</button>';

      } else if (currentEvent.alertState == STRING_STATUS_FALSE){

        statusText = STRING_STATUS_FALSE_FRONT;
        statusClass = STRING_STATUS_FALSE_CLASS;
        actionText = STRING_STATUS_FALSE_BUTTON;
        statusOrder = 3;
        actionButtonHtml = '';//'<button class="btn btn-default event-action-btn '+statusClass+'">'+actionText+'</button><button style="display:none;" class="btn btn-default event-false-action-btn '+STRING_STATUS_FALSE_ACTION_CLASS+'">'+STRING_STATUS_FALSE_ACTION_BUTTON+'</button>';

      }

      if (currentEvent.doc_type == 'direct_message') {
        urlHtml = '<a data-toggle="modal" data-events-url='+currentEvent.url+' data-events-has-modal="true" data-target="#eventsDirectMessageModal">View DM'
      } else {
        urlHtml = '<a target="_blank" href="'+currentEvent.url+'" title="'+currentEvent.sourceName+' Link">View Event'
      }

      // Create the table row with the given data
      tableHTML += '<tr data-status="'+statusText+'" data-type="'+currentEvent._type+'" data-id="'+currentEvent._id+'"" class="'+statusClass+'">';
      tableHTML += '<td class="event-item-status"><span class="event-item-robot">'+statusOrder+'</span>'+statusText+'</td>';
      tableHTML += '<td class="event-item-creation"><span class="event-item-robot">'+currentEvent_creation+'</span>'+currentEvent_creation_human+'</td>';
      tableHTML += '<td>'+currentEvent.sourceName+'</td>';
      tableHTML += '<td><span class="event-item-robot">'+currentEvent._id+'</span><span class="event-item-human" data-toggle="tooltip" data-trigger="click" data-placement="top" title='+currentEvent._id+'>'+currentEvent_id_short+'</span></td>';
      tableHTML += '<td class="event-item-accessed"><span class="event-item-robot">'+currentEvent_accessed+'</span><span class="event-item-human">'+currentEvent_accessed_human+'</span></td>';
      tableHTML += '<td class="event-item-action-buttons">'+actionButtonHtml+'</td>';
      tableHTML += '<td class="event-item-link event-link-cell">'+urlHtml+'<span class="entypo entypo-chevron-right"></span></td>';
      tableHTML += '</tr>';

    }

    table.find('tbody').append(tableHTML);
    tableHTML = '';

    paginationHTML = eventsTablePagination(page, pageSize, total);

    eventsTableDraw($('#events-table'), paginationHTML);

    compensateFooter();
    $('[data-toggle="tooltip"]').tooltip();

  }
}

function eventsTableDraw(table, paginationHTML){

  table.DataTable({
    "paging": false,
    "dom": 'rtp',
    //"order": [[ 0, 'asc' ]], //Orders them by Status. They should be preordered though by the backend, so no order should be needed.
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

  eventsTableUpdateController();
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

    var offset = 0,
        max = 0;

    if (extended){
      if (page > 4 && (page+3 < totalPages)) {
        offset = page-3;
        max = 7+offset;
      } else if (page+3 >= totalPages) {
        offset = totalPages - 6;
        max = 7+offset;
      } else {
        offset = 1;
        max = 7+offset;
      }
    } else {
      max = totalPages+1;
      offset = 1;
    }

    for (var i = offset; i < max; i++) {
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

function eventsTableUpdateController(){
  $('.event-action-btn, .event-false-action-btn, .event-item-link').on('click',function(){
    var clicked = $(this),
        row = clicked.parents('tr'),
        statusItem = row.find('.event-item-status'),
        accessedItem = row.find('.event-item-accessed'),
        eventID = row.data('id'),
        eventType = row.data('type'),
        eventStatus = row.data('status'),
        eventStatusButton = row.find('.event-action-btn'),
        eventFalseButton = row.find('.event-false-action-btn'),
        alertState,
        postObj = {};

    if (clicked.hasClass('event-item-link')){

      if (eventStatus == STRING_STATUS_NEW){

        postObj = {
          "docs": [
            {
              "_type": eventType,
              "_id": eventID
            }
          ],
          "alertState": "open"
        };

        eventsStatusUpdate(postObj, row, eventStatusButton, statusItem, accessedItem, true);

      }

    } else {

      if (clicked.hasClass(STRING_STATUS_NEW_CLASS)){
        alertState = STRING_STATUS_CLOSED;
      } else if (clicked.hasClass(STRING_STATUS_OPEN_CLASS)) {
        alertState = STRING_STATUS_CLOSED;
      } else if (clicked.hasClass(STRING_STATUS_CLOSED_CLASS)) {
        alertState = STRING_STATUS_OPEN;
      } else if (clicked.hasClass(STRING_STATUS_FALSE_CLASS)) {
        alertState = STRING_STATUS_OPEN;
      } else if (clicked.hasClass(STRING_STATUS_FALSE_ACTION_CLASS)) {
        alertState = STRING_STATUS_FALSE;
      }

      postObj = {
        "docs": [
          {
            "_type": eventType,
            "_id": eventID
          }
        ],
        "alertState": alertState
      };

      eventsStatusUpdate(postObj, row, clicked, statusItem, accessedItem);

    }



    globalDebug('   Events Call: ' + eventID + ' Updated', 'color:purple;');

  });

  $('#eventsCloseAll').on('click',function(){
    globalDebug('   Events Close All', 'color:purple;');
    var postObj = {
      "alertState": "closed",
      "all": true
    }
    eventsStatusUpdate(postObj);  });

}

function eventsStatusUpdate(postObj, row, clicked, statusItem, accessedItem, postClicked){
  var apiString = "/api/1.0/alerts/update";
  var success = false;

  $.post(apiString, postObj)
  .done(function(data) {
    globalDebug('   Ajax SUCCESS!: '+apiString, 'color:green;');

    if (data.success) {
      if (postObj.all){
        setTimeout(function(){
          location.reload();
        }, 500);
      } else {


        if (postClicked) {

          row
            .removeClass(STRING_STATUS_NEW_CLASS)
            .addClass(STRING_STATUS_OPEN_CLASS)
            .data('status') = STRING_STATUS_OPEN;
          clicked
            .removeClass(STRING_STATUS_NEW_CLASS)
            .addClass(STRING_STATUS_OPEN_CLASS);
          clicked
            .html(STRING_STATUS_OPEN_BUTTON);
          statusItem
            .html('<span class="event-item-robot">'+1+'</span>'+STRING_STATUS_OPEN.capitalizeFirstLetter());

        } else {

          if (clicked.hasClass(STRING_STATUS_NEW_CLASS)) {

            row
              .removeClass(STRING_STATUS_NEW_CLASS)
              .addClass(STRING_STATUS_CLOSED_CLASS)
              .data.status = STRING_STATUS_CLOSED;
            clicked
              .removeClass(STRING_STATUS_NEW_CLASS)
              .addClass(STRING_STATUS_CLOSED_CLASS);
            clicked
              .html(STRING_STATUS_CLOSED_BUTTON);
            statusItem
              .html('<span class="event-item-robot">'+2+'</span>'+STRING_STATUS_CLOSED.capitalizeFirstLetter());

          } else if (clicked.hasClass(STRING_STATUS_OPEN_CLASS)) {

            row
              .removeClass(STRING_STATUS_OPEN_CLASS)
              .addClass(STRING_STATUS_CLOSED_CLASS)
              .data.status = STRING_STATUS_CLOSED;
            clicked
              .removeClass(STRING_STATUS_OPEN_CLASS)
              .addClass(STRING_STATUS_CLOSED_CLASS);
            clicked
              .html(STRING_STATUS_CLOSED_BUTTON);
            statusItem
              .html('<span class="event-item-robot">'+2+'</span>'+STRING_STATUS_CLOSED.capitalizeFirstLetter());

          } else if (clicked.hasClass(STRING_STATUS_CLOSED_CLASS)) {

            row
              .removeClass(STRING_STATUS_CLOSED_CLASS)
              .addClass(STRING_STATUS_OPEN_CLASS)
              .data.status = STRING_STATUS_OPEN;
            clicked
              .removeClass(STRING_STATUS_CLOSED_CLASS)
              .addClass(STRING_STATUS_OPEN_CLASS);
            clicked
              .html(STRING_STATUS_OPEN_BUTTON);
            statusItem
              .html('<span class="event-item-robot">'+1+'</span>'+STRING_STATUS_OPEN.capitalizeFirstLetter());

          } else if (clicked.hasClass(STRING_STATUS_FALSE_CLASS)) {

            row
              .removeClass(STRING_STATUS_FALSE_CLASS)
              .addClass(STRING_STATUS_OPEN_CLASS)
              .data.status = STRING_STATUS_OPEN;
            clicked
              .removeClass(STRING_STATUS_FALSE_CLASS)
              .addClass(STRING_STATUS_OPEN_CLASS);
            clicked
              .html(STRING_STATUS_OPEN_BUTTON);
            statusItem
              .html('<span class="event-item-robot">'+1+'</span>'+STRING_STATUS_OPEN.capitalizeFirstLetter());
            clicked
              .next('.event-false-action-btn').show();

          } else if (clicked.hasClass(STRING_STATUS_FALSE_ACTION_CLASS)) {

            row
              .removeClass(STRING_STATUS_NEW_CLASS)
              .removeClass(STRING_STATUS_OPEN_CLASS)
              .removeClass(STRING_STATUS_CLOSED_CLASS)
              .addClass(STRING_STATUS_FALSE_CLASS)
              .data.status = STRING_STATUS_FALSE_FRONT;
            clicked
              .siblings('.event-action-btn')
              .removeClass(STRING_STATUS_NEW_CLASS)
              .removeClass(STRING_STATUS_OPEN_CLASS)
              .removeClass(STRING_STATUS_CLOSED_CLASS)
              .addClass(STRING_STATUS_FALSE_CLASS);
            clicked
              .siblings('.event-action-btn')
              .html(STRING_STATUS_FALSE_BUTTON);
            statusItem
              .html('<span class="event-item-robot">'+3+'</span>'+STRING_STATUS_FALSE_FRONT.capitalizeFirstLetter());
            clicked.hide();

          }

        }

        var the_table = $('#events-table').DataTable();
        the_table.draw();

        setTimeout(function(){
          eventsCheckStatus();
        },3000);


        var newTime = new Date();
        newTime = $.timeago(newTime);
        accessedItem.children('.event-item-human').html(newTime);

      }
    }
  })
  .fail(function( data ) {
    alert('There was an error with your request.');

    globalDebug('   Ajax FAILED!: '+apiString, 'color:red;');
  })
  .always(function( data ) {
    if (data.error){
      globalDebug('   Ajax SUCCESS, however POST returned an error: '+data.error, 'color:red;');
    }
  });

}


function eventsCheckStatus(){
  globalDebug('   Events Check Status', 'color:purple;');

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

  var count = 0;

  if (apiObj.success && $('.alerts-block')[0] && (apiObj.data.new || apiObj.data.open) ){

    globalDebug('   Events Delegation New:'+apiObj.data.new+' Open:'+apiObj.data.open, 'color:purple;');
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
    globalDebug('   Events Delegation: 0 Events', 'color:purple;');
    $('.event-alert').data('events-count', count);
    $('.event-alert').removeClass('active');
    $('.alerts-block').removeClass('active');
  }
}
