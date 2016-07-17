


var buildModel = function() {
    if(!convnetjs) {
        // If we haven't loaded our library yet, wait a bit!
        window.setTimeout(buildModel, 100);
    }
    var layers = [];
    layers.push({type:'input', out_sx: 100, out_sy: 100, out_depth:3});
    
}

var pool_image=  function(pooler, data, w, h, ox, oy) {
    var pool = []
    var xi = w / ox; 
    var yi = h / oy; 

    var xt = 0;
    var yt = 0; 
    var idx = 0;
    for (var i = 0; i < ox; i++) {
        var pr = [];
        for (var j = 0; j < oy; j++) {
            var red_t = -1;
            var blue_t = -1;
            var green_t = -1;
            var alpha_t = -1;
            for (var k = Math.floor(xt); k < Math.floor(xt + xi); k++) {
                for (var l =  Math.floor(yt); l < Math.floor(yt + yi); l++) {
                        idx = (0 + k + l*w) * 4;
                        red_t = pooler(red_t, data[idx]);
                        idx = idx + 1;
                        green_t  = pooler(green_t, data[idx]);
                        idx = idx + 1;
                        blue_t  = pooler(blue_t, data[idx])
                        idx = idx + 1;
                        alpha_t = pooler(alpha_t, data[idx])
                }
            }
            pr.push([red_t, green_t, blue_t ]);
            yt += yi;
        }
        pool.push(pr);
        yt = 0; 
        xt += xi;
    }
    return pool;
}

var mainGameLoop = function() {

    // gather game data
    var image = window.mc.getContext('2d').getImageData(0,0,window.ww, window.hh).data;
    var sum;
    var time = new Number(new Date());
    var x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ]
    var pools = pool_image(Math.max, image,  window.ww, window.hh, 100, 100);
    console.log(pools);
    console.log(new Number(new Date()) - time);
    
}

window.setInterval(mainGameLoop, 200);

var penalty = 0; 

var original_connect = window.connect;

window.connect = function() {
    original_connect();
    penalty +=50;
}

var respawn = function() {
    if(!window.playing) {
        window.connect();
    }
}

window.setInterval(respawn, 500);

var canvasUtil = window.canvasUtil = (function() {
    return {
        // Ratio of screen size divided by canvas size.
        canvasRatio: {
            x: window.mc.width / window.ww,
            y: window.mc.height / window.hh
        },

        // Set direction of snake towards the virtual mouse coordinates
        setMouseCoordinates: function(point) {
            window.xm = point.x;
            window.ym = point.y;
        },

        // Convert snake-relative coordinates to absolute screen coordinates.
        mouseToScreen: function(point) {
            var screenX = point.x + (window.ww / 2);
            var screenY = point.y + (window.hh / 2);
            return {
                x: screenX,
                y: screenY
            };
        },

        // Convert screen coordinates to canvas coordinates.
        screenToCanvas: function(point) {
            var canvasX = window.csc *
                (point.x * canvasUtil.canvasRatio.x) - parseInt(window.mc.style.left);
            var canvasY = window.csc *
                (point.y * canvasUtil.canvasRatio.y) - parseInt(window.mc.style.top);
            return {
                x: canvasX,
                y: canvasY
            };
        },

        // Convert map coordinates to mouse coordinates.
        mapToMouse: function(point) {
            var mouseX = (point.x - window.snake.xx) * window.gsc;
            var mouseY = (point.y - window.snake.yy) * window.gsc;
            return {
                x: mouseX,
                y: mouseY
            };
        },

        // Map coordinates to Canvas coordinates.
        mapToCanvas: function(point) {
            var c = canvasUtil.mapToMouse(point);
            c = canvasUtil.mouseToScreen(c);
            c = canvasUtil.screenToCanvas(c);
            return c;
        },

       
        // Constructor for point type
        point: function(x, y) {
            var p = {
                x: Math.round(x),
                y: Math.round(y)
            };

            return p;
        },

        // Constructor for rect type
        rect: function(x, y, w, h) {
            var r = {
                x: Math.round(x),
                y: Math.round(y),
                width: Math.round(w),
                height: Math.round(h)
            };

            return r;
        },

        // Constructor function for the nXn grid of rectangles
        grid: function(n) {
            i = window.ww / n;
            j = window.ww / n;
            var g = [];
            x = 0;
            y = 0;
            for (k = 0; k < n; k++) {
                for (l = 0; l < n; l++) {
                    g.push(rect(x + l*i,y + k*j,i,j))
                }
            }
            return g;
        },

        // Constructor for circle type
        circle: function(x, y, r) {
            var c = {
                x: Math.round(x),
                y: Math.round(y),
                radius: Math.round(r)
            };

            return c;
        },


        // Adjusts zoom in response to the mouse wheel.
        setZoom: function(e) {
            // Scaling ratio
            if (window.gsc) {
                window.gsc *= Math.pow(0.9, e.wheelDelta / -120 || e.detail / 2 || 0);
                window.desired_gsc = window.gsc;
            }
        },

        // Restores zoom to the default value.
        resetZoom: function() {
            window.gsc = 0.9;
            window.desired_gsc = 0.9;
        },

        // Maintains Zoom
        maintainZoom: function() {
            if (window.desired_gsc !== undefined) {
                window.gsc = window.desired_gsc;
            }
        },
    }
})();


