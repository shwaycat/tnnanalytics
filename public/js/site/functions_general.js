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

function globalDebug(message){
  if(globalDebugBool){
    console.log(message);
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
  setTimeout(function(){
    el.addClass('loaded');
  },300);  
};
