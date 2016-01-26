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
    var w = width*.6 - margin.left - margin.right;
    var h = width*.35 - margin.top - margin.bottom; 
  };

  return [device, margin, w, h];
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
    var fontSize = 8;
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
