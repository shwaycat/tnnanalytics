//////////////////////////////////////////////
//// Front End Functions
//// - Used for altering css and styles.
//////////////////////////////////////////////

function browserVersion() {
    var ua = window.navigator.userAgent;
    if (ua.indexOf("Trident/7.0") > 0)
        return 11; //IE
    else if (ua.indexOf("Trident/6.0") > 0)
        return 10; //IE
    else if (ua.indexOf("Trident/5.0") > 0)
        return 9; //IE
    else if (ua.indexOf("Firefox/34") > 0){
      return 50; //Firefox 34
    } else if (ua.indexOf("Firefox/3") > 0){
      return 51; //Firefox Any
    } else if (ua.indexOf("Safari") > 0 && ua.indexOf("Chrome") == -1){
      return 70;
    } else {
      return 0;  //None
    }
}

function attachBrowserVersion(){
  var version = browserVersion();
  $('html').addClass('browser-'+browserVersion());
} 

function compensateFooter(){
  if($('.footer-container')[0]){
    var windowHeight = window.innerHeight;
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

function elementReveal(){
  $('.element-reveal-link').on('click',function(e){
    var clicked = $(this),
        els = $('.element-reveal'),
        show = clicked.data('element-reveal-show'),
        hide = clicked.data('element-reveal-hide');

    els.filter('[data-element-reveal-id="'+show+'"]').addClass('active');
    els.filter('[data-element-reveal-id="'+hide+'"]').removeClass('active');
  });
}

function equalHeightPairs(breakpoint){
  $('.equal-height-block-1').each(function(){
    var left = $(this);
    var leftChild = left.find('.inner-content');
    var right = left.next('.equal-height-block-2');
    var rightChild = right.find('.inner-content');
    var control, controlHeight, varied, variedHeight;

    leftChild.removeAttr('style');
    rightChild.removeAttr('style');

    var windowWidth = window.innerWidth;
    if(windowWidth >= breakpoint){
      var leftHeight = parseInt(leftChild.css('height'));
      var rightHeight = parseInt(rightChild.css('height'));

      if (left[0] && right[0]){
        
        if (leftHeight > rightHeight){
          control = left;
          controlHeight = leftHeight;
          varied = right;
          variedHeight = rightHeight

          varied.find('.inner-content').css('height', controlHeight);
        } else if (leftHeight < rightHeight) {
          control = right;
          controlHeight = rightHeight;
          varied = left;
          variedHeight = leftHeight;

          varied.find('.inner-content').css('height', controlHeight);
        }
      }
    }
  });
}








//////////////////////////////////////////////
//// Development Functions
//////////////////////////////////////////////

function globalDebug(message, css){
  if(globalDebugBool){
    if (css){
      console.log('%c '+message, css);
    } else {
      console.log(message);
    }
    
  }
}

function createFakeData(){
  var ourArray = [];
  var index = 50;
  for (var i = 0; i < index; i++){
    var year = 1971 + i;
    var day = 1971 + i;
    var date = new Date('2014', '03', i*15);
    date = date.toJSON();
    var count = Math.random()*1234234*i + 500;
    ourArray[i] = { "key": date, "value": count };
  }
  return ourArray;
}








//////////////////////////////////////////////
//// Data Functions
//// - Helpers and functions for adjusting
////   data.
//////////////////////////////////////////////

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

function saturationControl(hex, opacity, saturationMultiplier){
  var rgb = [],
      fail = false,
      color;
  hex = hex.split('#')[1];
  if (hex.length == 3){
    hex = hex + hex;
  }
  for (var i = 0; i < 6; i+=2) {
     rgb.push(parseInt(saturationMultiplier*parseInt(hex.substr(i,2),16)));
     fail = fail || rgb[rgb.length - 1].toString() === 'NaN';
  }
  return 'rgba('+rgb.join(',') + ','+opacity+')';
}

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

$.fn.serializeObject = function()
{
  var o = {};
  var a = this.serializeArray();
  $.each(a, function() {
    if (o[this.name]) {
      if (!o[this.name].push) {
        o[this.name] = [o[this.name]];
      }
      o[this.name].push(this.value || '');
    } else {
      o[this.name] = this.value || '';
    }
  });
  return o;
};









//////////////////////////////////////////////
//// Graph/Section Helper Functions
//// - Helpers and functions to support D3
////   graphs, and other social sections.
//////////////////////////////////////////////

$.fn.sectionLoad = function(reload, eh){
  var el = this;
  if (reload){
    el.removeClass('loaded');
  }
  el.prev(loadingGifClass).remove();
  
  setTimeout(function(){
    el.addClass('loaded');
    if (eh){
      equalHeightPairs(1200);
    }
  },300);

};

function simplifyData(data){
  var theData = data;
  var newData = {
    "data": [],
    "data_all": [],
    "data_other": []
  };
  newData
  var totalValues = _.reduce(theData, function(memo, num){ return memo + num.value; }, 0),
      otherObj = { "label": "Other", "value": 0, "percent": 0 };

  _.each(theData, function(datum){
    if (datum.value/totalValues < 0.08 && datum.value/totalValues > 0.01){
      otherObj.value += datum.value;
      otherObj.percent = Math.round( (otherObj.value*100/totalValues) *100 )/100 + '%';
      datum.percent = Math.round( (datum.value*100/totalValues) *100 )/100 + '%';
      newData.data_all.push(datum);
      newData.data_other.push(datum);
    } else {
      datum.percent = Math.round( (datum.value*100/totalValues) *100 )/100 + '%';
      newData.data_all.push(datum);
      newData.data.push(datum);
    }
  });
  if (otherObj.value > 0){
    newData.data.push(otherObj);
  }

  return newData;
}

function donutList(data, options, hidden){
  var theData = data;
  var post;
  var newDetailsHTML = '';

  if (hidden){
    //Used for displaying all data in print.
    post = $(options.selector).siblings('.novo-data-list-print');
  } else {
    post = $(options.selector).siblings('.novo-data-list-normal');
  }

  if (theData.length) {
    for (var i = 0; i < theData.length; i++){
      newDetailsHTML += '<li><span>';
      newDetailsHTML += theData[i].label;
      newDetailsHTML += '</span><span>';
      newDetailsHTML += theData[i].percent;
      newDetailsHTML += '</span></li>';
    }

    post.find('.data-list')
      .children().remove();
    post.find('.data-list')
      .append(newDetailsHTML);
  } else {
    post.remove();
  }

  
}

function donutPercents(){
  $('[data-label]').on('click, mouseover', function(){
    var label = $(this).data('label');
    $('.novo-donut-graph g')
      .children()
      .filter('[data-label="'+label+'"]')
      .attr('class','active')
      .siblings()
      .removeAttr('class', 'active');
  });
}
var asdf = 0;
function statsDelegation(summary, options){
  if (!summary || summary == undefined || summary == null){
    return;
  }

  $(options.selector).next('.novo-graph-stats').remove();

  

  var statsString = '',
      statsStringOpen,
      statsStringClose,
      statStringOpen,
      statStringMid,
      statStringClose,
      columnSize;

  if(options.source == 'twitter'){
    if(options.selector == '#engagement'){
      columnSize = 'col-lg-6';
    } else if (options.selector == '#acquisition'){
      columnSize = 'col-lg-offset-6 col-lg-6';
    }
  } else if(options.source == 'facebook'){
    if(options.selector == '#engagement'){
      columnSize = 'col-lg-6';
    } else if (options.selector == '#acquisition'){
      columnSize = 'col-lg-6';
    } else if (options.selector == '#reach'){
      columnSize = 'col-lg-6';
    }
  }

  statsStringOpen = '<ul class="novo-graph-stats">';
  statStringOpen = '<li class="col-xs-12 '+columnSize+' col-md-6"><div class="stat"><span>';
  statStringMid = '</span><span>';
  statStringClose = '</span></li>';
  statsStringClose = '</ul>';

  statsString += statsStringOpen;

  if (options.source == 'twitter'){

    if (options.selector == '#engagement'){

      statsString += statStringOpen;
      statsString += "Favorites"
      statsString += statStringMid;
      statsString += summary.totalFavorites
      statsString += statStringClose;

      statsString += statStringOpen;
      statsString += "Retweets"
      statsString += statStringMid;
      statsString += summary.totalRetweets
      statsString += statStringClose;

      statsString += statStringOpen;
      statsString += "Mentions"
      statsString += statStringMid;
      statsString += summary.totalMentions
      statsString += statStringClose;

      statsString += statStringOpen;
      statsString += "Replies"
      statsString += statStringMid;
      statsString += summary.totalReplies
      statsString += statStringClose;

      statsString += statStringOpen;
      statsString += "Direct Messages"
      statsString += statStringMid;
      statsString += summary.totalDirectMentions
      statsString += statStringClose;

    } else if (options.selector == '#acquisition'){

      statsString += statStringOpen;
      statsString += "Followers"
      statsString += statStringMid;
      statsString += summary.totalFollowers
      statsString += statStringClose;

    }
    
  } else if (options.source == 'facebook'){
    
    if (options.selector == '#engagement'){

      // statsString += statStringOpen;
      // statsString += summary.totalFavorites
      // statsString += statStringMid;
      // statsString += "Favorites"
      // statsString += statStringClose;

      // statsString += statStringOpen;
      // statsString += summary.totalRetweets
      // statsString += statStringMid;
      // statsString += "Retweets"
      // statsString += statStringClose;

      // statsString += statStringOpen;
      // statsString += summary.totalMentions
      // statsString += statStringMid;
      // statsString += "Mentions"
      // statsString += statStringClose;

      // statsString += statStringOpen;
      // statsString += summary.totalReplies
      // statsString += statStringMid;
      // statsString += "Replies"
      // statsString += statStringClose;

      // statsString += statStringOpen;
      // statsString += summary.totalDirectMentions
      // statsString += statStringMid;
      // statsString += "Direct Mentions"
      // statsString += statStringClose;

    } else if (options.selector == '#acquisition'){

      // statsString += statStringOpen;
      // statsString += summary.totalFollowers
      // statsString += statStringMid;
      // statsString += "Followers"
      // statsString += statStringClose;

    } else if (options.selector == '#reach'){

      // statsString += statStringOpen;
      // statsString += summary.totalFollowers
      // statsString += statStringMid;
      // statsString += "Followers"
      // statsString += statStringClose;

    }

  }

  statsString += statsStringClose;


  $(options.selector).after(statsString);
  $(options.selector).next('.novo-graph-stats').sectionLoad(false);
}

// i.e. graphController('line', '/api/1.0/twitter/engagement', {startTime: '2015-04-17T21:45:04.000Z', endTime:'2015-04-17T21:45:04.000Z'}, {selector: '#engagement'});
function dataController(sectionType, type, apiString, dateObj, options){
  if (!cachedData[type]){
    var queryString = apiString + '?startTime='+dateObj.startTime + '&endTime='+dateObj.endTime;
    var apiObj = {
          success: true,
          source: false,
          type: false,
          data: false,
          summary: false,
          startTime: false,
          endTime: false,
          options: options
        };
    var timeObj = {};
    if (dateObj){
      apiObj.startTime = dateObj.startTime;
      apiObj.endTime = dateObj.endTime;
      timeObj = dateObj;
    }

    $.get(apiString, timeObj )
      .done(function( data ) {
        globalDebug('   Ajax SUCCESS!: '+apiString, 'color:green;');
        apiObj.source = data.source;
        apiObj.type = data.type;
        apiObj.data = data.data;
        apiObj.summary = data.summary;
      })
      .fail(function( data ) {
        globalDebug('   Ajax FAILED!: '+apiString, 'color:red;');
        apiObj = false;
      })
      .always(function( data ) {
        if (type == 'topCountries'){
          //apiObj.data = simplifyData(apiObj.data);
          apiObj.data = simplifyData(fakeTopCountryData);
          cachedData[type] = apiObj;
        } else {
          cachedData[type] = apiObj;
        }

        dataControllerDelegation(sectionType, apiObj);
      });
  } else {
    dataControllerDelegation(sectionType, cachedData[type]);
  }
}

function dataControllerDelegation(sectionType, apiObj){
  if (sectionType == 'line'){
    lineGraph(apiObj.data, apiObj.options);
    statsDelegation(apiObj.summary, apiObj.options);
    
  } else if (sectionType == 'donut'){
    donutList(apiObj.data.data_all, apiObj.options, true);
    donutList(apiObj.data.data_other, apiObj.options);
    donutGraph(apiObj.data.data, apiObj.options);

  } else if (sectionType == 'topPost'){
    apiObj.data = fakeTopPost;
    topPost(apiObj.data, apiObj.options);

  } else if (sectionType == 'topTweet'){
    apiObj.data = fakeTopTweet;
    topTweet(apiObj.data, apiObj.options);

  } else {
    globalDebug('   GraphController Error: Wrong sectionType entered! Type: '+sectionType+' is not a valid sectionType!', 'color:red;');
    return;

  }
}








//////////////////////////////////////////////
//// Date Functions
//// - Functions related to date selection,
////   and cookies.
//////////////////////////////////////////////

Date.prototype.monthNames = [
  "January", "February", "March",
  "April", "May", "June",
  "July", "August", "September",
  "October", "November", "December"
];

Date.prototype.getMonthName = function() {
  return this.monthNames[this.getMonth()];
};
Date.prototype.getShortMonthName = function () {
  return this.getMonthName().substr(0, 3);
};

function dateCookie(){

  // Cookie Use
  // $.cookie(cookieName, default_date, { expires: cookieExp, path: cookiePath });
  // $.cookie('novo_date', '{"startTime": "", "endTime": ""}', { expires: 1, path: '/' });

  // Set Start Date to a month ago.
  var startTime = new Date();
  startTime.setMonth(startTime.getMonth() - 1);
  startTime = startTime.toJSON();

  // Set End Date to now.
  var endTime = new Date();
  endTime = endTime.toJSON();

  var default_date = {
    "startTime": startTime,
    "endTime": endTime
  };
  default_date = JSON.stringify(default_date);
  var dateObj = false;

  // Create or get the cookie.
  if ($.cookie(cookieName) != undefined){
    dateObj = JSON.parse($.cookie(cookieName));
    globalDebug('   Cookie Exists', 'color:brown;');
  } else {
    $.cookie(cookieName, default_date, { expires: cookieExp, path: cookiePath });
    dateObj = JSON.parse($.cookie(cookieName));
    globalDebug('   Cookie Created', 'color:brown;');
  }

  return dateObj;

}

function dateClearIt(){
  if ($.cookie(cookieName) != undefined){
    $.removeCookie(cookieName, { path: cookiePath });
    return 'Date Cookie Cleared!';
  } else {
    return 'No Cookie To Clear!';
  }
}

$.fn.dateDelegate = function(startTime, endTime){
  var el = this;
  var date = {
    "startTime": startTime,
    "endTime": endTime
  };
  date = JSON.stringify(date);
  el.data().dateTime = date; 
};

function dateController(){

  var dateObj = currentSelectedDate,
      now,
      today,
      yesterday,
      lastWeek,
      lastMonth,
      startTime,
      endTime,
      startTime_human = '',
      endTime_human = '';

  startTime = new Date(dateObj.startTime);
  endTime = new Date(dateObj.endTime);

  startTime_human += startTime.getMonthName();
  startTime_human += ' ';
  startTime_human += startTime.getDate();
  startTime_human += ', ';
  startTime_human += startTime.getFullYear();

  endTime_human += endTime.getMonthName();
  endTime_human += ' ';
  endTime_human += endTime.getDate();
  endTime_human += ', ';
  endTime_human += endTime.getFullYear();

  now = new Date();
  now.setMinutes(0,0,0);
  now.setHours(now.getHours() - 1);
  now = now.toJSON();

  today = new Date();
  today.setHours(0,0,0,0);
  today = today.toJSON();

  yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0,0,0,0);
  yesterday = yesterday.toJSON();

  lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  lastWeek.setHours(0,0,0,0);
  lastWeek = lastWeek.toJSON();

  lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  lastMonth.setHours(0,0,0,0);
  lastMonth = lastMonth.toJSON();

  $('[data-date-selector="today"]').dateDelegate(today, now);
  $('[data-date-selector="yesterday"]').dateDelegate(yesterday, now);
  $('[data-date-selector="lastWeek"]').dateDelegate(lastWeek, now);
  $('[data-date-selector="lastMonth"]').dateDelegate(lastMonth, now);

  $('#dateDropdown').find('span').first().html(startTime_human);
  $('#dateDropdown').find('span').last().html(endTime_human);

  $('[data-date-selection="startTime"]').html(startTime_human);
  $('[data-date-selection="endTime"]').html(endTime_human);

  dateActions();
  dateCalendar(['dateCalendarStart', 'dateCalendarEnd'], dateObj);

}

function dateActions(custom){

  $('.date-selector').on('click',function(e){
    var clicked = $(this);
    var dateObj = clicked.data().dateTime;
    $.cookie(cookieName, dateObj, { expires: cookieExp, path: cookiePath });
    setTimeout(function(){
      location.reload();
    },100);
  });

  $('#dateCustomSubmit').on('click',function(e){

    var clicked = $(this);
    var startTime = $('[data-date-selection="dateCalendarStart"]').data().dateTime;
    var endTime = $('[data-date-selection="dateCalendarEnd"]').data().dateTime;
    var dateObj = { "startTime": startTime, "endTime": endTime };

    if (startTime != undefined && endTime != undefined){
      var startTimeDate = new Date(startTime);
      var endTimeDate = new Date(endTime);

      if (startTimeDate < endTimeDate){
        dateObj = JSON.stringify(dateObj);
        $.cookie(cookieName, dateObj, { expires: cookieExp, path: cookiePath });
        setTimeout(function(){
          location.reload();
        },100);
      } else {
        $('.datepickerContainer').addClass('datepickerWarning');
        $('[data-date-selection="mismatch"]').addClass('active');
      }
    } else {
      $('.datepickerContainer').addClass('datepickerWarning');
      $('[data-date-selection="missingdate"]').addClass('active');
    }
  });

}

function dateCalendar(selectorArray, dateObj){
  var current = new Date();
  for (var i = 0; i < selectorArray.length; i++){
    $('#'+selectorArray[i]).DatePicker({
      flat: true,
      format: 'B d, Y',
      date: [dateObj.startTime,dateObj.endTime],
      current: current,
      calendars: 1,
      starts: 1,
      onChange: function(formatted, dateObj){
        $('.datepickerContainer').removeClass('datepickerWarning');
        $('[data-date-selection="missingdate"]').removeClass('active');
        $('[data-date-selection="mismatch"]').removeClass('active');
        var selector = $(this).parent().attr('id');
        if (dateObj == 'Invalid Date'){
          globalDebug('   Invalid Date', 'color:red;');
        } else {
          $('[data-date-selection="'+selector+'"]').html(formatted).addClass('selected');
          $('[data-date-selection="'+selector+'"]').data().dateTime = dateObj.toJSON();
        }        
      }
    });
  }
}


//////////////////////////////////////////////
//// Validations
//////////////////////////////////////////////
function showErrors() {
  var warning = $('.alert-warning').text().trim();

  if(warning == 'password') {
    $('#change-passwordNew').parent().addClass('error');
    $('#change-passwordConfirm').parent().addClass('error');
    $('.element-reveal-link').click();
  } else if (warning == 'details') {
    $('#firstName').parent().addClass('error');
    $('#lastName').parent().addClass('error');
  } else {
    $('.form-group').addClass('error');    
  }

  $('.alert-warning').hide();
}






