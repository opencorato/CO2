/**
 * GaugeMeter
 * Author: Mark Homans
 * Email: mark.homans@gmail.com
 * Date: 2013-06-09
 */
function GaugeMeter (_settings)
{
    var defaults =
    {
        MinValue        : 0,        //Min value
        MaxValue        : 100,      //Max value
        Text            : "",       //text in the middle
        Animate         : true,
        AnimTime        : 500,      //duration of animation in miliseconds
        Refreshrate     : 12,       //lower is smoother
        StartEazingAt   : 0.5,      //start to eaze at nth of value (lower = smoother eaze)
        EazeForce       : 1.02,     //eaze reduced by nth of step (higher = faster stop)
        NoDataText      : "No data",//text to show when no data is found,
        GaugeColors     : ["rgb(255,0,0)",
                           "rgb(255,165,0)",
                           "rgb(34,139,34)",
                           "rgb(0,128,0)",
                           "rgb(0,100,0)"
                          ],
        GaugeSegments   : {
                            BorderColor: 'rgb(64,62,68)',
                            BorderWidth: 2
                          },
        Panel           : {
                            BackgroundColor : "rgba(145,190,211,0.15)",
                            BorderColor     : "rgb(145,190,211)",
                            BorderWidth     : 1,
                            Margin          : 7,
                            Radius          : 5
                          },
        HideOuterBorder :  false,
        OuterBorder     : {
                            BorderWidth     : 1,
                            BorderColor     : "rgb(145,190,211)",
                            BackgroundColor : "rgba(145,190,211,0.3)",
                            Radius          : 10
                          },
        Needle          : {
                            BorderWidth: 1,
                            BorderColor: "rgb(0,0,0)",
                            BackgroundColor: "rgb(255,74,74)"
                          },
        NeedlePivot     : {
                            BorderWidth: 1,
                            BorderColor: "rgb(78,101,112)",
                            BackgroundColor: "rgb(205,224,226)"
                          },
        FontColor: "rgb(78,101,112)",
        Font : '10px Arial',
		GaugeAngle: 140,
        MayorTicks: {
            Count:5
        },
        MinorTicks: {
            CountPerMayor: 5
        },
        TickValueFormatter: undefined
                          
    };
    
	
	function applySettings(settingsParm)
	{
	
		var copy = function(target, source)
		{
			for(var i in source)
			{
				if(!source.hasOwnProperty(i))
					continue;
				if(source[i] != undefined)
				{
					if(typeof source[i] == "object")
					{
						copy(target[i], source[i]);
					}
					else
						target[i] = source[i];
				}
			}
		};
		
		copy(settings, settingsParm);

	}
	
	function setup(val)
    {
		applySettings(val);
		setValue(settings.Value);
	}
	
    function setValue(val)
    {
		orgValue = CurValue;
		
		settings.Value = parseFloat(val);		
		
		if(isNaN(settings.Value))
		{
			settings.NoData = true;
			DrawNoData();
			return;
		}
		else
		{
			settings.NoData = false;
		}
		
		forwards = settings.Value > CurValue;
		easepoint = CurValue + ((settings.Value - CurValue) /2);
		lastDraw = 0;
		
		useInterval = !window.cancelAnimationFrame;
		
		if(useInterval)
		{
			clearInterval(intervalPointer);
			intervalPointer = setInterval (Draw,Refreshrate);
             
		}
		else
		{
			window.cancelAnimationFrame(animFramePointer);
			Draw(0);
		}

    }
    
	function Draw(timestamp)
	{
		if(settings.Animate)
        {
			var Delta;
			if(useInterval)
			{
				var Delta = settings.Refreshrate;
			}
			else
			{
				Delta = timestamp - lastDraw;
				if(timestamp == 0 || lastDraw == 0)
					Delta = 0;
				lastDraw = timestamp;
			}
			
            var step = (settings.Value-CurValue) / (settings.AnimTime / Delta);
			
			//make sure we step at least 0.1% of what we need to do
			var min_step = (settings.Value-orgValue) / 1000;
			var requestFrame = true;

			DrawBackground();
			if(forwards)
			{
				//eazing
				if(CurValue >= easepoint)
				{
					step /= settings.EazeForce;
					if(step<min_step)
						step=min_step;
				}
				//ending
				if(CurValue >= settings.Value)
				{
					CurValue = settings.Value;
					if(useInterval)
						clearInterval(intervalPointer);
					requestFrame = false;
					
				}

				DrawValue(CurValue);
				CurValue += step;
			}
			else
			{
				//eazing
				if(CurValue <= easepoint)
				{
					step /= settings.EazeForce;
					if(step>min_step)
						step=min_step;
				}
				//ending
				if(CurValue <= settings.Value)
				{
					CurValue = settings.Value;
					if(useInterval)
						clearInterval(intervalPointer);
					requestFrame = false;
				}

				DrawValue(CurValue);
				CurValue += step;
			}
			
			if(requestFrame && window.requestAnimationFrame)
				animFramePointer = window.requestAnimationFrame(Draw);
                
        }
        else
        {
            DrawBackground();
            DrawValue(settings.Value);
        }       
	}
	
    function DrawBackground()
    {
        /*var MayorTicks =  settings.MayorTicks || defaults.MayorTicks,
            MayorTicks.Count = MayorTicks.Count || defaults.MayorTicks.Count,
            MinorTicks =  settings.MinorTicks || defaults.MinorTicks,
            MinorTicks.CountPerMayor = MinorTicks.CountPerMayor || defaults.MinorTicks.CountPerMayor,
            TickValueFormatter = settings.TickValueFormatter || undefined;
        */
        var margin = settings.Panel.Margin;//+5;
    
        //clear all to start with
        c.clearRect(0,0,canvas.width,canvas.height)
        
        if(!settings.HideOuterBorder)
        {
            //outer border
            c.fillStyle = settings.OuterBorder.BackgroundColor;
            c.strokeStyle = settings.OuterBorder.BorderColor;
            c.lineWidth = settings.OuterBorder.BorderWidth;
            roundRectHollow(c, 5, 5, width-10, height-10, margin, settings.OuterBorder.Radius, settings.Panel.Radius, true, true, false);
        }
        
        //inner panel
        c.fillStyle = settings.Panel.BackgroundColor;
        c.strokeStyle = settings.Panel.BorderColor;
        c.lineWidth = settings.Panel.BorderWidth;
        roundRect(c, 5+margin, 5+margin, width-10-(2 * margin), height-10-(2 * margin), 5, true, settings.Panel.BorderWidth);

        //Texts
        c.font = settings.Font;
        c.textAlign = "center";
        c.fillStyle = settings.FontColor;
		
		var minLabel = settings.MinLabel || settings.MinValue;
		var maxLabel = settings.MaxLabel || settings.MaxValue;
		
        c.fillText(minLabel, center-50 * sizePercent, height - 25 * sizePercent);
        c.fillText(maxLabel, center+50 * sizePercent, height - 25 * sizePercent);

        c.fillText(settings.Text, center, 65 * sizePercent);
        

        //Arcs		
        c.lineWidth = settings.GaugeSegments.BorderWidth;
        c.strokeStyle = settings.GaugeSegments.BorderColor;
        		
        var part = settings.GaugeAngle / settings.GaugeColors.length;
        
        for(var i=0; i<settings.GaugeColors.length; i++)
        {
            c.fillStyle = settings.GaugeColors[i];
            var from = (-90 - (settings.GaugeAngle/2)) + (part*i);
            var to = from + part;
            DrawArcPart(from,to);
        }
        
        /*var tickParts = GaugeAngle / MayorTicks;
        //Ticks
        for(i=0; i< MayorTicks; i++)
        {
            var from = (-90 - (GaugeAngle/2)) + (tickParts*i);
        }*/
        
    }
    function DrawNoData()
	{
		DrawBackground();
        c.fillStyle = "rgba(255,255,255,0.7)";
        roundRect(c, 5, 5, width-10, height-10, 10, true, false);
        c.font = "bold 14px Arial";
        c.textAlign = "center";
        c.fillStyle = "rgb(0,0,0)";
        c.fillText(settings.NoDataText, center, 40);
	}
	function DrawArcPart(_startAngle,_endAngle)
    {
        c.beginPath();
        c.arc(center,needlePointHeight,65*sizePercent,
        _startAngle * Math.PI / 180,
        _endAngle * Math.PI / 180,
        false);
        c.arc(center,needlePointHeight,55*sizePercent,
        _endAngle * Math.PI / 180,
        _startAngle * Math.PI / 180,
        true);
        c.closePath();
        if(settings.GaugeSegments.BorderWidth)
            c.stroke();
        c.fill();
    }
	
    function DrawValue(value)
    {
        var min = settings.MinValue,
            max = settings.MaxValue,
            val = value;
        if(min<0)
        {
            max += Math.abs(min);
            val += Math.abs(min);
            min = 0;
        }
        var rotation = (settings.GaugeAngle * (val/(max - min)))-(settings.GaugeAngle/2);

        c.save();

        //bepaal de nieuwe x y zodat we kunnen rotaten
        c.translate(center, needlePointHeight);

        //rotate het gehele scherm
        c.rotate(rotation * Math.PI / 180);

        //zet de x y terug naar wat het was
        c.translate(-center, -needlePointHeight);


        c.beginPath();
        c.fillStyle = settings.Needle.BackgroundColor;
        c.strokeStyle = settings.Needle.BorderColor;
        c.lineWidth = settings.Needle.BorderWidth;
        c.moveTo(center-2*sizePercent,needlePointHeight);
        c.lineTo(center,20*sizePercent);
        c.lineTo(center+2*sizePercent,needlePointHeight);
        c.closePath();
        c.stroke();
        c.fill();

        c.restore();

        c.beginPath();
        c.fillStyle = settings.NeedlePivot.BackgroundColor;
        c.strokeStyle = settings.NeedlePivot.BorderColor;
        c.lineWidth = settings.NeedlePivot.BorderWidth;
        c.arc(center, needlePointHeight, 5, 0, 2 * Math.PI, false);
        if(settings.NeedlePivot.BorderWidth)
            c.stroke();
        c.fill();
        
        c.fillStyle = settings.FontColor;
        c.fillText(settings.Value, center, 50 * sizePercent);
    }
	
    function roundRect(ctx, x, y, width, height, radius, fill, stroke)
    {
        if (typeof stroke == "undefined" )
            stroke = true;
      
        if (typeof radius === "undefined")
            radius = 5;
      
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        
        ctx.closePath();
        if (stroke)
            ctx.stroke();
        if (fill)
            ctx.fill();
                
    }
    function roundRectHollow(ctx, x, y, width, height, margin, radius_outer, radius_inner, fill, outer_stroke, inner_stroke)
    {
        if (typeof outer_stroke == "undefined" )
            outer_stroke = false;
        if (typeof inner_stroke == "undefined" )
            inner_stroke = false;
      
        if (typeof radius_inner === "undefined")
            radius_inner = 5;
        if (typeof radius_outer === "undefined")
            radius_outer = 5;
      
        ctx.beginPath();
        
        ctx.moveTo(x + radius_outer, y);
        ctx.lineTo(x + width - radius_outer, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius_outer);
        ctx.lineTo(x + width, y + height - radius_outer);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius_outer, y + height);
        ctx.lineTo(x + radius_outer, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius_outer);
        ctx.lineTo(x, y + radius_outer);
        ctx.quadraticCurveTo(x, y, x + radius_outer, y);
        
        x += margin;
        y += margin;
        height -= margin*2;
        width -= margin*2;
        
        ctx.moveTo(x + radius_inner, y);
        ctx.quadraticCurveTo(x, y, x, y + radius_inner);
        ctx.lineTo(x, y + radius_inner);
        ctx.lineTo(x, y + height - radius_inner);
        ctx.quadraticCurveTo(x, y + height, x + radius_inner, y + height);
        ctx.lineTo(x + radius_inner, y + height);
        ctx.lineTo(x + width - radius_inner, y + height);
        ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius_inner);
        ctx.lineTo(x + width, y +radius_inner);
        ctx.quadraticCurveTo(x + width, y, x + width - radius_inner, y);
        ctx.lineTo(x + radius_inner, y);

        ctx.closePath();
        
        if (fill)
            ctx.fill();
            
        if (outer_stroke && inner_stroke)
            ctx.stroke();
        else if(outer_stroke)
            roundRect(ctx, x-margin, y-margin, width+margin*2, height+margin*2, radius_outer, false, true);
        else if(inner_stroke)
            roundRect(ctx, x, y, width, height, radius_outer, false, true);
               
    }
	
	var settings = {};
	
	for(var i in defaults)
	{
		settings[i] = defaults[i];
	}
	applySettings(_settings);
	
	if(!("ElementId" in settings))
        throw "ElementId not found!";
    	
    var div = document.getElementById(settings.ElementId);
    if(div==null)
        throw "object [" + settings.ElementId + "] does not exist";
    var div_var = parseFloat(div.innerText || div.textContent);
	
	settings.Value = settings.Value || div_var;
	
    div.innerHTML = '';

    var canvas = document.createElement("canvas");
    div.appendChild(canvas);

    canvas.width = div.offsetWidth;//180;
    canvas.height = canvas.width * 0.6;//108;
    
    //multiply all sizes by this figure
    var sizePercent = canvas.width / 180;
    
    if(navigator.appName=="Microsoft Internet Explorer")
    {
        var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        re.exec(navigator.userAgent)
        if(parseFloat(RegExp.$1) <9)
            G_vmlCanvasManager.initElement(canvas);
    }
    var c = canvas.getContext("2d");
	
    var center = canvas.width / 2,
        height = canvas.height,
        width = canvas.width,
        needlePointHeight = canvas.height-25*sizePercent;

	var CurValue = settings.MinValue;
    
    if(settings.NoData)
    {
        DrawNoData();
        return;
    }
	
	var forwards,
		easepoint,
		lastDraw,
		animFramePointer,
		orgValue,
		intervalPointer,
		useInterval;

	setValue(settings.Value);
	
	return {
		SetValue : setValue,
		Setup : setup,
		Settings: settings
	};
}
