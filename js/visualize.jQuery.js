/*
 * --------------------------------------------------------------------
 * jQuery inputToButton plugin
 * Author: Scott Jehl, scott@filamentgroup.com
 * Copyright (c) 2009 Filament Group 
 * licensed under MIT (filamentgroup.com/examples/mit-license.txt)
 * --------------------------------------------------------------------
*/

var internetE = false;
var FF = false;

if (navigator.appName.indexOf("Internet Explorer") != -1) {
	internetE = true;
}
if (navigator.appName.indexOf("FireFox") != -1) {
	FF = true;
}


function VisualizeChart(options) {
	this.o = $.extend({
		appendTitle: true,
		appendKey: true,
		title: "",
		width: 400,
		height: 300,
		colors: ['#be1e2d','#666699','#92d5ea','#ee8310','#8d10ee','#5a3b16','#26a4ed','#f45a90','#e9e744'],
		barGroupMargin: 10,
		barMargin: 1, //space around bars in bar chart (added to both sides of bar)
		yLabelInterval: 30, //distance between y labels
		hoverEnabled: false,
		hoverType: "location", //location or dom
		series: [],
		labels: [],
		maxOverride: $.extend({
			left: null,
			right: null
		})
	},options);
	
	var self = this;
	
	this.series = this.o.series;
	
	$.each(this.series, function(i) {
		if (this.o.color == '')
			this.o.color = self.o.colors[i];
	});
	
	this.update = function(data) {
		if (data.title != null)
			this.o.title = data.title;
		if (data.labels != null)
			this.o.labels = data.labels;
		$.each(this.series, function(i) {
			if (data.series[i].title != null) 
				this.o.title = data.series[i].title;
			if (data.series[i].points != null)
				this.points = data.series[i].points;
		});
	}
	
	this.render = function(container) {
		//create new canvas, set w&h attrs (not inline styles)
		var canvasNode = document.createElement("canvas");
		canvasNode.setAttribute('height',this.o.height);
		canvasNode.setAttribute('width',this.o.width);
		var canvas = $(canvasNode);
	
		var height = this.o.height;
		var width = this.o.width;
		
		//create canvas wrapper div, set inline w&h, append
		var canvasContain = container
			.height(height)
			.width(width)
			.addClass("visualize")
			.addClass("visualize-bar")
			.append(canvas);
	
		//title/key container
		if(this.o.appendTitle || this.o.appendKey){
			var infoContain = $('<div class="visualize-info"></div>')
				.appendTo(container);
		}
		
		//append title
		if(this.o.appendTitle){
			$('<div class="visualize-title">'+ this.o.title +'</div>').appendTo(infoContain);
		}
		
		if(this.o.appendKey){
			var newKey = $('<ul class="visualize-key"></ul>');
			
			var series = this.o.series;
			
			$.each(this.getSeriesTitles(), function(i){
				$('<li><span class="visualize-key-color" style="background: '+series[i].o.color+'"></span><span class="visualize-key-label">'+ this +'</span></li>')
					.appendTo(newKey);
			});
			newKey.appendTo(infoContain);
		};	
		
		if( typeof(G_vmlCanvasManager) != 'undefined' ){ G_vmlCanvasManager.init(); G_vmlCanvasManager.initElement(canvas[0]); }
		
		//set up the drawing board	
		var ctx = canvas[0].getContext('2d');
		
		if (this.o.hoverEnabled) {
			this.hoverObjects = [];
		}
		
		// Make the X labels
		this.makeXLabels(canvas);
		
		// Make the Y labels
		this.makeYLabels(canvas);
		
		// Draw the series
		this.drawSeries(canvas, ctx);
		
		// Set up hover events
		if (this.o.hoverEnabled) {
			this.setUpHover(canvas);
		}
		
		//clean up some doubled lines that sit on top of canvas borders (done via JS due to IE)
		$('.visualize-line li:first-child span.line, .visualize-line li:last-child span.line, .visualize-area li:first-child span.line, .visualize-area li:last-child span.line, .visualize-bar li:first-child span.line,.visualize-bar .visualize-labels-y li:last-child span.line').css('border','none');
	};
	
	
	this.utilities = {
		appendKey: function() {
			
		}
	}
	
	this.makeYLabels = function(canvas) {
		if (this.hasSeries('left')) {
			this.makeYLabelsSide(canvas, 'left');
		}
		if (this.hasSeries('right')) {
			this.makeYLabelsSide(canvas, 'right');
		}
	};
	
	this.makeYLabelsSide = function(canvas, side) {
		var yLabels = this.getYLabels(side);
		var yScale = this.getYScale(canvas, side);
		var liBottom = canvas.height() / (yLabels.length-1);
		var ylabelsUL = $('<ul class="visualize-labels-y"></ul>')
			.width(canvas.width())
			.height(canvas.height())
			.insertBefore(canvas);
			
		$.each(yLabels, function(i){  
			var thisLi = $('<li><span>'+this+'</span></li>')
					.prepend('<span class="line"  />')
					.css('bottom',liBottom*i)
					.prependTo(ylabelsUL);
				var label = thisLi.find('span:not(.line)');
				var topOffset = label.height()/-2;
				if(i == 0){ topOffset = -label.height(); }
				else if(i== yLabels.length-1){ topOffset = 0; }
				label
					.css('margin-top', topOffset)
					.addClass('label');
				if (side == 'right') {
					if (internetE) {
						label.css('left', canvas.width()-80);
					} else {
						label.css('left', canvas.width()-85);
					}
				}
		});
	}
	
	this.makeXLabels = function(canvas) {
		var xLabels = this.o.labels;
		var xInterval = this.getXInterval(canvas);
		var xlabelsUL = $('<ul class="visualize-labels-x"></ul>')
			.width(canvas.width())
			.height(canvas.height())
			.insertBefore(canvas);
		$.each(xLabels, function(i){ 
			var thisLi = $('<li><span>'+this+'</span></li>')
				.prepend('<span class="line" />')
				.css('left', xInterval * i)
				.width(xInterval)
				.appendTo(xlabelsUL);						
			var label = thisLi.find('span:not(.line)');
			label.addClass('label');
		});
	}
	
	this.drawSeries = function(canvas, ctx) {
		
		var barSeries = this.getAllSeriesOfType('bar');
		var areaSeries = this.getAllSeriesOfType('area');
		var lineSeries = this.getAllSeriesOfType('line');
		
		ctx.translate(0,this.getZeroLoc(canvas));
		// Look at bar first
		if (barSeries.length > 0) {
			// Because the bar series need to all be side by side, we render them in one big go.
			this.drawBar(canvas, ctx, barSeries);
		}
		// Area second
		if (areaSeries.length > 0) {
			// We can render each area individually
			this.drawLine(canvas, ctx, areaSeries, true);
		}
		
		// Finally line
		if (lineSeries.length > 0) {
			// We can render each line individually
			this.drawLine(canvas, ctx, lineSeries, false);
		}
		
	}
	
	this.drawLine = function(canvas, ctx, series, area) {
		var xInterval = this.getXInterval(canvas);
	
		//iterate and draw
		for(var h=0; h<series.length; h++){
			var yScale = this.getYScale(canvas, series[h].o.labelSide);
			ctx.beginPath();
			ctx.lineWidth = series[h].o.lineWeight;
			ctx.lineJoin = 'round';
			var points = series[h].points;
			var integer = (xInterval/2);
			ctx.moveTo(integer,-(points[0]*yScale));
			
			$.each(points, function(i){
				ctx.lineTo(integer,-(this*yScale));
				if (self.seriesHoverEnabled(series[h])) {
					self.hoverObjects.push(new ChartCircle(integer,this*yScale,series[h].o.lineDotRadius*1.5,i,series[h]));
				}
				integer+=xInterval;
			});
			ctx.strokeStyle = series[h].o.color;
			ctx.stroke();
			
			if(area){
				integer-=xInterval;
				ctx.lineTo(integer,0);
				ctx.lineTo(xInterval/2,0);
				ctx.closePath();
				ctx.fillStyle = series[h].o.color;
				ctx.globalAlpha = .5;
				ctx.fill();
				ctx.globalAlpha = 1.0;
			}
			ctx.closePath();
			
			if (series[h].o.drawLineDots) {
				integer = (xInterval/2);
				$.each(points, function(){
					ctx.beginPath();
					ctx.fillStyle = series[h].o.color;
					ctx.arc(integer,-(this*yScale), series[h].o.lineDotRadius, 0, 2*Math.PI, false);
					integer+=xInterval;
					ctx.fill();
					ctx.closePath();
				});
			}
			
		}
	}
	
	this.drawBar = function(canvas, ctx, series) {
		var xInterval = this.getXInterval(canvas);
	
		//iterate and draw
		for(var h=0; h<series.length; h++){
			
			var yScale = this.getYScale(canvas, series[h].o.labelSide);
		
			ctx.beginPath();
			var linewidth = (xInterval-this.o.barGroupMargin*2) / series.length; //removed +1 
			var strokeWidth = linewidth - (this.o.barMargin*2);
			ctx.lineWidth = strokeWidth;
			var points = series[h].points;
			var integer = 0;
			for(var i=0; i<points.length; i++){
				var xVal = integer+this.o.barGroupMargin+(h*linewidth)+linewidth/2;
				
				ctx.moveTo(xVal, 0);
				ctx.lineTo(xVal, Math.round(-points[i]*yScale));
				integer+=xInterval;
				if (this.seriesHoverEnabled(series[h])) {
					this.hoverObjects.push(new ChartRectangle(xVal-strokeWidth/2,0,strokeWidth,Math.round(points[i]*yScale),i,series[h]));
				}
			}
			ctx.strokeStyle = series[h].o.color;
			ctx.stroke();
			
			
			
			ctx.closePath();
		}
	}
	
	this.seriesHoverEnabled = function(series) {
		return this.o.hoverEnabled && series.o.hoverEnabled;
	}
	
	this.setUpHover = function(canvas) {
		if (this.o.hoverType = 'location') {
			this.locationHover(canvas);
		} else if (this.o.hoverType = 'dom') {
		
		}
	}
	
	this.createPopup = function(canvas) {
		return $('<div class="visualize-popup"></div>').css('position','absolute').css('zIndex',9999).hide().appendTo(canvas.parent());
	}
	
	this.locationHover = function(canvas) {
		// Create all of the data point hover objects
		var popup = this.createPopup(canvas);
		var hover = this.hoverObjects;
		
		canvas.parent().bind('mousemove', function(e) {
			var x = e.pageX-canvas.offset().left;
			var y = canvas.height() - e.pageY+canvas.offset().top;
			
			var visible = false;
			
			popup.empty();
			$.each(hover, function() {
				if (this.contains(x,y)) {
					visible = true;
					var box = $("<div><p>" + this.series.o.hoverContent(this.series.o.title, this.series.points[this.index],self.o.labels[this.index]) + "</p></div>");
					box.css("padding","2px")
					
					if (this.series.o.hoverUseBorder) {
						box.css("border","2px solid " + this.series.o.color);
					}
					
					box.appendTo(popup);
				}
			});
			
			if (visible) {
				popup.show();
				popup.offset({ left: e.pageX+10, top: e.pageY-popup.height()+4});
			} else {
				popup.hide();
			}
		});
		
	}
	
	this.getZeroLoc = function(canvas) {
		return this.o.height * this.getTopValue('left')/this.getTotalYRange('left');
	}
	
	this.getYScale = function(canvas, side) { 
		return canvas.height() / this.getTotalYRange(side);
	}
	
	this.getXInterval = function(canvas) {
		return canvas.width() / this.o.labels.length;
	}
	
	this.hasSeries = function(side) {
		return this.getAllSeries(side).length > 0;
	}
	
	this.getAllSeries = function(side) {
		if (side == 'both') {
			return this.o.series;
		}
		var series = [];
		$.each(this.o.series, function() {
			if (this.o.labelSide == side) {
				series.push(this);
			}
		});
		return series;
	}
	
	this.getAllHoverSeries = function() {
		var series = [];
		$.each(this.o.series, function() {
			if (this.o.hoverEnabled == true) {
				series.push(this);
			}
		});
		return series;
	}
	
	this.getAllSeriesOfType = function(type) {
		var series = [];
		$.each(this.o.series, function() {
			if (this.o.type == type) {
				series.push(this);
			}
		});
		return series;
	}
	
	this.getTopValue = function(side) {
		
		var max = 0;
		$.each(this.getAllSeries(side), function() {
			if (this.topValue() > max) {
				max = this.topValue();
			}
		});
		var override = this.o.maxOverride[side];
		
		if (override) {
			var splits = override.split(" ");
			$.each(splits, function() {
				if (this.indexOf('<') != -1) {
					var value = parseInt(this.substr(1));
					if (max < value)
						max = value;
				} else if (this.indexOf('>') != -1) {
					var value = parseInt(this.substr(1));
					if (max > value)
						max = value;
				} else if (this.indexOf('+') != -1) {
					var value = parseInt(this.substr(1));
					max += value;
				} else if (this.indexOf('-') != -1) {
					var value = parseInt(this.substr(1));
					max -= value;
				} else if (this.indexOf('*') != -1) {
					var value = parseFloat(this.substr(1));
					max = Math.round(max*value);
				} else {
					var value = parseInt(this);
					max = value;
				}
			});
		}
		
		return max;
	}
	
	this.getBottomValue = function(side) {
		var min = 0;
		$.each(this.getAllSeries(side), function() {
			if (this.topValue() < min) {
				min = this.topValue();
			}
		});
		return min;
	}
	
	this.getYLabels = function(side) {
		var yLabels = [];
	
		var numLabels = Math.round(this.o.height / this.o.yLabelInterval);
		var topValue = this.getTopValue(side);
		var bottomValue = this.getBottomValue(side);
		var loopInterval = Math.ceil(this.getTotalYRange(side) / numLabels) || 1;
		
		yLabels.push(bottomValue);
		while( yLabels[yLabels.length-1] < topValue - loopInterval){
			yLabels.push(yLabels[yLabels.length-1] + loopInterval); 
		}
		yLabels.push(topValue);
		return yLabels;
	}
	
	this.getTotalYRange = function(side) {
		return this.getTopValue(side) - this.getBottomValue(side);
	}
	
	this.getSeriesTitles = function() {
		var titles = [];
		$.each(this.o.series, function() {
			titles.push(this.o.title);
		});
		return titles;
	}
}

function VisualizeSeries(options) {
	this.o = $.extend({
		type: 'bar', // also available: area, line
		title: '',
		labelSide: 'left',
		color: '',
		lineWeight: 4,
		drawLineDots: true,
		lineDotRadius: 6,
		hoverEnabled: false,
		hoverUseBorder: true,
		hoverContent: function(title, value, label) {
			return label + ": " + value;
		},
		data: []
	},options);
	
	this.points = this.o.data;
	
	this.topValue = function() {
		var max = 0;
		$.each(this.points, function() {
			if (this > max) {
				max = this;
			}
		});
		return max;
	}
	
	this.bottomValue = function() {
		var min = 0;
		$.each(this.points, function() {
			if (this < min) {
				min = this;
			}
		});
		return min;
	}
	
}

function ChartRectangle(x, y, width, height, index, series) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.index = index;
	this.series = series;
	
	this.contains = function(x, y) {
		return x > this.x && x < this.x+width && y > this.y && y < this.y+height;
	}
}

function ChartCircle(x, y, radius, index, series) {
	this.x = x;
	this.y = y;
	this.radius = radius;
	this.index = index;
	this.series = series;
	
	this.contains = function(x, y) {
		return (Math.pow(x-this.x,2) + Math.pow(y-this.y,2)) < Math.pow(radius,2);
	}
}