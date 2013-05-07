// Require.js allows us to configure shortcut alias
// There usage will become more apparent futher along in the tutorial.
require.config({
  baseUrl : "js",
  paths: {
    jquery: 'libs/jquery/jquery-1.7.1.min',
    underscore: 'libs/underscore/underscore-min',
    backbone: 'libs/backbone/backbone-min',
    json2: 'libs/json2/json2',
    text: 'libs/require/text',
    d3: 'libs/d3/d3.AMD',
    sankey: 'libs/d3/d3.sankey.AMD',
    bootstrap: 'libs/bootstrap/js/bootstrap.min',
    VistaTooltip: 'libs/tideD3/VistaTooltip',
    VistaEjesXY: 'libs/tideD3/VistaEjesXY',
    VistaLoading: 'libs/tideD3/VistaLoading',
    templates: '../templates'
    
  },
  // shim - defines libraries that are not define as require modules (not containing "define")
  shim: {
    backbone: {
        deps: ["underscore", "jquery"],
        exports: "Backbone"
    },

    underscore: {
        exports: "_"
    },

    'bootstrap':{deps: ['jquery']}
  }
});


require([
	"app",
	], 
	function(App) {
		App.initialize();
	}
);

