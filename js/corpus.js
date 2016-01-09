// this script visualizes text reuse, using
// json from an ANN algorithm contained in
// /utils/. For more information, see:
// https://github.com/duhaime/visualizing-text-reuse

// TODO: factor out margin, w, h from passagePlot &
// corpus plot into functions

///////////////////////////////////////
// initialize passage plot functions //
///////////////////////////////////////

// function that makes the plotting call
var callPassagePlot = function (sourceId) {
  var alignmentsDir = "json/alignments/"; 
  var alignmentsFile = sourceId + "_alignments.json";
  var alignmentsPath = alignmentsDir + alignmentsFile

  $.getJSON( alignmentsPath, function( jsonResponse ) {
    updatePassagePlot( jsonResponse );
  });
};  


// function that takes as input an array of dicts
// [{"similarId":0,"title":"A"}...] and returns an 
// array of dicts that contains only one 
// observation for each similarId. 
var uniquify = function(arr) {
  var ids = [];
  var result = [];
  // add information on the input text first to ensure
  // the selected text appears first in the key 
  if (arr.length > 0) {
    result.push({"similarYear":arr[0].sourceYear,
        "similarId":arr[0].sourceId,
        "similarTitle":arr[0].sourceTitle}
    );
  };
  var indx=-1;
  for(var i=0; i< arr.length; i++){
    indx = ids.indexOf(arr[i].similarId);
    if(indx==-1){
      ids.push(arr[i].similarId);
      result.push(arr[i]);
    }
  }
  return result;
};


// append selected source and target segments to the DOM
var updateText = function(d) { 
  // append the text titles to the DOM
  d3.select("#titleLeft").html( d.sourceTitle);
  d3.select("#titleRight").html( d.similarTitle);
  segmentsDir = "json/segments/";
  sourceSegmentsFile = "segments_" + d.sourceId + ".json";
  sourceSegmentsPath = segmentsDir + sourceSegmentsFile;

  $.getJSON(sourceSegmentsPath, function( jsonResponse ) {
    d3.select("#textLeft").html( jsonResponse[d.sourceSegment] );
  });

  similarSegmentsFile = "segments_" + d.similarId + ".json";
  similarSegmentsPath = segmentsDir + similarSegmentsFile;

  $.getJSON(similarSegmentsPath, function( jsonResponse ) {
    d3.select("#textRight").html( jsonResponse[d.similarSegment] );
  });
};


// function to reset text upon new json selection
var resetText = function() { 
  var hintPreface = '<p style="font-weight:normal;">';
  var hintText = ''; 
  var hint = hintPreface + hintText + '</p4>'; 
  d3.select("#titleLeft").html("");
  d3.select("#titleRight").html("");
  d3.select("#textLeft").html("");
  d3.select("#textRight").html("");
}; 

 
// plotting helper functions
var similarityFn = function(d) { return d.similarity }
var segmentFn = function(d) { return d.sourceSegment }


// specify a key function
var dataKey = function(d) {
  return d.sourceId + "." + d.similarId + "." + d.similarity;
};


// initialize plot by appending required assets to DOM
var initializePassagePlot = function() {

  // initialize the typeahead dropdown
  initializePassageTypeahead();
  addPassageTypeaheadListener();

  // width and height for the scatter plot and time axis
  var margin = {top: 70, right: 420, left: 70, bottom: 50};   
  var timeMargin = {top:40, right: 0, left: 5, bottom: 0};
  var w = 800 - margin.left - margin.right;
  var h = 340 - margin.top - margin.bottom;

  // draw the svg
  var svg = d3.select("#passagePlot").append("svg:svg")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom);

  // select a subregion of the svg to create a dropbox
  var graphBox = svg.append("rect")
    .attr("id", "graphBox")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("height", h)
    .attr("width", w)
    .attr("stroke", "#c4c4c4")
    .attr("stroke-width", 1)
    .attr("fill", "#ffffff");

  // append x axis to DOM
  var xAxisGroup = svg.append("g")
    .attr("class","x axis")
    .attr("transform", "translate(" + margin.left + 
      "," + (h+margin.top) + ")");

  // add a label to the x axis
  xAxisLabel = svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", w-15)
    .attr("y", h + margin.top + margin.bottom - 9)
    .style("font-size", "12.5")
    .style("font-weight", "normal")
    .text("Passage in selected text");
        
  // append y axis to DOM
  var yAxisGroup = svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + margin.left +
       "," + margin.top + ")")

  // add a label to the y axis
  svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 8)
    .attr("x", -(h+margin.top-10)/2)
    .attr("dy", ".75em")
    .style("font-size", "12.5")
    .style("font-weight", "normal")
    .attr("transform", "rotate(-90)")
    .text("Passage similarity");

  // append time axis to DOM
  var timeAxisGroup = svg.append("g")
    .attr("class", "time")
    .attr("transform", "translate(" + 
        (timeMargin.left) + 
        "," + (timeMargin.top) + ")");

  // create plot using source Id for 
  // the initial view
  callPassagePlot(0);

};


// function to pass data into plot and update plot
var updatePassagePlot = function(data) {

  var margin = {top: 70, right: 420, left: 70, bottom: 50};   
  var timeMargin = {top:40, right: 0, left: 5, bottom: 0}; 
  var w = 800 - margin.left - margin.right;
  var h = 340 - margin.top - margin.bottom;

  // identify divs we've already appended to DOM
  var xAxisGroup = d3.select("#passagePlot").select(".x.axis");
  var yAxisGroup = d3.select("#passagePlot").select(".y.axis");
  var timeAxisGroup = d3.select("#passagePlot").select(".time");
  var svg = d3.select("#passagePlot").select("svg");

  // split data into two components
  bookendYearData = data.bookendYears.slice();
  alignmentData = data.alignments.slice();

  console.log(alignmentData);

  // specify color scheme
  var colors = d3.scale.category20();

  // reset text in the textBox
  resetText();

  console.log(alignmentData[0].sourceTitle);

  // Set the first text's title as the typeahead value
  $('.tt-input').typeahead('val', alignmentData[0].sourceTitle); 

  // specify x axis range
  var x = d3.scale.linear()
    .domain(d3.extent(alignmentData, segmentFn))
    .range([15, w-15]);

  // draw x axis
  var xAxis = d3.svg.axis()
    .scale(x)
    // limit x-axis to integers only
    .tickFormat(function(e){
       if(Math.floor(e) != e)
         {return;}
       return e;
    });

  // specify y axis range
  var y = d3.scale.linear()
    .domain(d3.extent(alignmentData, similarityFn))
    .range([h-15, 15]);

  // draw y axis
  var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
 
  // specify time axis range
  var time = d3.scale.linear()
    .range([15, w+margin.right+margin.left-35])
    .domain(d3.extent(bookendYearData));

  // draw time axis
  var timeAxis = d3.svg.axis()
    .scale(time)
    // format years to remove comma from label
    .tickFormat(d3.format("d"));

  // update x and y axes and build time axis
  xAxisGroup.call(xAxis); 
  yAxisGroup.call(yAxis);  

  //////////////////////////
  // scatterpoint circles //
  //////////////////////////

  // perform data join to append new data points
  // to old data points (if any) 
  var circles = svg.selectAll(".scatterPoint")
    .data(alignmentData, dataKey);

  // update: update old data points (if any)
  circles.transition()
    .attr("similarId", function(d) { return d.similarId})
    .attr("similarSegment", function(d) { return d.similarSegment })
    .attr("similarity", function(d) { return d.similarity})
    .attr("cx", function(d) { return x(segmentFn(d)) + margin.left })
    .attr("cy", function(d) { return y(similarityFn(d)) + margin.top })
    .attr("stroke", function(d) {return colors(d.similarId)});

  // enter: append new data points (if any)
  circles.enter()
    .append("circle")
    .attr("class", "scatterPoint")
    .attr("similarId", function(d) { return d.similarId})
    .attr("similarSegment", function(d) { return d.similarSegment })
    .attr("r", 4)
    .attr("similarity", function(d) { return d.similarity})
    .attr("style", "cursor: pointer;")
    .attr("stroke", function(d) {return colors(d.similarId)})
    .on("click", function(d) {
      updateText(d)
    })   
  .transition()
    .duration(500)
    .attr("cx", function(d) { return x(segmentFn(d)) + margin.left })
    .attr("cy", function(d) { return y(similarityFn(d)) + margin.top })
 
  // exit: remove unnecessary data points (if any)
  circles.exit()
    .remove();

  //////////////////////////////
  // legend points and labels //
  //////////////////////////////

  // retrieve one observation of each similarId
  var uniqueIds = uniquify(alignmentData);

  var legends = svg.selectAll(".legend")
    .data(uniqueIds, dataKey); 

  // there's nothing to update
  legends.transition();

  legends.enter()
    .append('g') 
    .attr("class", "legend")                                
    .each(function(d, i) {
      var g = d3.select(this);
      g.append("svg:circle")
        .attr("cx", w + margin.left + 24)
        .attr("cy", 20*i+15 + margin.top)
        .attr("r", 4)
        .style("stroke", function(d){return colors(d.similarId)});
        
      g.append("text")
        .attr("x", w + margin.left + 32)
        .attr("y", 20*i + 20 + margin.top)
        .attr("height",20)
        .attr("width",60)
        .style("fill", "#000000")
        .text(function(d){return d.similarTitle});
    });

  legends.exit()
    .remove();

  ///////////////
  // time axis //
  ///////////////

  // add bookend years to the time axis 
  var yearLabels = bookendYearData;
  // add one year label for each plotted point
  for (i = 0; i < uniqueIds.length; i++) {
    yearLabels.push(uniqueIds[i].similarYear);
  };
  timeAxis.tickValues(yearLabels);
  timeAxisGroup.call(timeAxis);

  // append circles to time axis
  var timePoints = svg.selectAll(".timePoint")
    .data(uniqueIds, dataKey);

  timePoints.transition()
    .attr("cx", function(d) { return time(d.similarYear) + timeMargin.left});
    
  timePoints.enter()
    .append("circle")
    .attr("class","timePoint") 
    .attr('r', 4 )
    .attr('cx', function(d) { return time(d.similarYear) + timeMargin.left})
    .attr('cy', function(d) { return timeMargin.top })
    .attr('stroke', function(d) { return colors(d.similarId) });

  timePoints.exit()
    .remove();

  // rotate the year labels on the time axis
  d3.select(".time").selectAll("text")
    .attr("x", 23)
    .attr("y", -10)
    .style("font-size", "12.5")
    .style("font-weight", "normal")
    .attr("transform", "rotate(-65)" );
};



////////////////////////////
// initialize corpus plot //
////////////////////////////

var initializeCorpusPlot = function() {

  // specify plot size and margins
  var margin = {top: 0, right: 70, left: 70, bottom: 50};   
  var w = 900 - margin.left - margin.right;
  var h = 500 - margin.top - margin.bottom;

  // attach the plot to the corpusplot div
  var svg = d3.select("#corpusPlot").append("svg")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom);

  // add rectangle in which plot will be created 
  svg.append("rect")
    .attr("id", "plotBox")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("height", h)
    .attr("width", w)
    .attr("stroke", "#c4c4c4")
    .attr("stroke-width", 1)
    .attr("fill", "#F7F7F7");

  // add a label to the x axis
  svg.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "end")
      .attr("x", (w+margin.left+margin.right)/2 + 10)
      .attr("y", h + margin.top + margin.bottom - 3)
      .style("font-size", "12.5")
      .style("font-weight", "normal")
      .text("Year");

  // append x axis to DOM
  var xAxisGroup = svg.append("g")
    .attr("class","x axis")
    .attr("transform", "translate(" + margin.left + 
      "," + (h+margin.top) + ")");

  // add a label to the y axis
  svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 3)
    .attr("x", -((h+margin.top+margin.bottom)/2) +75)
    .attr("dy", ".75em")
    .style("font-size", "12.5")
    .style("font-weight", "normal")
    .attr("transform", "rotate(-90)")
    .text("Aggregate Similarity");

  // append y axis to DOM
  var yAxisGroup = svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + margin.left +
       "," + margin.top + ")");

  // add jQuery listeners to buttons: on click 
  // call data transformation
  $("#influential").click( function() {
    d3.json("json/influence.json", function(error, json) {
      if (error) return console.warn(error);
      updateCorpusPlot(json, "similarityLater");
    });
  });

  $("#imitative").click( function() {
    // remove the active state of the similarityAll button
    $("#influential").removeClass("active");
    // make call for json data and update plot
    d3.json("json/influence.json", function(error, json) {
      if (error) return console.warn(error);
      updateCorpusPlot(json, "similarityEarlier");
    });
  });

  // use jQuery to click the selectAll button
  // in order to initlize the plot
  $("#influential").trigger("click");

  // set the button's state to active
  $("#influential").toggleClass("active"); 
};

//////////////////////
// make scatterplot //
//////////////////////

var updateCorpusPlot = function(data, similarityKey) {

  // specify plot size and margins
  var margin = {top: 0, right: 70, left: 70, bottom: 50};   
  var w = 900 - margin.left - margin.right;
  var h = 500 - margin.top - margin.bottom;

  var svg = d3.select("#corpusPlot").select("svg");

  // specify x axis range
  var x = d3.scale.linear()
    .domain(d3.extent(data, function(d) {return d.year}))
    .range([15, w-15]);

  // draw x axis
  var xAxis = d3.svg.axis()
    .scale(x)
    .tickFormat(d3.format("d"));

  // specify y axis range
  var y = d3.scale.linear()
    .domain(d3.extent(data, function(d) {return d[similarityKey]}))
    .range([h-15, 15]);

  // draw y axis
  var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");
         
  // update y axis label according to plot type
  if (similarityKey == "similarityLater") {
    d3.select("#corpusPlot").select(".y.label")
      .text("Similarity to later poems");
  } else if (similarityKey == "similarityEarlier") {
    d3.select("#corpusPlot").select(".y.label")
      .text("Similarity to earlier poems");
  };

  // specify color scheme
  var colors = d3.scale.category20();

    // draw x and y axes
  d3.select("#corpusPlot").select(".y.axis")
    .transition()
    .duration(1000)
    .call(yAxis);

  d3.select("#corpusPlot").select(".x.axis")
    .call(xAxis);

  /////////////////////////
  // scatterplot circles //
  /////////////////////////

  // create tooltip for mouseover activity
  var tooltip = d3.select("#corpusPlot").append("div")
    .attr("class", "tooltip")
    .style("opacity", 1);

  // perform data join to append new data points
  // to old data points (if any) 
  var circles = svg.selectAll(".scatterPoint")
    .data(data);

  // update: update old data points (if any)
  circles.transition()
    .duration(500)
    .attr("cx", function(d) { return x(d.year) + margin.left})
    .attr("cy", function(d) { return y(d[similarityKey]) + margin.top })
    .attr("stroke", function(d) {return colors(d.year)});

  // enter: append new data points (if any)
  circles.enter()
    .append("circle")
    .attr("class", "scatterPoint")
    .attr("r", 4)
    .attr("style", "cursor: pointer;")
    .attr("stroke", function(d) {return colors(d.year)})
    .attr("title", function(d) {return d.title})
    // on click of elements, run search in passage plot 
    // and scroll to passage plot  
    .on("click", function(d) {
      // make call to update the plot
      callPassagePlot(d.id, d.title);
       
    })   
  .transition()
    .duration(500)
    .attr("cx", function(d) { return x(d.year) + margin.left })
    .attr("cy", function(d) { return y(d[similarityKey]) + margin.top });

  circles.exit()
    .remove();

  // add tooltip
  $("circle.scatterPoint").tooltip({
      'container': 'body',
      'placement': 'right'
  });
};

// initialize the plot, which will in turn set the inital
// data display
initializeCorpusPlot();

// initialize passage plot with the first record
initializePassagePlot();

