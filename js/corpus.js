////////////////////////////
// initialize scatterplot //
////////////////////////////

var margin = {top: 0, right: 70, left: 70, bottom: 50};   
var w = 900 - margin.left - margin.right;
var h = 500 - margin.top - margin.bottom;

var initializeScatterplot = function() {

  // append the div to which we'll attach the plot
  d3.select("#plot").html(

    '<div id="buttonContainer" class="row text-center">' +
      '<p><b>Compare each document to</b>' +
        '<button type="button" class="btn btn-default"' + 
            'id="similarityAll" autofocus="true">All</button>' +
        '<button type="button" class="btn btn-default"' +
             'id="similarityEarlier">Earlier</button>' +
        '<button type="button" class="btn btn-default"' +
             'id="similarityLater">Later</button>' +
      '<b>works:</b>' +
      '</p>' +
    '</div>' +
    '<div id="corpusPlotContainer" class="text-center">' +
      '<div id="corpusPlot"></div>' +
    '</div>'
  );

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
    .text("Mean similarity");

  // add jQuery listeners to buttons: on click 
  // call data transformation
  $("#similarityAll").click( function() {
    d3.json("json/influence.json", function(error, json) {
      if (error) return console.warn(error);
      makeScatterplot(json, "similarityAll");
    });
  });

  $("#similarityEarlier").click( function() {
    d3.json("json/influence.json", function(error, json) {
      if (error) return console.warn(error);
      makeScatterplot(json, "similarityEarlier");
    });
  });

  $("#similarityLater").click( function() {
    d3.json("json/influence.json", function(error, json) {
      if (error) return console.warn(error);
      makeScatterplot(json, "similarityLater");
    });
  });

}

initializeScatterplot();

/////////////////////
// tooltip helpers //
/////////////////////

function getTextWidth(text, font) {
  // re-use canvas object for better performance
  var canvas = getTextWidth.canvas || (getTextWidth.canvas = 
        document.createElement("canvas"));
  var context = canvas.getContext("2d");
  context.font = font;
  var metrics = context.measureText(text);
  return metrics.width;
};

var fontSpec = "13pt Arial";


//////////////////////
// make scatterplot //
//////////////////////

var makeScatterplot = function(data, similarityKey) {

  var svg = d3.select("#corpusPlot").select("svg");

  // specify x axis range
  var x = d3.scale.linear()
    .range([15, w-15]);

  // draw x axis
  var xAxis = d3.svg.axis()
    .scale(x)
    .tickFormat(d3.format("d"));

  // append x axis to DOM
  var xAxisGroup = svg.append("g")
    .attr("class","x axis")
    .attr("transform", "translate(" + margin.left + 
      "," + (h+margin.top) + ")");

  // specify y axis range
  var y = d3.scale.linear()
    .range([h-15, 15]);

  // draw y axis
  var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");
         
  // append y axis to DOM
  var yAxisGroup = svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + margin.left +
       "," + margin.top + ")");

  // specify color scheme
  var colors = d3.scale.category20();

  // set domains for x, y, and time
  x.domain(d3.extent(data, function(d) {return d.year})); 
  y.domain(d3.extent(data, function(d) {return d[similarityKey]}));

  // draw x and y axes
  svg.select(".y.axis")
    .transition()
    .duration(1000)
    .call(yAxis);

  svg.select(".x.axis")
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

// initialize scatterplot with "similarityAll" data
d3.json("json/influence.json", function(error, json) {
  if (error) return console.warn(error);
  makeScatterplot(json, "similarityAll");
});




