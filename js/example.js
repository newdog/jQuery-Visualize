// Run the script on DOM ready:
$(function(){
	var chart = new VisualizeChart({ 
		title: 'Example Chart: Hotdogs Eaten Per Day',
		width: 500,
		height: 300,
		colors: ['#0000FF','#33CCFF','#FF0000','#43a51d'],
		barGroupMargin: 1,
		barMargin: 1,
		hoverEnabled: true,
		appendKey: true,
		labels: ['1', '2', '3', '4', '5'],
		series: [
		    new VisualizeSeries({
				 title: 'Hotdogs Eaten',
		      	 type: 'bar',
		       	 labelSide: 'left',
		       	 hoverEnabled: true,
				 data: [100, 200, 300, 400, 450]
		    }),
		    new VisualizeSeries({
				 title: 'Total Hotdogs',
		       	 type: 'bar',
		       	 labelSide: 'left',
		       	 hoverEnabled: true,
				 data: [1000, 800, 600, 600, 500]
		    }),
		    new VisualizeSeries({
				 title: 'Ratio',
		       	 type: 'line',
		       	 labelSide: 'right',
		       	 hoverEnabled: true,
		       	 hoverContent: function(title, value, label) {
		       		 return label + ": " + value + "%";
		       	 },
				 data: [10, 20, 50, 66.66, 90]
		    })
		    ],
		maxOverride: {left: '*1.1', right: '<100'}
		});
	chart.render($('#chartContainer'));
});