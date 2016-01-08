// this script visualizes text reuse, using
// json from an ANN algorithm contained in
// /utils/. For more information, see:
// https://github.com/duhaime/visualizing-text-reuse


console.log("43");


// function that makes the plotting call
var makePlotCall = function(sourceId){
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

  // on initial plot call, remove corpus plot svg
  d3.select("#corpus-plot").select("svg")
    .remove();

  d3.select("#passage-plot").html(
    '<div id="textSelectorContainer">' +
      '<div id="scrollable-dropdown-menu" class="center">' +
        '<input class="typeahead" type="text" placeholder="Texts in corpus">' +
      '</div>' +
    '</div>' +
    '<div id="passagePlot" style="text-align: center;"></div>' +
    '<div id="textContainer">' +
      '<div class="textBox">' +
        '<h4 id="titleLeft"><p style="font-weight:normal;"></p></h4>' +
        '<p class="textBox" id="textLeft"></p>' +
      '</div>' +
      '<div class="textBox">' +
        '<h4 id="titleRight"></h4>' +
        '<p class="textBox" id="textRight"></p>' +
      '</div>' +
    '</div>' 
  );

  // width and height for the scatter plot and time axis
  var margin = {top: 70, right: 420, left: 70, bottom: 50};   
  var timeMargin = {top:40, right: 0, left: 5, bottom: 0};
  var w = 1200 - margin.left - margin.right;
  var h = 640 - margin.top - margin.bottom;

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
};


// function to pass data into plot and update plot
var updatePassagePlot = function(data) {

  // split data into two components
  bookendYearData = data.bookendYears.slice();
  alignmentData = data.alignments.slice();

  // specify color scheme
  var colors = d3.scale.category20();

  // reset text in the textBox
  resetText();

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

console.log("OK");

