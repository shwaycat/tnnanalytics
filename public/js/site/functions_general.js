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

function equalHeightPairs(){
  $('.equal-height-block-1').each(function(){
    var left = $(this);
    var leftChild = left.find('.inner-content');
    var right = left.next('.equal-height-block-2');
    var rightChild = right.find('.inner-content');
    var control, controlHeight, varied, variedHeight;

    leftChild.removeAttr('style');
    rightChild.removeAttr('style');

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
  })
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

$.fn.sectionLoad = function(reload, eh){
  var el = this;
  if (reload){
    el.removeClass('loaded');
  }
  el.prev(loadingGifClass).remove();
  
  setTimeout(function(){
    el.addClass('loaded');
    if (eh){
      equalHeightPairs();
    }
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
    ourArray[i] = { "key": date, "value": count };
  }
  return ourArray;
}


function simplifyData(data){
  var theData = data;
  var newData = [];
  var totalValues = _.reduce(theData, function(memo, num){ return memo + num.value; }, 0),
      otherObj = { "label": "Other", "value": 0, "percent": 0 };

  _.each(theData, function(datum){
    if (datum.value/totalValues < 0.06){
      otherObj.value += datum.value;
      otherObj.percent = Math.round( (otherObj.value*100/totalValues) *100 )/100 + '%';
    } else {
      datum.percent = Math.round( (datum.value*100/totalValues) *100 )/100 + '%';
      newData.push(datum);
    }
  });
  newData.push(otherObj);

  return newData;

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

  var theSummary = summary,
      statsString = '',
      statsStringOpen,
      statsStringClose,
      statStringOpen,
      statStringMid,
      statStringClose,
      columnSize;

  if (theSummary.length == 1){
    columnSize = 12;
  }
  if (theSummary.length == 2){
    columnSize = 6;
  }
  if (theSummary.length == 3){
    columnSize = 4;
  }
  if (theSummary.length == 4){
    columnSize = 3;
  }
  if (theSummary.length == 5){
    columnSize = 15;
  }
  if (theSummary.length == 6){
    columnSize = 2;
  } else {
    columnSize = 1;
  }

  statsStringOpen = '<ul class="novo-graph-stats">';
  statStringOpen = '<li class="col-xs-12 col-md-'+columnSize+'"><div class="stat"><span>';
  statStringMid = '</span><span>';
  statStringClose = '</span></li>';
  statsStringClose = '</ul>';

  statsString += statsStringOpen;

  // for (var i = 0; i < theSummary.length; i++){
  //   statsString += statStringOpen;

  //   statsString += statStringMid;

  //   statsString += statStringClose;
  // }

  statsString += statsStringClose;

  $(options.selector).after(statsString);
}

// i.e. graphController('line', '/api/1.0/twitter/engagement', '2015-04-17T21:45:04.000Z', '2015-04-17T21:45:04.000Z', {selector: '#engagement'});
function dataController(sectionType, type, apiString, startTime, endTime, options){
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
        dataControllerDelegation(sectionType, apiObj);
      });
  } else {
    dataControllerDelegation(sectionType, cachedData[type]);
  }
}

function dataControllerDelegation(sectionType, apiObj){
  if (sectionType == 'line'){
    apiObj.data = createFakeData();
    lineGraph(apiObj.data, apiObj.options);
    
  } else if (sectionType == 'donut'){
    //apiObj.data = simplifyData(apiObj.data);
    var tempData = fakeTopCountryData;
    apiObj.data = simplifyData(tempData);
    donutGraph(apiObj.data, apiObj.options);

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
