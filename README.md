### Overview

This repository contains source code for <a href="http://plagiarypoets.io">plagiarypoets.io</a>, a single page web application that visualizes patterns in text reuse within early poetry. The application draws upon the following libraries:

* <a href="http://getbootstrap.com/">Bootstrap</a> for responsive design
* <a href="https://twitter.github.io/typeahead.js/">Typeahead.js</a> for search functionality and one way data binding 
* <a href="http://d3js.org/">D3.js</a> for interactive data visualization
* <a href="https://github.com/spotify/annoy">Approximate Nearest Neighbors Oh Yeah!</a> for Approximate Nearest Neighbors search
* <a href="https://jquery.com/">jQuery</a> for DOM manipulation 

### Directory Structure

The directory structure is as follows:

<pre><code>.
├── css           # Styles for application components
├── font-awesome  # Font awesome vendor library 
├── fonts         # Glyphicon assets
├── img           # Image files
├── js            # Application-wide JavaScript utilities
├── less          # Variable-driven less files
├── utils         # Python utilities for model creation
└── CNAME         # CNAME record for domain specification 
└── LICENSE       # Directory license
└── config.json   # Configuration file for utilities in utils
└── index.html    # Compiled index view
└── README.md</code></pre>
