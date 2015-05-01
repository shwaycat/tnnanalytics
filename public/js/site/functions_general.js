function compensateFooter(){
	if($('.footer-container')[0]){
		var windowHeight = document.documentElement.clientHeight;
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

function globalDebug(message, css){
  if(globalDebugBool){
    if (css){
      console.log('%c '+message, css);
    } else {
      console.log(message);
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

$.fn.sectionLoad = function(reload){
  var el = this;
  if (reload){
    el.removeClass('loaded');
  }
  el.prev(loadingGifClass).remove();
  setTimeout(function(){
    el.addClass('loaded');
  },300);  
};


// Development fake data for line graphs.
function createFakeData(){
  var ourArray = [];
  var index = 50;
  for (var i = 0; i < index; i++){
    var year = 1971 + i;
    var day = 1971 + i;
    var date = new Date('2014', '03', i*15);
    date = date.toJSON();
    var count = Math.random()*1234234*i + 500;
    ourArray[i] = { "date": date, "count": count };
  }
  return ourArray;
}


// This is used to assimilate data lower than
// 5% in a donutGraph, removing it and replacing
// it with Other.
// function OLDsimplifyData(data){
//   var theData = data;
//   var tempData = [];

//   var totalValues = 0,
//       length = theData.length,
//       otherObj = { "label": "Other", "value": 0 };
//   for (var i = 0; i < theData.length; i++){
//     totalValues += theData[i].value;
//     tempData[i] = theData[i];
//   }
//   for (var i = 0; i < tempData.length; i++){
//     if (theData[i].value/totalValues < 0.5) {
//       theData.splice(i, 1);
//       otherObj.value += theData[i].value;
//       i--;
//       length--;
//     }
//   }
//   theData.push(otherObj);
//   return theData;
// }

function simplifyData(data){
  var theData = data;
  var newData = [];
  var totalValues = _.reduce(theData, function(memo, num){ return memo + num.value; }, 0),
      otherObj = { "label": "Other", "value": 0 };

  _.each(theData, function(datum){
    if (datum.value/totalValues < 0.06){
      otherObj.value += datum.value;
      console.log('  To Other:'+datum.label)
    } else {
      newData.push(datum);
    }
  });
  newData.push(otherObj);
  return newData;

}



// i.e. graphController('line', '/api/1.0/twitter/engagement', '2015-04-17T21:45:04.000Z', '2015-04-17T21:45:04.000Z', {selector: '#engagement'});
function dataController(type, apiString, startTime, endTime, options){
  if (!cachedData[type]){
    var queryString = apiString + (startTime ? '?startTime='+startTime : '') + (endTime ? '&endTime='+endTime : '');
    var apiObj = {
          success: true,
          source: false,
          type: false,
          data: false,
          startTime: false,
          endTime: false,
          options: options
        };
    var timeObj = {};
    if (startTime && endTime){
      apiObj.startTime = startTime;
      apiObj.endTime = endTime;
      timeObj = { startTime: startTime, endTime: endTime }
    }

    $.get(apiString, timeObj )
      .done(function( data ) {
        globalDebug('   Ajax SUCCESS!: '+apiString, 'color:green;');
        apiObj.source = data.source;
        apiObj.type = data.type;
        apiObj.data = data.data;
      })
      .fail(function( data ) {
        globalDebug('   Ajax FAILED!: '+apiString, 'color:red;');
        apiObj = false;
      })
      .always(function( data ) {
        cachedData[type] = apiObj;
        dataControllerDelegation(type, apiObj);
      });
    } else {
      dataCfontrollerDelegation(type, cachedData[type]);
    }
}

function dataControllerDelegation(type, apiObj){
  if (type == 'line'){
    apiObj.data = createFakeData();
    lineGraph(apiObj.data, apiObj.options);
    
  } else if (type == 'donut'){
    //apiObj.data = simplifyData(apiObj.data);
    var tempData = fakeTopCountryData;
    apiObj.data = simplifyData(tempData);
    donutGraph(apiObj.data, apiObj.options);

  } else if (type == 'topPost'){
    apiObj.data = fakeTopPost;
    topPost(apiObj.data, apiObj.options);

  } else if (type == 'topTweet'){
    topTweet(apiObj.data, apiObj.options);

  } else {
    globalDebug('   GraphController Error: Wrong type entered! Type: '+type+' is not a valid type!', 'color:red;');
    return;

  }
}
