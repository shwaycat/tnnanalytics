// Front End Routes

// This is where you would add certain graphs to certain pages and init them.

function routesInit(){
	if ($('body.dashboard')[0]){
		console.log('    routesInit: dashboard');

		
	}
	if ($('body.facebook')[0]){
		console.log('    routesInit: facebook');

		reachGraph2(GLOBAL_API_DATA.fakedata3,{
			selector: '#reach',
			source: 'facebook',
			color: GLOBAL_GRAPH_COLORS.reach_line,
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

function reachGraph2(data, options){
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