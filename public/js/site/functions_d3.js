///////////////////////////
// GENERAL D3 FUNCTIONS  //
///////////////////////////

function type(d) {
  var q = {
    key: false,
    value: false
  };
  q.key = new Date(d.key);
  q.value = +d.value;
  return q;
}



///////////////////////////
//       LINE GRAPH      //
///////////////////////////

function lineGraph(data, options, success, dateObj){
  // Preload Checks
  if (!$(options.selector)[0]) return;
  if (!success){
    $(options.selector).before(dataErrorHTML);
    $(options.selector).remove();
    return;
  } else if (success && data == null || data.length == 0){
    $(options.selector).before(noDataHTML);
    $(options.selector).remove();
    return;
  } else {
    $(options.selector).before(loadingGifHTML);
  }

  var theData = data,
      svg = false,
      width = false,
      height = false,
      x = false,
      y = false,
      xAxis = false,
      yAxis = false,
      xAxisTicks = false,
      area = false,
      line = false;

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
  svg = d3.select(options.selector).append('svg');
  width = parseInt(svg.style('width'));
  height = parseInt(svg.style('height'));
  var padding = 45;
  var interpolateType = 'linear';

  var xMin = 0;
  var xMax = 0;
  var yMin = 0;
  var yMax = 0;

  // Original x min and max by start and end
  // [d3.min(theData, function(d) {
  //   d = type(d); return d.key;
  // }), d3.max(theData, function(d) {
  //   d = type(d); return d.key;
  // })]

  yMin = d3.min(theData, function(d) {
    d = type(d); return d.value;
  });

  yMax = d3.max(theData, function(d) {
    d = type(d); return d.value;
  });

  if (yMin == 0 && yMax == 0){
    yMin = -10;
    yMax = 10;
  } else if (yMin >= yMax) {
    // If min and max are even, give it a bit a room to breathe.
    yMin = yMin * 0.8;
    yMax = yMax * 1.2;
  } else {
    // Otherwise give them the tiniest margin for edge cases.
    yMin = yMin * 0.999;
    yMax = yMax * 1.001;
  }

  var startTimeObj = new Date(dateObj.startTime);
  var endTimeObj = new Date(dateObj.endTime);

  xMin = startTimeObj;
  xMax = endTimeObj;

  function timeRange(startTimeObj, endTimeObj){
    var diffYear = 0;
    var diffMonth = 0;

    diffYear = (endTimeObj.getFullYear() - startTimeObj.getFullYear()) > 0 ? true : false;
    diffMonth = (endTimeObj.getMonth() - startTimeObj.getMonth()) > 2 ? true : false;
    if (diffYear) {
      return d3.time.format("%m.%d.%y");
    } else if (diffMonth){
      return d3.time.format("%m.%d.%y");
    } else {
      return null;
    }
  }

   // Setup our x/y d3 functions and axes.
  x = d3.time.scale()
        .domain([xMin, xMax])
        .range([padding*2, width - padding*2]);
  y = d3.scale.linear()
      .domain([yMin, yMax])
      .range([height - padding*2, padding/2]);
  xAxis = d3.svg.axis().scale(x).ticks(7).tickSize(-height+padding).orient("bottom").tickFormat(timeRange(startTimeObj, endTimeObj));
  yAxis = d3.svg.axis().scale(y).ticks(7).orient("left").tickFormat(function(d) { return abbreviateNumber(d); });
  xAxisTicks = d3.svg.axis().scale(x).ticks(7).tickFormat('').tickSize(-height+padding).orient("bottom");

  // Alternative tick format: tickFormat(options.admin_options ? d3.time.format(options.admin_options.timeFormat) : d3.time.format("%d/%m/%y"))


  // Area Function
  var area = d3.svg.area()
      .interpolate(interpolateType)
      .x(function(d) { d = type(d); return x(d.key); })
      .y0(height - padding*2)
      .y1(function(d) {  d = type(d); return y(d.value) });

  // Line Function
  var line = d3.svg.line()
    .interpolate(interpolateType)
    .x(function(d) { d = type(d); return x(d.key); })
    .y(function(d) { d = type(d); return y(d.value); });

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
    .attr("stroke-width", 1)
    .attr("clip-path", "url("+options.selector+"_clip)")
    .attr("d", line(theData));


  var focus = svg.append("g")
    .attr('class', 'line-point-tooltip')
    .style("display", "none");
  var bisectDate = d3.bisector(function(d) { d = type(d); return d.key; }).right;

  // append the circle at the intersection
  focus.append("rect")
    .attr("class", "line-point-caret")
    .attr("width", "1em")
    .attr("height", "1em")
    .attr("y", "-1.75em")
    .attr("x", ".73em")
    .style("text-anchor", "middle");
  focus.append("rect")
    .attr("class", "line-point-bg")
    .attr("width", "10em")
    .attr("height", "4em")
    .attr("x", "-5em")
    .attr("y", "-5.75em")
    .style("text-anchor", "middle");
  focus.append("circle")
    .attr("class", "y")
    .style("fill", "white")
    .style("stroke", "white")
    .attr("r", 3);
  focus.append("text")
    .attr("class", "line-point-value")
    .attr("dy", "-3.3em")
    .attr("dx", "0em");
  focus.append("text")
    .attr("class", "line-point-date")
    .attr("dy", "-3em")
    .attr("dx", "0");
  // focus.append("text")
  //   .attr("class", "line-point-year")
  //   .attr("dy", "-2.1em")
  //   .attr("dx", "2.5em");

  svg.append("rect")
    .attr("width", width - padding*4)
    .attr("height", height - padding)
    .attr("transform", "translate("+padding*2+",0)")
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mouseover", function() { focus.style("display", null); })
    .on("mouseout", function() { focus.style("display", 'none'); })
    .on("mousemove", mousemove);


  function mousemove() {
    var x0 = x.invert(d3.mouse(this)[0]+padding*2.5);
    var i = bisectDate(theData, x0, 1);
    var d0 = data[i - 1];
    var d1 = data[i];
    if(d0 == undefined || d1 == undefined) { return; }
    var d = x0 - d0.key > d1.key - x0 ? d1 : d0;

    var theDate = new Date(d.key);
    var pointDate = theDate.getShortMonthName() + ' ' + theDate.getDate() + ', ' + theDate.getFullYear();
    //var pointYear = theDate.getFullYear();

    focus.selectAll("circle.y, text, .line-point-bg")
      .transition()
      .duration(50)
      .attr("transform", "translate(" + x(new Date(d.key)) + "," + y(d.value) + ")");
    focus.select(".line-point-caret")
      .transition()
      .duration(50)
      .attr("transform", "translate(" + x(new Date(d.key)) + "," + y(d.value) + ") rotate(-45)");
    focus.select(".line-point-value")
      .text(numberWithCommas(d.value));
    focus.select(".line-point-date")
      .text(pointDate);
    // focus.select(".line-point-year")
    //   .text(pointYear);
  }

  if($(options.selector).find('svg').find('path.area').attr("d").indexOf("NaN") != -1){
    $(options.selector).before(dataErrorHTML);
    $(options.selector).siblings(loadingGifClass).remove();
    $(options.selector).remove();
    return;
  }

  statsDelegation(data.summary, options);
  $(options.selector).sectionLoad(true);
}





///////////////////////////
//    MULTILINE GRAPH    //
///////////////////////////

function multiLineGraph(data, options, success, dateObj){
  // Preload Checks
  if (!$(options.selector)[0]) return;
  if (!success){
    $(options.selector).before(dataErrorHTML);
    $(options.selector).remove();
    return;
  } else if (success && data == null || data.length == 0){
    $(options.selector).before(noDataHTML);
    $(options.selector).remove();
    return;
  } else {
    $(options.selector).before(loadingGifHTML);
  }

  var theData = data,
      svg = false,
      width = false,
      height = false,
      x = false,
      y = false,
      xAxis = false,
      yAxis = false,
      xAxisTicks = false,
      area = false,
      line = false;

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
  svg = d3.select(options.selector).append('svg');
  width = parseInt(svg.style('width'));
  height = parseInt(svg.style('height'));
  var padding = 45;
  var interpolateType = 'linear';

  var xMin = 0;
  var xMax = 0;
  var yMin = 0;
  var yMax = 0;

  var totalData = [];

  _.each(theData, function(datum, key){
    totalData = totalData.concat(datum);
  });

  yMin = d3.min(totalData, function(d) {
    d = type(d); return d.value;
  });

  yMax = d3.max(totalData, function(d) {
    d = type(d); return d.value;
  });

  if (yMin == 0 && yMax == 0){
    yMin = -10;
    yMax = 10;
  } else if (yMin >= yMax) {
    // If min and max are even, give it a bit a room to breathe.
    yMin = yMin * 0.8;
    yMax = yMax * 1.2;
  } else {
    // Otherwise give them the tiniest margin for edge cases.
    yMin = yMin * 0.999;
    yMax = yMax * 1.001;
  }

  var startTimeObj = new Date(dateObj.startTime);
  var endTimeObj = new Date(dateObj.endTime);

  xMin = startTimeObj;
  xMax = endTimeObj;

  function timeRange(startTimeObj, endTimeObj){
    var diffYear = 0;
    var diffMonth = 0;

    diffYear = (endTimeObj.getFullYear() - startTimeObj.getFullYear()) > 0 ? true : false;
    diffMonth = (endTimeObj.getMonth() - startTimeObj.getMonth()) > 2 ? true : false;
    if (diffYear) {
      return d3.time.format("%m.%d.%y");
    } else if (diffMonth){
      return d3.time.format("%m.%d.%y");
    } else {
      return null;
    }
  }

   // Setup our x/y d3 functions and axes.
  x = d3.time.scale()
        .domain([xMin, xMax])
        .range([padding*2, width - padding*2]);
  y = d3.scale.linear()
      .domain([yMin, yMax])
      .range([height - padding*2, padding/2]);
  xAxis = d3.svg.axis().scale(x).ticks(7).tickSize(-height+padding).orient("bottom").tickFormat(timeRange(startTimeObj, endTimeObj));
  yAxis = d3.svg.axis().scale(y).ticks(7).orient("left").tickFormat(function(d) { return abbreviateNumber(d); });
  xAxisTicks = d3.svg.axis().scale(x).ticks(7).tickFormat('').tickSize(-height+padding).orient("bottom");

  // Alternative tick format: tickFormat(options.admin_options ? d3.time.format(options.admin_options.timeFormat) : d3.time.format("%d/%m/%y"))


  // Area Function
  var area = d3.svg.area()
      .interpolate(interpolateType)
      .x(function(d) { d = type(d); return x(d.key); })
      .y0(height - padding*2)
      .y1(function(d) {  d = type(d); return y(d.value) });

  // Line Function
  var line = d3.svg.line()
    .interpolate(interpolateType)
    .x(function(d) { d = type(d); return x(d.key); })
    .y(function(d) { d = type(d); return y(d.value); });

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




  _.each(theData, function(datum, key){

    // Area and Line Graph Data
    svg.append("clipPath")
      .attr("id", options.selector+"_clip"+key)
      .append("rect")
      .attr("width", width - padding)
      .attr("height", height - padding);

    svg.append("path")
      .attr("class", "area area_color_"+key)
      .attr("clip-path", "url("+options.selector+"_clip)"+key)
      .attr("d", area(datum));

    svg.append("path")
      .attr("class", "line line_color_"+key)
      .attr("stroke-width", 1)
      .attr("clip-path", "url("+options.selector+"_clip)"+key)
      .attr("d", line(datum));
  });




  var focus = svg.append("g")
    .attr('class', 'line-point-tooltip')
    .style("display", "none");
  var bisectDate = d3.bisector(function(d) { d = type(d); return d.key; }).left;


  _.each(theData, function(datum, key){
    focus.append("rect")
      .attr("class", "line-point-caret line-point-caret-"+key)
      .attr("width", "1em")
      .attr("height", "1em")
      .attr("y", "-1.75em")
      .attr("x", ".73em")
      .style("text-anchor", "middle");
    focus.append("rect")
      .attr("class", "line-point-bg line-point-bg-"+key)
      .attr("width", "10em")
      .attr("height", "4em")
      .attr("x", "-5em")
      .attr("y", "-5.75em")
      .style("text-anchor", "middle");
    focus.append("circle")
      .attr("class", "y circle-"+key)
      .style("fill", "white")
      .style("stroke", "white")
      .attr("r", 3);
    focus.append("text")
      .attr("class", "line-point-value line-point-value-"+key)
      .attr("dy", "-3.3em")
      .attr("dx", "0em");
    focus.append("text")
      .attr("class", "line-point-date line-point-date-"+key)
      .attr("dy", "-3em")
      .attr("dx", "0");
  });

  svg.append("rect")
    .attr("class", "line-point-rect-facebook")
    .attr("width", width - padding*4)
    .attr("height", height - padding)
    .attr("transform", "translate("+padding*2+",0)")
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mouseover", function() { focus.style("display", null); })
    .on("mouseout", function() { focus.style("display", 'none'); })
    .on("mousemove", mousemove_facebook);

  svg.append("rect")
    .attr("class", "line-point-rect-twitter")
    .attr("width", width - padding*4)
    .attr("height", height - padding)
    .attr("transform", "translate("+padding*2+",0)")
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mouseover", function() { focus.style("display", null); })
    .on("mouseout", function() { focus.style("display", 'none'); })
    .on("mousemove", mousemove_twitter);

  svg.append("rect")
    .attr("class", "line-point-rect-instagram")
    .attr("width", width - padding*4)
    .attr("height", height - padding)
    .attr("transform", "translate("+padding*2+",0)")
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mouseover", function() { focus.style("display", null); })
    .on("mouseout", function() { focus.style("display", 'none'); })
    .on("mousemove", mousemove_instagram);

  function mousemove_facebook() {
    var x0 = x.invert(d3.mouse(this)[0]+padding*2.5);
    var i = bisectDate(theData.facebook, x0, 1);
    var d0 = theData.facebook[i - 1];
    var d1 = theData.facebook[i];
    if(d0 == undefined || d1 == undefined) { return; }
    var d = x0 - d0.key > d1.key - x0 ? d1 : d0;

    var theDate = new Date(d.key);
    var pointDate = theDate.getShortMonthName() + ' ' + theDate.getDate() + ', ' + theDate.getFullYear();

    focus.selectAll("circle.y, text, .line-point-bg")
      .transition()
      .duration(50)
      .attr("transform", "translate(" + x(new Date(d.key)) + "," + y(d.value) + ")");
    focus.selectAll(".line-point-caret")
      .transition()
      .duration(50)
      .attr("transform", "translate(" + x(new Date(d.key)) + "," + y(d.value) + ") rotate(-45)");
    focus.selectAll(".line-point-value")
      .text(numberWithCommas(d.value));
    focus.selectAll(".line-point-date")
      .text(pointDate);
  }
  function mousemove_twitter() {
    var x0 = x.invert(d3.mouse(this)[0]+padding*2.5);
    var i = bisectDate(theData.twitter, x0, 1);
    var d0 = theData.twitter[i - 1];
    var d1 = theData.twitter[i];
    if(d0 == undefined || d1 == undefined) { return; }
    var d = x0 - d0.key > d1.key - x0 ? d1 : d0;

    var theDate = new Date(d.key);
    var pointDate = theDate.getShortMonthName() + ' ' + theDate.getDate() + ', ' + theDate.getFullYear();

    focus.selectAll("circle.y, text, .line-point-bg")
      .transition()
      .duration(50)
      .attr("transform", "translate(" + x(new Date(d.key)) + "," + y(d.value) + ")");
    focus.selectAll(".line-point-caret")
      .transition()
      .duration(50)
      .attr("transform", "translate(" + x(new Date(d.key)) + "," + y(d.value) + ") rotate(-45)");
    focus.selectAll(".line-point-value")
      .text(numberWithCommas(d.value));
    focus.selectAll(".line-point-date")
      .text(pointDate);
  }
  function mousemove_instagram() {


    var x0 = x.invert(d3.mouse(this)[0]+padding*2.5);
    var i = bisectDate(theData.instagram, x0, 1);
    var d0 = theData.instagram[i - 1];
    var d1 = theData.instagram[i];
    if(d0 == undefined || d1 == undefined) { return; }
    var d = x0 - d0.key > d1.key - x0 ? d1 : d0;

    var theDate = new Date(d.key);
    var pointDate = theDate.getShortMonthName() + ' ' + theDate.getDate() + ', ' + theDate.getFullYear();
    //var pointYear = theDate.getFullYear();

    focus.selectAll("circle.y, text, .line-point-bg")
      .transition()
      .duration(50)
      .attr("transform", "translate(" + x(new Date(d.key)) + "," + y(d.value) + ")");
    focus.selectAll(".line-point-caret")
      .transition()
      .duration(50)
      .attr("transform", "translate(" + x(new Date(d.key)) + "," + y(d.value) + ") rotate(-45)");
    focus.selectAll(".line-point-value")
      .text(numberWithCommas(d.value));
    focus.selectAll(".line-point-date")
      .text(pointDate);
  }

  if($(options.selector).find('svg').find('path.area').attr("d").indexOf("NaN") != -1){
    $(options.selector).before(dataErrorHTML);
    $(options.selector).siblings(loadingGifClass).remove();
    $(options.selector).remove();
    return;
  }


  statsDelegation(data.summary, options);
  $(options.selector).sectionLoad(true);
}


///////////////////////////
//    DONUT/PIE GRAPH    //
///////////////////////////

// TODO: Donut graph labels are still overlapping
// in some cases, need to fix this later on by QA.
function donutGraph(data, options, success){
  // Preload Checks
  if (!$(options.selector)[0]) return;
  if (!data || !success){
    $(options.selector).before(dataErrorHTML);
    $(options.selector).remove();
    return;
  } else if (data == null || data.length == 0){
    $(options.selector).before(noDataHTML);
    $(options.selector).remove();
    return;
  } else {
    $(options.selector).before(loadingGifHTML);
  }

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

  var mainSvg = d3.select(options.selector).append("svg")
  var svg = mainSvg.append("g")
  var width = parseInt(mainSvg.style('width'));
  var height = Math.round(parseInt(mainSvg.style('height'))*0.6);
  var radius = Math.min(width, height) / 2.3;

  var pie = d3.layout.pie()
    .sort(null)
    .value(function(d) {
      return d.value;
    });

  var findPercents = d3.layout.pie()
    .sort(null)
    .value(function(d) {
      return d.percent;
    });

  if (options.rotation != undefined){
    if (options.rotation == "135") {
      var arc = d3.svg.arc()
        .outerRadius(radius * 0.65)
        .innerRadius(radius * 0.45).startAngle(function(d) { return d.startAngle - Math.PI/6; }).endAngle(function(d) { return d.endAngle - Math.PI/6; });
      var outerArc = d3.svg.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9).startAngle(function(d) { return d.startAngle - Math.PI/6; }).endAngle(function(d) { return d.endAngle - Math.PI/6; });
    }

  } else {
    var arc = d3.svg.arc()
      .outerRadius(radius * 0.65)
      .innerRadius(radius * 0.45);//.startAngle(function(d) { return d.startAngle + Math.PI/7; }).endAngle(function(d) { return d.endAngle + Math.PI/7; });
    var outerArc = d3.svg.arc()
      .innerRadius(radius * 0.9)
      .outerRadius(radius * 0.9);//.startAngle(function(d) { return d.startAngle + Math.PI/7; }).endAngle(function(d) { return d.endAngle + Math.PI/7; });
  }


  var key = function(d){ return d.data.label; };

  svg
    .append("g")
    .attr("class", "slices");
  svg
    .append("g")
    .attr("class", "labels");
  svg
    .append("g")
    .attr("class", "percent");
  svg
    .append("g")
    .attr("class", "lines");
  svg
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  change(theData);

  function change(data) {

    var changedData = data;

    var randomColor = d3.scale.category20();

    /* ------- PIE SLICES -------*/
    var slice = svg.select(".slices")
          .selectAll("path")
          .data(pie(changedData), key);

    slice
      .enter()
      .insert("path")
      .attr("data-label", function(d){
        return d.data.label;
      })
      .style("fill", function(d, i) { return saturationControl(randomColor(i), '1', 0.75); });

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
          .data(pie(changedData), key);

    text
      .enter()
      .append("text")
      .attr("dy", ".35em")
      .attr("data-label", function(d){
        return d.data.label;
      })
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

    /* ------- TEXT PERCENT -------*/
    var percents = svg.select(".percent")
          .selectAll("text")
          .data(findPercents(changedData));

    percents
      .enter()
      .append("text")
      .attr("dy", ".35em")
      .attr("text-anchor","middle")
      .attr("data-label", function(d){
        return d.data.label;
      })
      .text(function(d) {
        return d.data.percent;
      });


    /* ------- SLICE TO TEXT POLYLINES -------*/

    var polyline = svg.select(".lines")
          .selectAll("polyline")
          .data(pie(changedData), key);

    polyline
      .enter()
      .append("polyline")
      .attr("data-label", function(d){
        return d.data.label;
      });

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

  $(options.selector).sectionLoad(true, true);
  donutPercents();
}
