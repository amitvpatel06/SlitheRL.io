

var net;
var trainer; 
var brain; 
var average = 0; 
var num = 1; 

var buildModelGraph = function() {
    if(!convnetjs) {
        // If we haven't loaded our library yet, wait a bit!
        window.setTimeout(buildModelGraph, 100);
    }
    var layers = [];
    layers.push({type:'input', out_sx: 20, out_sy: 20, out_depth:3});
    layers.push({type:'conv', sx:5, filters:10, stride:1, activation:'relu'});
    layers.push({type:'regression', num_neurons: 1200})
    net = new convnetjs.Net();
    net.makeLayers(layers);
    trainer = new convnetjs.SGDTrainer(net, {method:'adadelta', batch_size:1, l2_decay:0.0001});

    var env = {};
    env.getNumStates = function() { return 2560; }
    env.getMaxNumActions = function() { return 4; }
    var spec = { alpha: 0.01 }
    brain = new RL.DQNAgent(env, spec);

}

var pool_image=  function(pooler, data, w, h, ox, oy) {
    var pool = []
    var img = [];
    var xi = w / ox; 
    var yi = h / oy; 

    var xt = 0;
    var yt = 0; 
    var idx = 0;
    var c = 0;
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
                        blue_t  = pooler(blue_t, data[idx]);
                        idx = idx + 1;
                        alpha_t = pooler(alpha_t, data[idx]);
                }
            }
            img.push(red_t);
            img.push(green_t);
            img.push(blue_t);
            pr.push([red_t, green_t, blue_t]);
        }
        pool.push(pr)
        yt = 0; 
        xt += xi;
    }
    return [pool, img];
};

var mainGameLoop = function() {

    // gather game data
    var image = window.mc.getContext('2d').getImageData(0,0,window.ww, window.hh).data;
    var sum;
    var time = new Number(new Date());
    var pools = pool_image(Math.max, image,  window.ww, window.hh, 100, 100);
    if(net) {   
        var inp = new convnetjs.Vol(100,100,3);
        for(var i = 0; i < 100; i++) {
            for(var j = 0; j < 100; j++) {
                for(var k = 0; k < 3; k++){
                    inp.set(i,j,k, pools[0][i][j][k]);
                }
            }
        }

    }
    console.log(new Number(new Date()) - time);
    net.forward(inp);
    var rlInp = net.layers[2].out_act.w;
    var action = brain.act(rlInp);
    setDirection(action);
    var score = window.score;
    setTimeout(function () {
        learnReward(score);
    }, 1000)
};

var learnReward = function(past_score) {
    var diff = window.score - past_score;
    if(diff > 0) {    
        console.log("diff ");
        console.log(diff);
    }
    brain.learn(diff);
    num += 1;
    if(!isNaN(diff)) {
        average = average + diff/num;
        console.log("score ");
        console.log(average);
    }
};

var setDirection = function (direction) {
    if(direction == 0) {
        window.xm = 0;
        window.ym = 100;
    }
    else if (direction == 1) {
        window.xm = -100;
        window.ym = 0;
    }
    else if (direction == 2) {
        window.xm = 0;
        window.ym = -100;
    }
    else {
        window.xm = 100;
        window.ym = 0;
    }
}
window.setInterval(mainGameLoop, 2000);
window.setTimeout(buildModelGraph, 500);
    
var penalty = 0; 

var original_connect = window.connect;

window.connect = function() {
    original_connect();
    penalty +=50;
}

var respawn = function() {
    if(!window.playing) {
        if(brain) {
            brain.learn(-10);
            average -= 10 / num
        }
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


