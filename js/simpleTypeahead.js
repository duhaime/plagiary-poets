var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substringRegex;

    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str['name'])) {
        matches.push(str);
      }
    });

    cb(matches);
  };
};


var initializePassageTypeahead = function (sourceId) {
  $.getJSON( "json/dropdown.json", function( jsonResponse ) {
    dropdownJson = jsonResponse;
    var corpusRecords = [];
    $.each(jsonResponse, function (key, value) {
      corpusRecords.push(value);
    });

    // apply substring matcher to dataset     
    $('#scrollable-dropdown-menu .typeahead').typeahead(null, {
        hint: true,
        highlight: true,
        minLength: 1,
        name: 'passage-plot-typeahead',
        limit: 15,
        source: substringMatcher(corpusRecords),
        displayKey: 'name',
        updater:function (item) {
          console.log(item);
        }

    });

    // Set the first text's title as the initial typeahead value
    $('.typeahead').typeahead('val', corpusRecords[0].name); 
  });
};

var addPassageTypeaheadListener = function () {

  // get user selected value
  $('#scrollable-dropdown-menu').on(
    {
       'typeahead:selected': function(e, datum) {
       console.log(datum.id); 
       callPassagePlot(datum.id); 
     },
       'typeahead:autocompleted': function(e, datum) {
       console.log(datum.id);
       callPassagePlot(datum.id);  
     }
  });
};
