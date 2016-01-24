// this script visualizes text reuse, using
// json from an ANN algorithm contained in
// ../utils/ . For more information, see:
// https://github.com/duhaime/visualizing-text-reuse


///////////////////////////////////
// passage plot helper functions //
///////////////////////////////////

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
  d3.select("#titleLeft").html(d.sourceTitle);
  d3.select("#titleRight").html(d.similarTitle);

  segmentsDir = "json/segments/";
  sourceSegmentsFile = "segments_" + d.sourceId + ".json";
  sourceSegmentsPath = segmentsDir + sourceSegmentsFile;  

  d3.json(sourceSegmentsPath, function(error, json) {
    if (error) return console.warn(error);
    var leftContent = json[d["sourceSegment"]];
    d3.select("#textLeft").html(leftContent);    
  });

  similarSegmentsFile = "segments_" + d.similarId + ".json"; 
  similarSegmentsPath = segmentsDir + similarSegmentsFile;
 
  d3.json(similarSegmentsPath, function(error, json) {
    if (error) return console.warn(error);
    var rightContent = json[d["similarSegment"]];
    d3.select("#textRight").html(rightContent);    
  });
};


// function to reset text upon new json selection
var resetText = function() { 
  d3.select("#titleLeft").html("");
  d3.select("#titleRight").html("");
  d3.select("#textLeft").html("");
  d3.select("#textRight").html("");
}; 


// use the waitUntilExists function to wait until .tt-input
// exists, then populate the input with the provided text title
var populateTypeahead = function(desiredValue) {
  // if the typeahead is already present, call it
  $(".tt-input").val(desiredValue);
  // otherwise wait for the typeahead to become present before calling
  $(".tt-input").waitUntilExists( function() {
    $(".tt-input").val(desiredValue);
  });
};


// plotting helper functions
var similarityFn = function(d) { return d.similarity }
var segmentFn = function(d) { return d.sourceSegment }


// specify a key function
var dataKey = function(d) {
  return d.sourceId + "." + d.similarId + "." + d.similarity;
};


// return the viewport size and device class 
// so that the passage plot can be properly sized
var findPassagePlotSize = function (){
  // retrieve size of device width in pixels
  var deviceWidth = window.innerWidth;

  // use conditional formatting in case of mobile or web
  if (deviceWidth < 480) {
    var device = "mobile";

    // set the time axis size as a function of its parent's size
    var timelineDivWidth = $("#passageTimeLine").width();
    var timeMargin = {top: 50, 
        right: 15, left: 2, bottom: 0};
    var timeWidth = timelineDivWidth - timeMargin.left - timeMargin.right;
    var timeHeight = 60 - timeMargin.top - timeMargin.bottom;

    // set the size of the passage plot and legend plots 
    // as a function of their parents' size
    var passagePlotDivWidth = $("#passagePlot").width();
    var plotMargin = {top: 10, right: 5, left: 35, 
        bottom: 35};   
    var plotWidth = passagePlotDivWidth - plotMargin.left - plotMargin.right;
    var plotHeight = .75*passagePlotDivWidth - plotMargin.top - plotMargin.bottom; 
    var fontSize = "8px";

  } else {
    var device = "web";

    // set the time axis size as a function of its parent's size
    var timelineDivWidth = $("#passageTimeLine").width();
    var timeMargin = {top: 50, 
        right: 15, left: 2, bottom: 0};
    var timeWidth = timelineDivWidth - timeMargin.left - timeMargin.right;
    var timeHeight = 60 - timeMargin.top - timeMargin.bottom;

    // set the size of the passage plot and legend plots 
    // as a function of their parents' size
    var passagePlotDivWidth = $("#passagePlot").width();
    var plotMargin = {top: 10, right: 0, left: 50, 
        bottom: 45};   
    var plotWidth = passagePlotDivWidth - plotMargin.left - plotMargin.right;
    var plotHeight = .75*passagePlotDivWidth - plotMargin.top - plotMargin.bottom; 
    var fontSize = "12.5px";
  } 

  return [device, plotMargin, plotWidth, plotHeight, 
      timeMargin, timeWidth, timeHeight, fontSize];
};


// add listener to redraw plots on screen resize
d3.select(window).on('resize', function() {

  // determine whether similarityLater or similarityEarlier 
  // is selected in the corpus plot
  var selectedButtonId = $("#buttonContainer").find(".active")[0].id;
  if (selectedButtonId == "influential") {
    var similaritySelected = "similarityLater";
  } else {
    var similaritySelected = "similarityEarlier";
  };

  // make call to update corpus plot, using json 
  // for the currently selected button 
  d3.json("json/influence.json", function(error, json) {
    if (error) return console.warn(error);
    updateCorpusPlot(json, similaritySelected);
  });

  // determine which text is currently selected in 
  // the typeahead for the passage plot
  var selectedId = $("#scrollable-dropdown-menu")
    .data("selected-text-id");

  // redraw the plot using the selected text id
  callPassagePlot(selectedId);

});



/////////////////////////////
// initialize passage plot //
/////////////////////////////

// initialize plot by appending required assets to DOM
var initializePassagePlot = function() {

  // initialize the typeahead dropdown
  initializePassageTypeahead();
  addPassageTypeaheadListener();

  var passageSizeVals = findPassagePlotSize();
  var device = passageSizeVals[0];
  var plotMargin = passageSizeVals[1];
  var plotWidth = passageSizeVals[2];
  var plotHeight = passageSizeVals[3];
  var timeMargin = passageSizeVals[4];
  var timeWidth = passageSizeVals[5];
  var timeHeight = passageSizeVals[6];
  var fontSize = passageSizeVals[7];

  // draw the svg
  var svg = d3.select("#passagePlot").append("svg:svg")
    .attr("id", "passagePlotSvg");

  // select a subregion of the svg to create a dropbox
  var graphBox = svg.append("rect")
    .attr("id", "graphBox")
    .attr("x", plotMargin.left)
    .attr("y", plotMargin.top)
    .attr("stroke", "#c4c4c4")
    .attr("stroke-width", 1)
    .attr("fill", "#ffffff");

  // append x axis to DOM
  var xAxisGroup = svg.append("g")
    .attr("class","x axis")
    .attr("transform", "translate(" + plotMargin.left + 
      "," + (plotHeight + plotMargin.top) + ")");

  // add a label to the x axis
  xAxisLabel = svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", plotWidth * .8 )
    .attr("y", plotHeight + plotMargin.top + plotMargin.bottom -5)
    .style("font-weight", "normal")
    .text("Passage in selected text");
        
  // append y axis to DOM
  var yAxisGroup = svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + plotMargin.left +
       "," + plotMargin.top + ")");

  // add a label to the y axis
  svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 1)
    .attr("x", -(plotHeight + plotMargin.top) * .35) 
    .attr("dy", ".75em")
    .style("font-weight", "normal")
    .attr("transform", "rotate(-90)")
    .text("Passage similarity");

  // append time axis SVG to DOM
  var timelineSvg = d3.select("#passageTimeLine").append("svg:svg");

  timelineSvg.append("g")
    .attr("class", "time")
    .attr("transform", "translate(" + 
        (timeMargin.left) + 
        "," + (timeMargin.top) + ")");

  // append passage legend svg to DOM
  d3.select("#passageLegend").append("svg:svg")
    .attr("id", "passageLegendSvg");

  // create plot using source Id for 
  // the initial view
  callPassagePlot(2201);
};


/////////////////////////
// update passage plot //
/////////////////////////

// function to pass data into plot and update plot
var updatePassagePlot = function(data) {

  var passageSizeVals = findPassagePlotSize();
  var device = passageSizeVals[0];
  var plotMargin = passageSizeVals[1];
  var plotWidth = passageSizeVals[2];
  var plotHeight = passageSizeVals[3];
  var timeMargin = passageSizeVals[4];
  var timeWidth = passageSizeVals[5];
  var timeHeight = passageSizeVals[6];
  var fontSize = passageSizeVals[7];

  // identify divs we've already appended to DOM
  var xAxisGroup = d3.select("#passagePlot").select(".x.axis");
  var yAxisGroup = d3.select("#passagePlot").select(".y.axis");
  var timeAxisGroup = d3.select("#passageTimeLine").select(".time");
  var svg = d3.select("#passagePlot").select("#passagePlotSvg");

  //////////////////
  // update sizes //
  //////////////////

  svg.attr("width", plotWidth + plotMargin.left + plotMargin.right)
    .attr("height", plotHeight + plotMargin.top + plotMargin.bottom);

  d3.select("#passagePlot").select("#graphBox")
    .attr("x", plotMargin.left)
    .attr("y", plotMargin.top)
    .attr("height", plotHeight)
    .attr("width", plotWidth);

  d3.select("#passagePlot").select(".x.axis")
    .attr("transform", "translate(" + plotMargin.left + 
      "," + (plotHeight + plotMargin.top) + ")")
    .style("font-size", fontSize);

  d3.select("#passagePlot").select(".x.label")
    .attr("x", plotMargin.left + plotWidth*.5)
    .attr("y", plotHeight + plotMargin.top + plotMargin.bottom -5)
    .style("font-size", '"' + fontSize + '"')
    .style("text-anchor", "middle");

  d3.select("#passagePlot").select(".y.axis")
    .attr("transform", "translate(" + plotMargin.left +
       "," + plotMargin.top + ")")
    .style("font-size", fontSize);

  d3.select("#passagePlot").select(".y.label")
    .attr("y", 1)
    .attr("x", -( (plotHeight*0.5) + plotMargin.top) )
    .style("font-size", '"' + fontSize + '"')
    .style("text-anchor", "middle");

  d3.select("#passageTimeLine").select("svg")
    .attr("width", timeWidth + timeMargin.left + timeMargin.right)
    .attr("height", timeHeight + timeMargin.top + timeMargin.bottom);

  d3.select("#passageTimeLine").select(".time")
    .attr("transform", "translate(" + 
        (timeMargin.left) + 
        "," + (timeMargin.top) + ")");

  // append passage legend svg to DOM
  d3.select("#passageLegend").select("svg")
    .attr("width", window.innerWidth)
    .attr("height", plotHeight +plotMargin.top +plotMargin.bottom);


  ///////////////////
  // draw elements //
  ///////////////////

  var colors = d3.scale.category20();

  // reset text in the textBox
  resetText();

  // split data into two components
  bookendYearData = data.bookendYears.slice();
  alignmentData = data.alignments.slice();

  // set value of typeahead to selected text's title
  populateTypeahead(alignmentData[0].sourceTitle);

  // persist the id of the selected text within the typeahead
  // to maintain state of the chosen text
  $("#scrollable-dropdown-menu")
    .data("selected-text-id", alignmentData[0].sourceId);

  // specify x axis range
  var x = d3.scale.linear()
    .domain(d3.extent(alignmentData, segmentFn))
    .range([15, plotWidth-15]);

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
    .domain([0,1])
    .range([plotHeight-15, 15]);

  // draw y axis
  var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");
 
  // specify time axis range
  var time = d3.scale.linear()
    .range([timeMargin.left, timeWidth + timeMargin.left])
    .domain(d3.extent(bookendYearData));

  // draw time axis
  var timeAxis = d3.svg.axis()
    .scale(time)
    // format years to remove comma from label
    .tickFormat(d3.format("d"));

  // update x and y axes
  d3.select("#passagePlot").select(".y.axis")
    .transition()
    .duration(1000)
    .call(yAxis);

  d3.select("#passagePlot").select(".x.axis")
    .transition()
    .duration(1000)
    .call(xAxis);

  //////////////////////////
  // scatterpoint circles //
  //////////////////////////

  // perform data join to append new data points
  // to old data points (if any) 
  var circles = svg.selectAll(".scatterPoint")
    .data(alignmentData, dataKey);

  // update: update old data points (if any)
  circles.transition()
    .duration(500)
    .attr("similarId", function(d) { return d.similarId})
    .attr("similarSegment", function(d) { return d.similarSegment })
    .attr("similarity", function(d) { return d.similarity})
    .attr("cx", function(d) { return x(segmentFn(d)) + plotMargin.left })
    .attr("cy", function(d) { return y(similarityFn(d)) + plotMargin.top })
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
    .attr("cx", function(d) { return x(segmentFn(d)) + plotMargin.left })
    .attr("cy", function(d) { return y(similarityFn(d)) + plotMargin.top });
 
  // exit: remove unnecessary data points (if any)
  circles.exit()
    .remove();

  //////////////////////////////
  // legend points and labels //
  //////////////////////////////

  // retrieve one observation of each similarId
  var uniqueIds = uniquify(alignmentData);

  var legends = d3.select("#passageLegend").select("svg").selectAll(".legend")
    .data(uniqueIds, dataKey); 

  // there's nothing to update
  legends.transition();

  legends.enter()
    .append('g') 
    .attr("class", "legend")                                
    .each(function(d, i) {
      var g = d3.select(this);
      g.append("svg:circle")
        .attr("cx", 5)
        .attr("cy", 20*i+15)
        .attr("r", 4)
        .style("stroke", function(d){return colors(d.similarId)})
        .attr("class","legendCircle");
        
      g.append("text")
        .attr("x", 12)
        .attr("y", 20*i + 20)
        .attr("height",20)
        .attr("width",60)
        .style("fill", "#000000")
        .style("font-size", fontSize)
        .text(function(d){return d.similarTitle});
    });

  legends.exit()
    .remove();

  // resize legend so it occupies only as much vertical space as necessary
  var extantLegendCircles = d3.selectAll(".legendCircle")[0].length;
  d3.select("#passageLegendSvg")
    .attr("height", 20 * extantLegendCircles + 20);


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
  var timePoints = d3.select("#passageTimeLine").select(".time").selectAll(".timePoint")
   .data(uniqueIds, dataKey);

  timePoints.transition()
    .attr("cx", function(d) { return time(d.similarYear) + timeMargin.left});

  timePoints.enter()
    .append("circle")
    .attr("class","timePoint") 
    .attr('r', 4 )
    .attr('cx', function(d) { return time(d.similarYear) + timeMargin.left})
    .attr('stroke', function(d) { return colors(d.similarId) });

  timePoints.exit()
    .remove();

  // rotate the year labels on the time axis
  d3.select("#passageTimeLine").select(".time").selectAll("text")
    .attr("x", 23)
    .attr("y", -10)
    .style("font-size", fontSize)
    .style("font-weight", "normal")
    .attr("transform", "rotate(-65)" );
};

// initialize passage plot with the first record
initializePassagePlot();
