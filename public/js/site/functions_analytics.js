function analyticsTableController(apiString, type, table, dateObj){
  if (!cachedData[type]){
    globalDebug('   Analytics Get Data', 'color:purple;');

    var	apiObj = {
          "data": [],
          "success": false
        };
    var timeObj = {};
    if (dateObj){
      apiObj.startTime = dateObj.startTime;
      apiObj.endTime = dateObj.endTime;
      timeObj = dateObj;
    }
    $.get(apiString, timeObj)
    .done(function( data ) {
      apiObj.data = data.data;
      apiObj.success = data.success;
      globalDebug(data);
      globalDebug('   Ajax SUCCESS!: '+apiString, 'color:green;');
    })
    .fail(function( data ) {
      globalDebug('   Ajax FAILED!: '+apiString, 'color:red;');

      table.before(dataErrorHTML);
      table.remove();
    })
    .always(function( data ) {
      cachedData[type] = apiObj;
      analyticsTableData(apiObj, table);

    });
  } else {
    analyticsTableData(cachedData[type], table);
  }
}

function analyticsTableData(apiObj, table){
  // Preload Checks
  if (!table[0]) return;
  if (!apiObj.data || !apiObj.data == undefined || !apiObj.data == null || !apiObj.success){
    $(table).before(dataErrorHTML);
    $(table).remove();
    return;
  } else if (apiObj.data && apiObj.data.length == 0){
    $(table).before(noDataHTML);
    $(table).remove();
    return;
  } else {
    $(table).before(loadingGifHTML);
  }

  if(table != undefined && table[0]){
    var tableHTML = '';

    for (var i = 0; i < apiObj.data.length; i++){

      var currentAnalytic,
          bounceRate = '';

      // Get the Current Analytic Data
      currentAnalytic = apiObj.data[i];

      bounceRate =  Math.round( (currentAnalytic.bounceRate*100) *100 )/100 + '%';

      // Create the table row with the given data
      tableHTML += '<tr>';
      tableHTML += '<td class="analytic-item-country"><span class="analytic-item-robot">'+currentAnalytic.label+'</span>'+currentAnalytic.label+'</td>';
      tableHTML += '<td class="analytic-item-sessions"><span class="analytic-item-robot">'+currentAnalytic.sessions+'</span>'+currentAnalytic.sessions+'</td>';
      tableHTML += '<td class="analytic-item-bounce-rate"><span class="analytic-item-robot">'+currentAnalytic.bounceRate+'</span>'+bounceRate+'</td>';
      tableHTML += '</tr>';

    }

    table.find('tbody').append(tableHTML);
    tableHTML = '';

    analyticsTableDraw($('#analytics-table'));

    compensateFooter();

  }
}

function analyticsTableDraw(table){

  table.DataTable({
    "paging": false,
    "dom": 'rtp',
    "order": [[ 1, 'desc' ]],
  });

  $('#analytics-table_wrapper').prev(loadingGifClass).remove();
  $('.analytics-container').sectionLoad(false);

}
