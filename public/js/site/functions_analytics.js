function analyticsTableController(apiString, table, dateObj){
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

    globalDebug('   Ajax SUCCESS!: '+apiString, 'color:green;');
  })
  .fail(function( data ) {
    globalDebug('   Ajax FAILED!: '+apiString, 'color:red;');

    table.before(dataErrorHTML);
    table.remove();
  })
  .always(function( data ) {
    if (apiObj.success && apiObj.data.length){

      // apiObj.success = true;
      // apiObj.data = fakeAnalyticsTable;
      analyticsTableData(apiObj, table)

    }
  });
}

function analyticsTableData(apiObj, table){
  globalDebug('   Analytics Setup Table Data', 'color:purple;');

  if(table != undefined && table[0]){
    var tableHTML = '';

    for (var i = 0; i < apiObj.data.length; i++){

      var currentAnalytic;

      // Get the Current Analytic Data
      currentAnalytic = apiObj.data[i];

      // Create the table row with the given data
      tableHTML += '<tr>';
      tableHTML += '<td class="analytic-item-country"><span class="analytic-item-robot">'+currentAnalytic.label+'</span>'+currentAnalytic.label+'</td>';
      tableHTML += '<td class="analytic-item-sessions"><span class="analytic-item-robot">'+currentAnalytic.sessions+'</span>'+currentAnalytic.sessions+'</td>';
      tableHTML += '<td class="analytic-item-bounce-rate"><span class="analytic-item-robot">'+currentAnalytic.bounceRate+'</span>'+currentAnalytic.bounceRate+'</td>';
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

  $('.analytics-container').sectionLoad(false);

}
