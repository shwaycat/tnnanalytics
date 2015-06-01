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

    $('.main-container').removeAttr('style');
    $('.header-container').removeAttr('style');
    $('.footer-container').removeAttr('style');

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
  var countarray = [1151707, 1162369, 1169145, 1177156, 1187363, 1194867, 1203956, 1209300, 1197983, 1206968, 1214102, 1224658, 1232331, 1245532, 1251306, 1258431, 1263521, 1268405, 1271295];
  for (var i = 0; i < countarray.length; i++){
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
    var suffixNum = Math.floor( (""+value).length/4 );
    var shortValue = '';
    for (var precision = 2; precision >= 1; precision--) {
      shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value));//.toPrecision(precision));
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

function queryStringPage(){
  var query = window.location.search;
  if (query != '' && query != null && query != undefined && query){
    if (query.indexOf("?page=") != -1 && (query.split("?page=").length == 2)){
      return query;
    } else {
      return '';
    }
  } else {
    return '';
  }
}









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
  el.prev(noDataClass).remove();

  setTimeout(function(){
    el.addClass('loaded');
    if (eh){
      equalHeightPairs(1200);
    }
  },300);

};

function simplifyDataPercentsOnly(data){
  var theData = data;
  var newData = {
    "data": []
  };

  var totalValues = _.reduce(theData, function(memo, num){ return memo + num.value; }, 0);

  _.each(theData, function(datum, index){
    datum.percent = Math.round( (datum.value*100/totalValues) *100 )/100 + '%';
    datum.label = datum.key;
    newData.data.push(datum);

  });

  newData.data = _.sortBy(newData.data, 'value');
  newData.data.reverse();

  return newData;
}

function simplifyData(data, map){
  var theData = data;
  var newData = {
    "data": [],
    "data_list": []
  };

  var totalValues = _.reduce(theData, function(memo, num){ return memo + num.value; }, 0),
      otherObj = { "label": "Other", "value": 0, "percent": 0 };

  _.each(theData, function(datum, index){
    if (datum.value/totalValues < 0.09 && datum.value/totalValues > 0.01){
      otherObj.percent = Math.round( (otherObj.value*100/totalValues) *100 )/100 + '%';
      datum.percent = Math.round( (datum.value*100/totalValues) *100 )/100 + '%';

      otherObj.value += datum.value;

      if (datum.key == "US"){
        datum.label = "USA";
      } else if (datum.key == "UK") {
        datum.label = "UK";
      } else {
        datum.label = map[datum.key];
      }

      newData.data_list.push(datum);

    } else if (datum.value/totalValues > 0.01) {
      datum.percent = Math.round( (datum.value*100/totalValues) *100 )/100 + '%';

      if (datum.key == "US"){
        datum.label = "USA";
      } else if (datum.key == "UK") {
        datum.label = "UK";
      } else {
        datum.label = map[datum.key];
      }

      newData.data.push(datum);
      newData.data_list.push(datum);

    }
  });

  newData.data = _.sortBy(newData.data, 'value');
  newData.data.reverse();
  newData.data_list = _.sortBy(newData.data_list, 'value');
  newData.data_list.reverse();

  if (otherObj.value > 0){
    newData.data.push(otherObj);
    newData.data = _.sortBy(newData.data, 'value');
    newData.data.reverse();
  }

  var data_list_other = newData.data_list.slice(10);
  newData.data_list = newData.data_list.slice(0, 10);
  var data_list_other_count = _.reduce(data_list_other, function(memo, num){ return memo + num.value; }, 0);
  var data_list_count = _.reduce(newData.data_list, function(memo, num){ return memo + num.value; }, 0);
  var data_list_other_percent = Math.round( (data_list_other_count*100/(data_list_other_count+data_list_count)) *100 )/100 + '%';
  var data_list_other_object = { "label": "Additional Countries", "value": data_list_other_count, "percent": data_list_other_percent };
  if (data_list_other_object.value > 0){
    newData.data_list.push(data_list_other_object);
  }
  newData.data_list = _.sortBy(newData.data_list, 'value');
  newData.data_list.reverse();


  return newData;
}

function donutList(data, options, success){

  var theData = data;
  var newDetailsHTML = '';

  $(options.listSelector).remove();

  if (success) {

    if (theData.length) {

      newDetailsHTML += '<section class="novo-data-list"><h3 class="data-list-title">'+options.listTitle+'</h3><ul class="data-list">';

      for (var i = 0; i < theData.length; i++){
        newDetailsHTML += '<li><span>';
        newDetailsHTML += theData[i].label;
        newDetailsHTML += '</span><span>';
        newDetailsHTML += theData[i].percent;
        newDetailsHTML += '</span></li>';
      }

      newDetails += '</ul></section>';

    }
  }
}

function numberWithCommas(x) {
  return Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

function statsDelegation(summary, options){
  if (!summary || summary == undefined || summary == null){
    return;
  }

  var statsString = '',
      statsStringOpen,
      statsStringClose,
      statStringOpen,
      statStringMid,
      statStringClose,
      columnSize,
      statsElement = '',
      listClass = '';

  if (options.selector == '#overview'){
    statsElement = '.novo-overview-stats';
    listClass = 'novo-overview-stats';
    $(options.selector).find(statsElement).remove();
  } else {
    statsElement = '.novo-graph-stats';
    listClass = 'novo-graph-stats';
    $(options.selector).next(statsElement).remove();
  }

  columnSize = 'col-lg-6';

  statsStringOpen = '<ul class="'+listClass+'">';
  statStringOpen = '<li class="col-xs-12 '+columnSize+' col-md-6"><div class="stat"><span>';
  statStringMid = '</span><span>';
  statStringClose = '</span></li>';
  statsStringClose = '</ul>';

  statsString += statsStringOpen;

  if (options.source == 'twitter'){

    if (options.selector == '#engagement'){

      if (summary.totalFavorites != undefined) {
        statsString += statStringOpen;
        statsString += "Favorites"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalFavorites);
        statsString += statStringClose;
      }

      if (summary.totalRetweets != undefined) {
        statsString += statStringOpen;
        statsString += "Retweets"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalRetweets);
        statsString += statStringClose;
      }

      if (summary.totalMentions != undefined) {
        statsString += statStringOpen;
        statsString += "Mentions"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalMentions);
        statsString += statStringClose;
      }

      if (summary.totalReplies != undefined) {
        statsString += statStringOpen;
        statsString += "Replies"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalReplies);
        statsString += statStringClose;
      }

      if (summary.totalDirectMessages != undefined) {
        statsString += statStringOpen;
        statsString += "Direct Messages"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalDirectMessages);
        statsString += statStringClose;
      }

    } else if (options.selector == '#acquisition'){

      if (summary.totalFollowers != undefined) {
        statsString += statStringOpen;
        statsString += "Followers"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalFollowers);
        statsString += statStringClose;
      }

      if (summary.changeInFollowers != undefined) {
        statsString += statStringOpen;
        statsString += "Change in Followers"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.changeInFollowers);
        statsString += statStringClose;
      }

    }

  } else if (options.source == 'facebook'){

    if (options.selector == '#engagement'){

      if (summary.totalLikes != undefined) {
        statsString += statStringOpen;
        statsString += "Likes"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalLikes);
        statsString += statStringClose;
      }

      if (summary.totalShares != undefined) {
        statsString += statStringOpen;
        statsString += "Shares"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalShares);
        statsString += statStringClose;
      }

      if (summary.totalComments != undefined) {
        statsString += statStringOpen;
        statsString += "Comments"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalComments);
        statsString += statStringClose;
      }

      if (summary.totalMentions != undefined) {
        statsString += statStringOpen;
        statsString += "Mentions"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalMentions);
        statsString += statStringClose;
      }

      if (summary.totalMessages != undefined) {
        statsString += statStringOpen;
        statsString += "Messages"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalMessages);
        statsString += statStringClose;
      }

      if (summary.totalPosts != undefined) {
        statsString += statStringOpen;
        statsString += "Posts"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalPosts);
        statsString += statStringClose;
      }

    } else if (options.selector == '#acquisition'){

      if (summary.totalLikes != undefined) {
        statsString += statStringOpen;
        statsString += "Likes"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalLikes);
        statsString += statStringClose;
      }

      if (summary.changeInLikes != undefined) {
        statsString += statStringOpen;
        statsString += "Change in Likes"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.changeInLikes);
        statsString += statStringClose;
      }

    }

  } else if (options.source == 'instagram'){

    if (options.selector == '#engagement'){

      if (summary.totalLikes != undefined) {
        statsString += statStringOpen;
        statsString += "Likes"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalLikes);
        statsString += statStringClose;
      }

      if (summary.totalComments != undefined) {
        statsString += statStringOpen;
        statsString += "Comments"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalComments);
        statsString += statStringClose;
      }

    } else if (options.selector == '#acquisition'){

      if (summary.totalFollowers != undefined) {
        statsString += statStringOpen;
        statsString += "Followers"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalFollowers);
        statsString += statStringClose;
      }

      if (summary.changeInFollowers != undefined) {
        statsString += statStringOpen;
        statsString += "Change in Followers"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.changeInFollowers);
        statsString += statStringClose;
      }

    }

  } else if (options.source == 'youtube'){

    if (options.selector == '#engagement'){

      if (summary.totalLikes != undefined) {
        statsString += statStringOpen;
        statsString += "Likes"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalLikes);
        statsString += statStringClose;
      }

      if (summary.totalShares != undefined) {
        statsString += statStringOpen;
        statsString += "Shares"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalShares);
        statsString += statStringClose;
      }

      if (summary.totalPosts != undefined) {
        statsString += statStringOpen;
        statsString += "Replies"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalReplies);
        statsString += statStringClose;
      }

      if (summary.totalMentions != undefined) {
        statsString += statStringOpen;
        statsString += "Mentions"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalMentions);
        statsString += statStringClose;
      }

      if (summary.totalComments != undefined) {
        statsString += statStringOpen;
        statsString += "Comments"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalComments);
        statsString += statStringClose;
      }

      if (summary.totalMessages != undefined) {
        statsString += statStringOpen;
        statsString += "Views"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalViews);
        statsString += statStringClose;
      }



    } else if (options.selector == '#acquisition'){

      if (summary.totalLikes != undefined) {
        statsString += statStringOpen;
        statsString += "Subscribers"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalSubscribers);
        statsString += statStringClose;
      }

      if (summary.changeInLikes != undefined) {
        statsString += statStringOpen;
        statsString += "Change in Subscribers"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.changeInSubscribers);
        statsString += statStringClose;
      }

    }

  } else if (options.source == 'google'){

    if (options.selector == '#engagement'){

      if (summary.totalLikes != undefined) {
        statsString += statStringOpen;
        statsString += "Plus 1's"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalLikes);
        statsString += statStringClose;
      }

      if (summary.totalComments != undefined) {
        statsString += statStringOpen;
        statsString += "Comments"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalComments);
        statsString += statStringClose;
      }

      if (summary.totalShares != undefined) {
        statsString += statStringOpen;
        statsString += "Shares"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalShares);
        statsString += statStringClose;
      }

    } else if (options.selector == '#acquisition'){

      if (summary.totalLikes != undefined) {
        statsString += statStringOpen;
        statsString += "Added to Circles"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.totalCircles);
        statsString += statStringClose;
      }

      if (summary.changeInLikes != undefined) {
        statsString += statStringOpen;
        statsString += "Change in Circle Additions"
        statsString += statStringMid;
        statsString += numberWithCommas(summary.changeInSubscribers);
        statsString += statStringClose;
      }

    }

  } else if (options.source == 'analyticsGlobal' || options.source == 'analyticsAll' || options.source == 'analyticsUs') {

    if (summary.totalSessions != undefined) {
      statsString += statStringOpen;
      statsString += "Sessions"
      statsString += statStringMid;
      statsString += numberWithCommas(summary.totalSessions);
      statsString += statStringClose;
    }

    if (summary.totalBounceRate != undefined) {
      statsString += statStringOpen;
      statsString += "Bounce Rate"
      statsString += statStringMid;
      statsString += numberWithCommas(summary.totalBounceRate);
      statsString += statStringClose;
    }

    if (summary.totalPageViews != undefined) {
      statsString += statStringOpen;
      statsString += "Page Views"
      statsString += statStringMid;
      statsString += numberWithCommas(summary.totalPageViews);
      statsString += statStringClose;
    }

    if (summary.totalUsers != undefined) {
      statsString += statStringOpen;
      statsString += "Unique Users"
      statsString += statStringMid;
      statsString += numberWithCommas(summary.totalUsers);
      statsString += statStringClose;
    }

    if (summary.totalAverageSessionDuration != undefined) {
      statsString += statStringOpen;
      statsString += "Session Duration"
      statsString += statStringMid;
      statsString += numberWithCommas(summary.totalAverageSessionDuration);
      statsString += statStringClose;
    }

  }

  statsString += statsStringClose;

  if (options.selector == '#overview'){
    $(options.selector).append(statsString);
    $(options.selector).find(statsElement).sectionLoad(false);
  } else {
    $(options.selector).after(statsString);
    $(options.selector).next(statsElement).sectionLoad(false);
  }

}

// i.e. graphController('line', '/api/1.0/twitter/engagement', {startTime: '2015-04-17T21:45:04.000Z', endTime:'2015-04-17T21:45:04.000Z'}, {selector: '#engagement'});
function dataController(sectionType, type, apiString, dateObj, options){
  if (!cachedData[type]){
    var queryString = apiString + '?startTime='+dateObj.startTime + '&endTime='+dateObj.endTime;
    var apiObj = {
          success: false,
          source: false,
          type: false,
          data: false,
          oembed: false,
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
    if (type == 'topTweet' || type == 'topPost'){
      $(options.selector).before(loadingGifHTML);
    }
    $.get(apiString, timeObj)
      .done(function( data ) {
        globalDebug('   Ajax SUCCESS!: '+apiString, 'color:green;');
        apiObj.success = data.success;
        apiObj.error = data.error;
        apiObj.source = data.source;
        apiObj.type = data.type;
        apiObj.data = data.data;
        apiObj.map = data.map;
        apiObj.oembed = data.oembed;
        apiObj.summary = data.summary;
        globalDebug(data);
      })
      .fail(function( data ) {
        globalDebug('   Ajax FAILED!: '+apiString, 'color:red;');
      })
      .always(function( data ) {

        if (type == 'topCountries'){
          apiObj.data = simplifyData(apiObj.data, apiObj.map);
          cachedData[type] = apiObj;
        } else if (type == 'topTweet'){
          $(options.selector).prev(loadingGifClass).remove();
          cachedData[type] = apiObj;
        } else if (type == 'refTraffic'){
          apiObj.data = simplifyDataPercentsOnly(apiObj.data);
          cachedData[type] = apiObj;

        } else {
          cachedData[type] = apiObj;
        }
        dataControllerDelegation(sectionType, type, apiObj);
      });
  } else {
    dataControllerDelegation(sectionType, type, cachedData[type]);
  }
}

function dataControllerDelegation(sectionType, type, apiObj){
  if (sectionType == 'line'){
    lineGraph(apiObj.data, apiObj.options, apiObj.success);
    statsDelegation(apiObj.summary, apiObj.options, apiObj.success);

  } else if (sectionType == 'donut'){
    if (type == 'topCountries'){
      donutList(apiObj.data.data_list, apiObj.options, apiObj.success);
    }
    donutGraph(apiObj.data.data, apiObj.options, apiObj.success);

  } else if (sectionType == 'stats'){
    statsDelegation(apiObj.summary, apiObj.options, apiObj.success);

  } else if (sectionType == 'topFacebookPost'){
    topFacebookPost(apiObj.data, apiObj.options, apiObj.success);

  } else if (sectionType == 'topTweet'){
    topTweet(apiObj, apiObj.options, apiObj.success);

  } else if (sectionType == 'topInstagramPost'){
    topInstagramPost(apiObj, apiObj.options, apiObj.success);

  } else if (sectionType == 'topGooglePost'){
    topGooglePost(apiObj, apiObj.options, apiObj.success);

  } else if (sectionType == 'topYoutubeVideo'){
    topYoutubeVideo(apiObj, apiObj.options, apiObj.success);

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
  now.setHours(23,59,59);
  now = now.toJSON();


  today = new Date();
  today.setHours(0,0,0);
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
        if ($(this).parent().attr('id') == 'dateCalendarEnd'){
          dateObj.setHours(23,59,59);
        }
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
