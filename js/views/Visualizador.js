// template
define([
	'underscore',
	'backbone',
	'jquery',
	'd3',
	'sankey',
	'VistaTooltip',
	'VistaEjesXY'
	], function(_, Backbone,$, d3,d3sankey, VistaTooltip, VistaEjesXY){

	var Visualizador = Backbone.View.extend(
		/** @lends Visualizador.prototype */
		{

		/**
		* @class VistaPrincipal vista que despliega visualizacion de ingresos vs costos de carreras
		*
		* @augments Backbone.View
		* @constructs
		*
		* @param {object} options parametros de incializacion
		* @param {array} options.data arreglo con datos (cada dato es un objeto con atributos)
		* @param {d3.select()} options.svg elemento SVG utilizado como contenedor del gráfico
		* @param {Backbone.View} options.tooltip vista utilizada como tooltip
		* Visualizador Inicia parametros de configuración y llamada a datos
		*/
		initialize: function() {
			this.data = this.options && this.options.data ? this.options.data : [];

			// Binding de this (esta vista) al contexto de las funciones indicadas
			_.bindAll(this,"render", "tootipMessage")

			// Alias a this para ser utilizado en callback functions
			var self = this; 
			
			// Configuración de espacio de despliegue de contenido en pantalla
			this.margin = {top: 20, right: 20, bottom: 30, left: 20},
	    	this.width = 900 - this.margin.left - this.margin.right,
	    	this.height = 600 - this.margin.top - this.margin.bottom;

	   		this.color = d3.scale.category20c();

			// Vista con tooltip para mostrar datos del item respectivo
			this.tooltip = new VistaTooltip();
			this.tooltip.message = this.tootipMessage;

			this.color = d3.scale.category20();

			// append the svg canvas to the page
			this.svg = d3.select(this.el)
			    .attr("width", this.width + this.margin.left + this.margin.right)
			    .attr("height", this.height + this.margin.top + this.margin.bottom)
			  .append("g")
			    .attr("transform", 
			          "translate(" + this.margin.left + "," + this.margin.top + ")");


			this.render();
	 
		},

		/**
		* Reescribe función generador de mensajes utilizado en herramienta de tooltip
		* tooltip.tooltipMessage(data) 	
		*
		* @param {object} data objeto con atributos (Ej: {nombre: "Juan", Edad: 18}) utilizados en la creación del mensaje a desplegar por tooltip
		* @returns {string} Mensaje (html) a ser utilizado por tooltip
		*/
		tootipMessage : function(d) {
			var msg = "<span class='text-info'>"+d.name+"</span>";

			return msg;

		}, 

		/**
		* Despliegue inicial de elementos gráficos.
		*/
		render: function() {
			var self = this; // Auxiliar para referirse a this en funciones callback


			// Ordenar datos por tipo de acreditación
			var data = _.sortBy(this.data, function(d) {return d.ACREDITACION_CARRERA});		
			//var data = _.filter(data, function(d) {return d.TIPO_INSTITUCION == "UNIVERSIDAD ESTATAL"});	

			var nestedData = d3.nest()
			.key(function(d) { return "Chile"; })
			.key(function(d) { return d.TIPO_INSTITUCION; })
			.key(function(d) { return d.INSTITUCION; })
			.entries(data);

			var forceNodes = []
			var forceLinks = []

			var index = 0;

			var root = nestedData[0]

			var radious = d3.scale.sqrt()
				.range([2,20])
				.domain(d3.extent(this.data, function(d) {return parseInt(d.TOTAL_MATRICULADOS)}))

			var tree = d3.layout.tree()
				//.sort(null)
				.children(function(d) {return d.values });


			
			podaInicial(root);

			this.radious = d3.scale.sqrt()
				.range([3,50])
				.domain([0, root.total])


			// tree.nodes(root);
			
			var newnodes = flatten(nestedData[0]);

			var newlinks = tree.links(newnodes);





			// forceNodes[index] = {name:root.key, group:"Chile"}
			
			
			// var tipoUniversidades = root.values
			// rootIndex= index;
			// _.each(tipoUniversidades, function(tipoUniv, i) {
			// 	index++;
			// 	forceNodes[index] = {name:tipoUniv.key, group:tipoUniv.key};
			// 	tipoUnivIndex = index;
			// 	forceLinks.push({source:rootIndex, target: tipoUnivIndex, value:1})
			// 	var universidades = tipoUniv.values
			// 	_.each(universidades, function(univ, i) {
			// 		index++;
			// 		univIndex = index;
			// 		forceNodes[index] = {name: univ.key, group:tipoUniv.key, matricula: 1000};
			// 		forceLinks.push({source:tipoUnivIndex, target: univIndex, value:1})
			// 	})
			// });


			function podaInicial(root) {
			   var nodes = [], i = 0;

			   function recurse(node) {
			     if (node.values) {
			     	node.total =0;
			     	node.values.forEach(function(d) {
			     		node.total += recurse(d);
			     	});

			     } else {
			     	node.total = parseInt(node.TOTAL_MATRICULADOS);
			     }
			     if (!node.id) node.id = ++i;
			     if (!node.name) node.name = node.key;
			     if (!node.key) node.name = node.CARRERA;
			     if (node.values) {
			     	// node.children = node.values;
			     	node._values = node.values;
			     	node.values = null;
			     	node.children= nodes._values;
			     }
			     nodes.push(node);

			     return node.total;
			   }

			   recurse(root);
			   //return nodes;
			 }

			function flatten(root) {
			   var nodes = [], i = 0;

			   function recurse(node) {
			     if (node.values)  {
			     	node.values.forEach(recurse);
			     }
			     if (!node.id) node.id = ++i;
			     if (!node.radio && node._values) {

			     	node.radio = node._values.length;
			     	if(node.radio == 1) node.radio = 15;
			     }
			    			     
			     nodes.push(node);
			   }

			   recurse(root);
			   return nodes;
			 }

			 function update() {
			  
			  tree.nodes(root);
			  var nodes = flatten(root);
			  
			  var links = tree.links(nodes);


			  // Restart the force layout.
			  force
			      .nodes(nodes)
			      .links(links)
			      .start();

			  // Update the links…
			  link = self.svg.selectAll("line.link")
			      .data(links, function(d) { return d.target.id; });

			  // Enter any new links.
			  link.enter().insert("svg:line", ".node")
			      .attr("class", "link")
			      .attr("x1", function(d) { return d.source.x; })
			      .attr("y1", function(d) { return d.source.y; })
			      .attr("x2", function(d) { return d.target.x; })
			      .attr("y2", function(d) { return d.target.y; });

			  // Exit any old links.
			  link.exit().remove();

			  // Update the nodes…
			  node = self.svg.selectAll("circle.node")
			      .data(nodes, function(d) { return d.id; })
			      .style("fill", color);

			  // Enter any new nodes.
			  node.enter().append("svg:circle")
			      .attr("class", "node")
			      .attr("cx", function(d) { return d.x; })
			      .attr("cy", function(d) { return d.y; })
			      .attr("r", function(d) { return d.values ? 5 : self.radious(d.total) })
			      .style("fill", function(d) { return color(d.depth); })
			      .on("click", click)
			      .call(force.drag);

			    node
			      .attr("r", function(d) { return d.values ? 10 : self.radious(d.total) })
			       .style("fill", function(d) { return d.values ? "blue" :  color(d.depth)})

				node.on("mouseover", function(d) {
							self.tooltip.show(d)}
							)
					.on("mouseout", function(d) {self.tooltip.hide()})

				force.on("tick", function() {
				link.attr("x1", function(d) { return d.source.x; })
				    .attr("y1", function(d) { return d.source.y; })
				    .attr("x2", function(d) { return d.target.x; })
				    .attr("y2", function(d) { return d.target.y; });

				node.attr("cx", function(d) { return d.x; })
				    .attr("cy", function(d) { return d.y; });
				});


			  // Exit any old nodes.
			  node.exit().remove();
			}


			// Toggle children on click.
			function click(d) {
			  if (d.values) {
			    d._values = d.values;
			    d.values = null;
			  } else {
			    d.values = d._values;
			    d._values = null;
			  }

			  if (d.children) {
			    d._children = d.children;
			    d.children = null;
			  } else {
			    d.children = d._children;
			    d._children = null;
			  }
			  d.x = 470;
			  d.y = 370;
			  update();
			}

			

			var color = d3.scale.category20();

			var force = d3.layout.force()
			    .charge(-120)
			    .linkDistance(50)
			    .size([this.width, this.height]);


			update();
			// force
			//   .nodes(newnodes)
			//   .links(newlinks)
			//   .start();



			// var link = this.svg.selectAll(".link")
			//   .data(newlinks)
			// .enter().append("line")
			//   .attr("class", "link")
			//   .style("stroke-width", function(d) { return Math.sqrt(d.value); });

			// var node = this.svg.selectAll(".node")
			//   .data(newnodes)
			// .enter().append("circle")
			//   .attr("class", "node")
			//   .attr("r", function(d) {return d.TOTAL_MATRICULADOS ? radious(d.TOTAL_MATRICULADOS): 10})
			//   .style("fill", function(d) { return color(d.key); })
			//   .call(force.drag);
			  
			// node.on("mouseover", function(d) {
			// 			self.tooltip.show(d)}
			// 			)
			// 	.on("mouseout", function(d) {self.tooltip.hide()})

			// force.on("tick", function() {
			// link.attr("x1", function(d) { return d.source.x; })
			//     .attr("y1", function(d) { return d.source.y; })
			//     .attr("x2", function(d) { return d.target.x; })
			//     .attr("y2", function(d) { return d.target.y; });

			// node.attr("cx", function(d) { return d.x; })
			//     .attr("cy", function(d) { return d.y; });
			// });

		}

	});
  
  return Visualizador;
});

