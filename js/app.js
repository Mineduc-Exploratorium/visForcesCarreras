// Filename: app.js
define(["views/VistaPrincipal"], 
	function(VistaPrincipal) {
		var initialize = function() {
			vista = new VistaPrincipal({el:"#mainvisualization"});
		}

		return { 
			initialize: initialize
		};
	}
);
		
