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
      apiObj.map = data.map;
      apiObj.success = data.success;
      globalDebug(data);
      globalDebug('   Ajax SUCCESS!: '+apiString, 'color:green;');

      cachedData[type] = apiObj;
      analyticsTableData(apiObj, table);

    })
    .fail(function( data ) {
      globalDebug('   Ajax FAILED!: '+apiString, 'color:red;');

      table.before(dataErrorHTML);
      table.remove();
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
          bounceRate = '',
          label = '';

      // Get the Current Analytic Data
      currentAnalytic = apiObj.data[i];

      bounceRate =  Math.round( (currentAnalytic.bounceRate*100) *100 )/100 + '%';

      label = apiObj.map[currentAnalytic.key];

      // Create the table row with the given data
      tableHTML += '<tr>';
      tableHTML += '<td class="analytic-item-country"><span class="analytic-item-robot">'+label+'</span>'+label+'</td>';
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
