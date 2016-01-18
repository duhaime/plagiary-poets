// this script visualizes text reuse, using
// json from an ANN algorithm contained in
// ../utils/ . For more information, see:
// https://github.com/duhaime/visualizing-text-reuse


//////////////////////////////////
// corpus plot helper functions //
//////////////////////////////////

// function that adds smooth scrolling to svg links
var svgLinkScroll = function (){
  $('html,body').animate({
  scrollTop: $('#passage-plot').offset().top
  }, 1500, 'easeInOutExpo');
  return false;
};


// add listener that sets active class on button click
// and removes active class from button siblings
$("#buttonContainer").find(".btn").click(function(){
  $(this).addClass("active").siblings().removeClass("active");
});


// return the viewport size and device class 
// so that the corpus plot can be properly sized
var findCorpusPlotSize = function (){
  // retrieve size of device width in pixels
  var width = window.innerWidth;

  // use conditional formatting in case of mobile or web
  if (width < 480) {
    var device = "mobile";
    var margin = {top: 0, right: 30, 
        left: 40, bottom: 40};
    w = width - margin.left - margin.right;
    h = width*.65 - margin.top - margin.bottom;   
  } else {
    var device = "web";
    var margin = {top: 0, right: 30, left: 60, bottom: 50};
    var w = width*.7 - margin.left - margin.right;
    var h = width*.45 - margin.top - margin.bottom; 
  };

  return [device, margin, w, h];
};


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
  } else {
    var device = "web";
  } 

  ///////////////////
  // mobile design //
  ///////////////////

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
    .attr("width", plotWidth + plotMargin.left + plotMargin.right)
    .attr("height", plotHeight + plotMargin.top + plotMargin.bottom)
    .attr("id", "passagePlotSvg");

  // select a subregion of the svg to create a dropbox
  var graphBox = svg.append("rect")
    .attr("id", "graphBox")
    .attr("x", plotMargin.left)
    .attr("y", plotMargin.top)
    .attr("height", plotHeight)
    .attr("width", plotWidth)
    .attr("stroke", "#c4c4c4")
    .attr("stroke-width", 1)
    .attr("fill", "#ffffff");

  // append x axis to DOM
  var xAxisGroup = svg.append("g")
    .attr("class","x axis")
    .attr("transform", "translate(" + plotMargin.left + 
      "," + (plotHeight + plotMargin.top) + ")")
    .style("font-size", fontSize);

  // add a label to the x axis
  xAxisLabel = svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", plotWidth * .8 )
    .attr("y", plotHeight + plotMargin.top + plotMargin.bottom -5)
    .style("font-size", fontSize)
    .style("font-weight", "normal")
    .text("Passage in selected text");
        
  // append y axis to DOM
  var yAxisGroup = svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + plotMargin.left +
       "," + plotMargin.top + ")")
    .style("font-size", fontSize);

  // add a label to the y axis
  svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 1)
    .attr("x", -(plotHeight + plotMargin.top) * .35) 
    .attr("dy", ".75em")
    .style("font-size", fontSize)
    .style("font-weight", "normal")
    .attr("transform", "rotate(-90)")
    .text("Passage similarity");

  // append time axis SVG to DOM
  var timelineSvg = d3.select("#passageTimeLine").append("svg:svg")
    .attr("width", timeWidth + timeMargin.left + timeMargin.right)
    .attr("height", timeHeight + timeMargin.top + timeMargin.bottom);

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
  callPassagePlot(0);
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
    .attr("x", plotWidth * .8 )
    .attr("y", plotHeight + plotMargin.top + plotMargin.bottom -5)
    .style("font-size", fontSize);

  d3.select("#passagePlot").select(".y.axis")
    .attr("transform", "translate(" + plotMargin.left +
       "," + plotMargin.top + ")")
    .style("font-size", fontSize);

  d3.select("#passagePlot").select(".y.label")
    .attr("y", 1)
    .attr("x", -(plotHeight + plotMargin.top) * .35)
    .style("font-size", fontSize);

  d3.select("#passageTimeLine").select("svg")
    .attr("width", timeWidth + timeMargin.left + timeMargin.right)
    .attr("height", timeHeight + timeMargin.top + timeMargin.bottom);

  d3.select("#passageTimeLine").select(".time")
    .attr("transform", "translate(" + 
        (timeMargin.left) + 
        "," + (timeMargin.top) + ")");


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
        .style("stroke", function(d){return colors(d.similarId)});
        
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


////////////////////////////
// initialize corpus plot //
////////////////////////////

// read in a selected button ("#influential" or "#imitative")
// and initialize the corpus plot for that view
var initializeCorpusPlot = function(selectedButton) {

  // specify plot size and margins
  var corpusSizeVals = findCorpusPlotSize();
  var device = corpusSizeVals[0];
  var margin = corpusSizeVals[1];
  var w = corpusSizeVals[2];
  var h = corpusSizeVals[3];

  // use device to set axis label font size
  if (device == "mobile") {
    var fontSize = 10;
  } else {
    var fontSize = 12.5;
  };

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
    .style("font-size", '"' + fontSize + '"')
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
    .attr("y", 0)
    .attr("x", -((h+margin.top+margin.bottom)/2) +75)
    .attr("dy", ".75em")
    .style("font-size", '"' + fontSize + '"')
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
    // make call for json data and update plot
    d3.json("json/influence.json", function(error, json) {
      if (error) return console.warn(error);
      updateCorpusPlot(json, "similarityEarlier");
    });
  });

  // click the influential button to start corpus plot on "influential"
  $(selectedButton).trigger("click");

};

////////////////////////
// update corpus plot //
////////////////////////

var updateCorpusPlot = function(data, similarityKey) {

  // specify plot size and margins
  var corpusSizeVals = findCorpusPlotSize();
  var device = corpusSizeVals[0];
  var margin = corpusSizeVals[1];
  var w = corpusSizeVals[2];
  var h = corpusSizeVals[3];

  // use the device to determine the number of ticks
  // and the size of circles
  if (device == "mobile") {
    var xTickNum = 7;
    var yTickNum = 5;
    var circleSize = 3;
    var fontSize = 8;
  } else {
    var xTickNum = 12;
    var yTickNum = 12;
    var circleSize = 4;
    var fontSize = 12.5;
  } 

  /////////////////
  // resize plot //
  /////////////////

  // update the svg size with current viewbox w and h 
  var svg = d3.select("#corpusPlot").select("svg")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom);

  // update the rectangle size with current viewbox w and h
  d3.select("#corpusPlot").select("rect")
    .attr("width", w)
    .attr("height", h);

  // update x and y axis labels
  d3.select(".x.label")
    .attr("x", (w+margin.left+margin.right)/2 + 10)
    .attr("y", h + margin.top + margin.bottom - 3);

  d3.select(".y.label")
    .attr("x", -((h+margin.top+margin.bottom)/2) +75)
    .attr("y", 0);

  // update x and y axes
  d3.select(".y.axis")
    .attr("transform", "translate(" + margin.left +
       "," + margin.top + ")");

  d3.select(".x.axis")
    .attr("transform", "translate(" + margin.left + 
      "," + (h+margin.top) + ")");

  ///////////////////////
  // draw new elements //
  ///////////////////////

  // specify x axis range
  var x = d3.scale.linear()
    .domain(d3.extent(data, function(d) {return d.year}))
    .range([15, w-15]);

  // draw x axis
  var xAxis = d3.svg.axis()
    .scale(x)
    .ticks(xTickNum)
    .tickFormat(d3.format("d"));

  // specify y axis range
  var y = d3.scale.linear()
    .domain(d3.extent(data, function(d) {return d[similarityKey]}))
    .range([h-15, 15]);

  // draw y axis
  var yAxis = d3.svg.axis()
    .scale(y)
    .ticks(yTickNum)
    .orient("left");
         
  // update y axis label according to plot type
  if (similarityKey == "similarityLater") {
    d3.select("#corpusPlot").select(".y.label")
      .text("Similarity to later poems");
  } else if (similarityKey == "similarityEarlier") {
    d3.select("#corpusPlot").select(".y.label")
      .text("Similarity to earlier poems");
  };

  // create lack and white color range with domain of similarity values
  var colors = d3.scale.linear()
    .domain(d3.extent(data, function(d) {return d[similarityKey]}))
    .interpolate(d3.interpolateHcl)  
    .range([d3.rgb("#FFF500"), d3.rgb("#007AFF")]);

  // draw x and y axes
  d3.select("#corpusPlot").select(".y.axis")
    .transition()
    .duration(1000)
    .call(yAxis);

  d3.select("#corpusPlot").select(".x.axis")
    .call(xAxis);

  // set the font size of the x and y axis numerical labels
  d3.select("#corpusPlot").selectAll(".axis").selectAll(".tick")
    .style("font-size", fontSize);


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
    .attr("stroke", function(d) {return colors(d[similarityKey])});

  // enter: append new data points (if any)
  var circlesEnter = circles.enter().append("circle")      
    .attr("class", "scatterPoint")
    .attr("r", circleSize)
    .attr("style", "cursor: pointer;")
    .attr("stroke", function(d) {return colors(d[similarityKey])})
    .attr("title", function(d) {return d.title})
    .on("click", function(d) {
      // make call to update the plot
      svgLinkScroll();
      callPassagePlot(d.id); 
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

// initialize the corpus plot with a synthetic click on "#influential" button
initializeCorpusPlot("#influential");

// initialize passage plot with the first record
initializePassagePlot();
