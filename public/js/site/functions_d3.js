// Front End Routes

// This is where you would add certain graphs to certain pages and init them.

function routesInit(){
	if ($('body.dashboard')[0]){
		console.log('    routesInit: dashboard');

		
	}
	if ($('body.facebook')[0]){
		console.log('    routesInit: facebook');

		reachGraph(GLOBAL_API_DATA.fakedata1,{
			selector: '#reach',
			source: 'facebook',
			color: '#0000FF',
		});

		reachGraph1(GLOBAL_API_DATA.fakedata2,{
			selector: '#reach1',
			source: 'facebook',
			color: '#0000FF',
		});

		reachGraph2(GLOBAL_API_DATA.fakedata2,{
			selector: '#reach2',
			source: 'facebook',
			color: '#0000FF',
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

function reachGraph(data, options){
	// Options Example

	var theData = data;
	
	// console.log(theData);
	// console.log(options);

	if($(options.selector).first().children('svg')[0]){
		$(options.selector).first().children('svg').remove();
	}

	var svg = d3.select(options.selector).append('svg');



	var w = parseInt(svg.style('width'));
	var h = parseInt(svg.style('height'));
	var padding = 1;

	svg.selectAll("rect")
	   .data(theData)
	   .enter()
	   .append("rect")
	   .attr("x", function(d, i) {
	       return i * (w / theData.length);
	   })
	   .attr("y", function(d) {
	       return h - d*4;  //Height minus data value
	   })
	   .attr("width", w / theData.length - padding)
	   .attr("height", function(d) {
	       return (d*4);  //Just the data value
	   })
	   .attr("fill", function(d) {
	       return "rgb(0, 0, " + (d * 10) + ")";
	   });

	svg.selectAll("text")
		.data(theData)
		.enter()
		.append("text")
		.text(function(d) {
		  return d;
		})
		.attr("x", function(d, i) {
      return i * (w / theData.length) + (w / theData.length - padding) / 2;
    })
		.attr("y", function(d) {
      return h - (d * 4) + 14;  //15 is now 14
    })
		.attr("font-family", "sans-serif")
		.attr("font-size", "11px")
		.attr("fill", "white")
		.attr("text-anchor", "middle");

}

function reachGraph1(data, options){
	// Options Example

	var theData = data;
	
	// console.log(theData);
	// console.log(options);

	if($(options.selector).first().children('svg')[0]){
		$(options.selector).first().children('svg').remove();
	}

	var svg = d3.select(options.selector).append('svg');
	var w = parseInt(svg.style('width'));
	var h = parseInt(svg.style('height'));
	var padding = 30;

	// Scale Functions
	var xScale = d3.scale.linear()
		.domain([0, d3.max(theData, function(d) { return d[0]; })])
		.range([padding, w - padding]);

	var yScale = d3.scale.linear()
		.domain([0, d3.max(theData, function(d) { return d[1]; })])
		.range([h - padding, padding]);

	var rScale = d3.scale.linear()
		.domain([0, d3.max(theData, function(d) { return d[1]; })])
		.range([2, 5]);

	var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom")
    .ticks(5);  //Set rough # of ticks

  var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left")
    .ticks(5);

  svg.selectAll("circle")
		.data(theData)
		.enter()
		.append("circle")
		.attr("fill", "white")
		.attr("cx", function(d) {
		  return xScale(d[0]);
		})
		.attr("cy", function(d) {
		  return yScale(d[1]);
		})
		.attr("r", function(d) {
		  return rScale(d[1]);
		});

	svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(0," + (h - padding) + ")")
	  .call(xAxis);
		
	svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + padding + ",0)")
    .call(yAxis);

}

function reachGraph2(data, options){
	// Options Example

	var theData = data;
	
	// console.log(theData);
	// console.log(options);

	if($(options.selector).first().children('svg')[0]){
		$(options.selector).first().children('svg').remove();
	}

	var svg = d3.select(options.selector).append('svg');
	var w = parseInt(svg.style('width'));
	var h = parseInt(svg.style('height'));
	var padding = 30;

	// Scale Functions
	var xScale = d3.scale.linear()
		.domain([0, d3.max(theData, function(d) { return d[0]; })])
		.range([padding, w - padding]);

	var yScale = d3.scale.linear()
		.domain([0, d3.max(theData, function(d) { return d[1]; })])
		.range([h - padding, padding]);

	var rScale = d3.scale.linear()
		.domain([0, d3.max(theData, function(d) { return d[1]; })])
		.range([2, 5]);

	var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom")
    .ticks(5);  //Set rough # of ticks

  var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left")
    .ticks(5);

  var line = d3.svg.line()
    .interpolate("monotone")
    .x(function(d) { return xScale(d[0]); })
    .y(function(d) { return yScale(d[1]); });

  // svg.selectAll("circle")
		// .data(theData)
		// .enter()
		// .append("circle")
		// .attr("fill", "white")
		// .attr("cx", function(d) {
		// 	console.log(d);
		//   return xScale(d[0]);
		// })
		// .attr("cy", function(d) {
		//   return yScale(d[1]);
		// })
		// .attr("r", function(d) {
		//   return rScale(d[1]);
		// });

	svg.append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", w)
    .attr("height", h);

	svg.append("path")
    .attr("class", "line")
    .attr("clip-path", "url(#clip)")
    .attr("d", line(theData));

	svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(0," + (h - padding) + ")")
	  .call(xAxis);
		
	svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + padding + ",0)")
    .call(yAxis);

}