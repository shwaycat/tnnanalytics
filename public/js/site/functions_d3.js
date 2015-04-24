// Front End Routes

// This is where you would add certain graphs to certain pages and init them.

function routesInit(){
	if ($('body.dashboard')[0]){
		console.log('    routesInit: dashboard');

		
	}
	if ($('body.facebook')[0]){
		console.log('    routesInit: facebook');

		donutGraph(GLOBAL_API_DATA.fakedata4,{
			selector: '#top_countries',
			source: 'facebook',
			color: '',
		});

		reachGraph(GLOBAL_API_DATA.fakedata3,{
			selector: '#reach',
			source: 'facebook',
			color: '',
		});

		testDonut(GLOBAL_API_DATA.fakedata4,{
			selector: '#top_countriestest',
			source: 'facebook',
			color: ''
		});

	}
	if ($('body.twitter')[0]){
		console.log('    routesInit: twitter');

				
	}
	if ($('body.instagram')[0]){
		console.log('    routesInit: instagram');

				
	}
	if ($('body.youtube')[0]){
		console.log('    routesInit: youtube');

				
	}
	if ($('body.google-plus')[0]){
		console.log('    routesInit: google-plus');

				
	}
	if ($('body.analytics-all')[0]){
		console.log('    routesInit: analytics-all');

				
	}
	if ($('body.analytics-global')[0]){
		console.log('    routesInit: analytics-global');

				
	}
	if ($('body.analytics-us')[0]){
		console.log('    routesInit: analytics-us');

				
	}
	if ($('body.events')[0]){
		console.log('    routesInit: events');

				
	}
}

function type(d) {
	d.date = new Date(d.date);
  d.count = +d.count;
  return d;
}

function reachGraph(data, options){
	// Options Example

	var theData = data;

	// If an SVG exists, remove it. This is mostly for redrawing the graph on browser resize.
	if($(options.selector).first().children('svg')[0]){
		$(options.selector).first().children('svg').remove();
	}

	// Gets options in a data attr on the obj. Used to pass Keystone generated data.
	if ($(options.selector).data('admin-options') != '' || $(options.selector).data('admin-options') != null){
		options.admin_options = $(options.selector).data('admin-options');
	} else {
		options.admin_options = false;
	}

	// Init a few things.
	var svg = d3.select(options.selector).append('svg');
	var width = parseInt(svg.style('width'));
	var height = parseInt(svg.style('height'));
	var padding = 45;
 	var interpolateType = 'linear';

 	// Setup our x/y d3 functions and axes.
  var x = d3.time.scale()
  		.domain([d3.min(theData, function(d) { d = type(d); return d.date; }), d3.max(theData, function(d) { d = type(d); return d.date; })])
  		.range([padding*2, width - padding*2]),
      y = d3.scale.linear()
      .domain([0, d3.max(theData, function(d) { d = type(d); return d.count; })])
      .range([height - padding*2, padding/2]),
      xAxis = d3.svg.axis().scale(x).ticks(13).tickSize(-height+padding).tickSubdivide(true).orient("bottom"),
      yAxis = d3.svg.axis().scale(y).ticks(7).tickSubdivide(true).orient("left").tickFormat(function(d) { return abbreviateNumber(d); }),
      xAxisTicks = d3.svg.axis().scale(x).ticks(9).tickFormat('').tickSize(-height+padding).tickSubdivide(true).orient("bottom")

  // Alternative tick format: tickFormat(options.admin_options ? d3.time.format(options.admin_options.timeFormat) : d3.time.format("%d/%m/%y"))


  // Area Function
  var area = d3.svg.area()
      .interpolate(interpolateType)
      .x(function(d) { return x(d.date); })
      .y0(height - padding*2)
      .y1(function(d) {  return y(d.count) });

  // Line Function
  var line = d3.svg.line()
    .interpolate(interpolateType)
    .x(function(d) { d = type(d); return x(d.date); })
    .y(function(d) { d = type(d); return y(d.count); });

  // Group Elements for Axes and Text

  // X Lines Behind Graph
  svg.append("g")
      .attr("class", "x axis main-x-lines")
      .attr("stroke-width", "2")
      .attr("transform", "translate(0," + (height - padding) + ")")
      .call(xAxis)
      .selectAll('line')
      .attr('y1', -padding);

  // Adjusts Date Positions
  svg.select('.main-x-lines')
      .selectAll('text')
      .attr('dy', padding/2);

  // Creates Ticks Above Dates
  svg.append("g")
      .attr("class", "x axis")
      .attr("stroke-width", "1")
      .attr("transform", "translate(0," + (height - padding) + ")")
      .call(xAxisTicks)
      .selectAll('line')
      .attr("class", "containing_line")
      .attr('y1', -padding/2)
      .attr('y2', 0)

  // Horizontal Tick Line
  svg.append("line")
  	.attr("class", "line containing_line")
    .attr("x1", padding*1.5)
		.attr("y1", height - padding*1.5)
		.attr("x2", width-padding*2)
		.attr("y2", height - padding*1.5)
		.attr("stroke-width", 1);

	// Vertical Tick Line
  svg.append("line")
  	.attr("class", "line containing_line")
    .attr("x1", padding*1.5)
		.attr("y1", 0)
		.attr("x2", padding*1.5)
		.attr("y2", height-padding)
		.attr("stroke-width", 1)
      
  // Y Numerical Ticks
  svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + padding*1.4 + ",0)")
      .call(yAxis);


  // Area and Line Graph Data
	svg.append("clipPath")
    .attr("id", options.selector+"_clip")
    .append("rect")
    .attr("width", width - padding)
    .attr("height", height - padding);

  svg.append("path")
    .attr("class", "area")
    .attr("clip-path", "url("+options.selector+"_clip)")
    .attr("d", area(theData));

	svg.append("path")
    .attr("class", "line")
    .attr("stroke-width", 2)
    .attr("clip-path", "url("+options.selector+"_clip)")
    .attr("d", line(theData));

}

function donutGraph(data, options){
	// Options Example

	var theData = data;

	var numericalData = function(){
		var tempArray = [];
		for (var i = 0; i < theData.length; i++){
			tempArray[i] = theData[i].value;
		}
		return tempArray;
	}

	// If an SVG exists, remove it. This is mostly for redrawing the graph on browser resize.
	if($(options.selector).first().children('svg')[0]){
		$(options.selector).first().children('svg').remove();
	}

	// Gets options in a data attr on the obj. Used to pass Keystone generated data.
	if ($(options.selector).data('admin-options') != '' || $(options.selector).data('admin-options') != null){
		options.admin_options = $(options.selector).data('admin-options');
	} else {
		options.admin_options = false;
	}

	// Init a few things.
	var svg = d3.select(options.selector).append('svg')
	var width = parseInt(svg.style('width'));
	var height = parseInt(svg.style('height'));
	var radius = Math.min(width, height) / 2;
	var padding = 45;
 	//var interpolateType = 'linear';

 	svg.append("g")
 		.attr("class", "slices");
 	svg.append("g")
 		.attr("class", "labels");
 	svg.append("g")
 		.attr("class", "lines");

 	var color = d3.scale.category20();

 	var pie = d3.layout.pie();

 	var arc = d3.svg.arc()
 	    .innerRadius(radius - 80)
 	    .outerRadius(radius - 50);

 	var outerArc = d3.svg.arc()
 		.innerRadius(radius * 0.9)
 		.outerRadius(radius * 0.9);

 	var donut = d3.select(options.selector).select('svg')
 		.attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var path = donut.selectAll("path")
    	.data(pie(numericalData()))
    .enter().append("path")
	    .attr("fill", function(d, i) { return color(i); })
	    .attr("d", arc);

}














function testDonut(ourData, options){

	var theData = simplifyData(ourData);

	// If an SVG exists, remove it. This is mostly for redrawing the graph on browser resize.
	if($(options.selector).first().children('svg')[0]){
		$(options.selector).first().children('svg').remove();
	}

	// Gets options in a data attr on the obj. Used to pass Keystone generated data.
	if ($(options.selector).data('admin-options') != '' || $(options.selector).data('admin-options') != null){
		options.admin_options = $(options.selector).data('admin-options');
	} else {
		options.admin_options = false;
	}

	var mainSvg = d3.select(options.selector).append("svg")
	var svg = mainSvg.append("g")
	var width = parseInt(mainSvg.style('width'));
	var height = parseInt(mainSvg.style('height'));
	var radius = Math.min(width, height) / 2.3;

	

	var pie = d3.layout.pie()
		.sort(null)
		.value(function(d) {
			return d.value;
		});

	var arc = d3.svg.arc()
		.outerRadius(radius * 0.65)
		.innerRadius(radius * 0.45).startAngle(function(d) { return d.startAngle + Math.PI/7; }).endAngle(function(d) { return d.endAngle + Math.PI/7; });

	var outerArc = d3.svg.arc()
		.innerRadius(radius * 0.9)
		.outerRadius(radius * 0.9).startAngle(function(d) { return d.startAngle + Math.PI/7; }).endAngle(function(d) { return d.endAngle + Math.PI/7; });

	var key = function(d){ return d.data.label; };

	svg
		.append("g")
		.attr("class", "slices");
	svg
		.append("g")
		.attr("class", "labels");
	svg
		.append("g")
		.attr("class", "lines");
	svg
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	

	change(theData);
	
	function change(data) {

		var randomColor = d3.scale.category20();

		
		$('#hex').bind('blur keydown', function (event) {
				var el = this;
				setTimeout(function () {
					var rgb = [],
					    $input = $(el),
					    fail = false,
					    original = $input.val(),
					
					hex = (original+'').replace(/#/, '');
					
					if (original.length === 1 && original !== '#') { $input.val('#' + original); }
					if (hex.length == 3) hex = hex + hex;

					for (var i = 0; i < 6; i+=2) {
					   rgb.push(parseInt(hex.substr(i,2),16));
					   fail = fail || rgb[rgb.length - 1].toString() === 'NaN';
					}

					$('#rgb').val(fail ? '' : 'rgb(' + rgb.join(',') + ')');
					$('#hsl').val(fail ? '' : 'hsl(' + rgbToHsl.apply(null, rgb).join(',') + ')');
					   
					$('body').css('backgroundColor', $('#rgb').val());
			    }, 13);
			});




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

		/* ------- PIE SLICES -------*/
		var slice = svg.select(".slices")
					.selectAll("path.slice")
					.data(pie(data), key);

		slice
			.enter()
			.insert("path")
			.style("fill", function(d, i) { return saturationControl(randomColor(i), '1', 0.75); })
			.attr("class", "slice");

		slice		
			.transition().duration(1000)
			.attrTween("d", function(d) {
				this._current = this._current || d;
				var interpolate = d3.interpolate(this._current, d);
				this._current = interpolate(0);
				return function(t) {
					return arc(interpolate(t));
				};
			})

		slice
			.exit()
			.remove();

		/* ------- TEXT LABELS -------*/

		var text = svg.select(".labels")
					.selectAll("text")
					.data(pie(data), key);

		text
			.enter()
			.append("text")
			.attr("dy", ".35em")
			.text(function(d) {
				return d.data.label;
			});
		
		function midAngle(d){
			return d.startAngle + (d.endAngle - d.startAngle)/2;
		}

		text.transition().duration(1000)
			.attrTween("transform", function(d) {
				this._current = this._current || d;
				var interpolate = d3.interpolate(this._current, d);
				this._current = interpolate(0);
				return function(t) {
					var d2 = interpolate(t);
					var pos = outerArc.centroid(d2);
					pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
					return "translate("+ pos[0]+","+pos[1]*1.2 +")";
				};
			})
			.styleTween("text-anchor", function(d){
				this._current = this._current || d;
				var interpolate = d3.interpolate(this._current, d);
				this._current = interpolate(0);
				return function(t) {
					var d2 = interpolate(t);
					return midAngle(d2) < Math.PI ? "start":"end";
				};
			});

		text
			.exit()
			.remove();

		/* ------- SLICE TO TEXT POLYLINES -------*/

		var polyline = svg.select(".lines")
					.selectAll("polyline")
					.data(pie(data), key);
		
		polyline
			.enter()
			.append("polyline");

		polyline.transition().duration(1000)
			.attrTween("points", function(d){
				this._current = this._current || d;
				var interpolate = d3.interpolate(this._current, d);
				this._current = interpolate('0');
				return function(t) {
					var d2 = interpolate(t);
					var pos = outerArc.centroid(d2);
					pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
					return [
						arc.centroid(d2)[0]*1.17,
						arc.centroid(d2)[1]*1.17,
						outerArc.centroid(d2)[0]*0.95,
						outerArc.centroid(d2)[1]*1.2,
						pos[0],
						pos[1]*1.2
					];
				};			
			});
		
		polyline
			.exit()
			.remove();
	};
}