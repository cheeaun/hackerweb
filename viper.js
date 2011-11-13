// A good deal of code inspired by the awesome MooTools framework (http://mootools.net/)
(function (window, undefined) {

function assignEvents(array, obj) {
    array.push.apply(array, obj ? ({}).toString.call(obj) == '[object Array]' ? obj : [obj] : []);
}

function fireEvents(array, bind, obj) {
    for (var i = 0, l = array.length; i < l; ++i)
        array[i].call(bind, obj);
}

function Viper(options) {
    if (!(this instanceof Viper))
        return new Viper(options);
    this.object = options.object;
    this.property = options.property;
    this.from = this._from = options.from || this.object[this.property];
    this.to = ({}).toString.call(options.to) == '[object Array]' ? options.to : [options.to];
    this.target = 0;
    this.parser = options.parser || (function (val) {
        var parsers = Viper.Parsers, parser, list = [], i, l;
        for (i in parsers) {
            if (parsers.hasOwnProperty(i))
                list.push(parsers[i]);
        }
        list.sort(function (a, b) { return (b.priority || 0) - (a.priority || 0); });
        for (i = 0, l = list.length; i < l; ++i) {
            parser = new list[i]();
            if (parser.parse(val) != null)
                return parser;
        }
        parser = new parsers.Number();
        parser.parse(val);
        return parser;
    })(this.from);
    this.transition = options.transition || Viper.Transitions.linear;
    this.duration = options.duration || 500;
    this.fps = options.fps || 40;
    this.frameInterval = 1000 / this.fps;
    this.frames = options.frames || ~~(this.duration / this.frameInterval + 0.5);
    this.frame = options.frame == undefined ? -1 : 0;
    this.running = false;
    this.startHandlers = [];
    this.updateHandlers = [];
    this.finishHandlers = [];
    assignEvents(this.startHandlers, options.start);
    assignEvents(this.updateHandlers, options.update);
    assignEvents(this.finishHandlers, options.finish);
}

var VP = Viper.prototype, transition, i, old = window.Viper;

VP.start = function () {
    if (!this.running) {
        this.resume();
        fireEvents(this.startHandlers, this, this.object);
    }
    return this;
};

VP.stop = function () {
    if (this.running) {
        this.pause();
        fireEvents(this.finishHandlers, this, this.object);
    }
    return this;
};

VP.pause = function (time) {
    if (this.running) {
        this.running = this.time = false;
        clearInterval(this.timer);
        var t = this;
        if (time != undefined)
            setTimeout(function () { t.resume(); }, time);
    }
    return this;
};

VP.resume = function () {
    if (!this.running && this.frame < this.frames) {
        var t = this;
        this.timer = setInterval(function () { t.step(+new Date()); }, this.frameInterval);
        this.running = true;
    }
    return this;
};

VP.step = function (now) {
    this.frame += (now - (this.time || now)) / this.frameInterval;
    this.time = now;
    this.object[this.property] = this.parser.compute(this.from, this.to[this.target], this.frame < this.frames ?
    this.transition(this.frame / this.frames) : 1);
    fireEvents(this.updateHandlers, this, this.object);
    if (this.frame >= this.frames) {
        this.frame = this.time = 0;
        this.parser.parse(this.from = this.to[this.target++]);
        if (this.to[this.target] == undefined) {
            this.parser.parse(this.from = this._from);
            this.target = 0;
            this.stop();
        }
    }
};

// See Robert Penner's Easing Equations (http://www.robertpenner.com/easing/), modified slightly.
Viper.Transitions = {
    linear: function (x) {
        return x;
    },
    
    sine: function (x) {
        return 1 - Math.cos(x * Math.PI / 2);
    },
    
    elastic: function (x) {
        return Math.pow(2, 10 * --x) * Math.cos(20 * x * Math.PI / 3);
    },
    
    bounce: function (x) {
        var a = 0, b = 1, c;
        while (x < (7 - 4 * a) / 11) {
            a += b;
            b /= 2;
        }
        c = (11 - 6 * a - 11 * x) / 4;
        return b * b - c * c;
    }
};

for (i in Viper.Transitions) {
    if (Viper.Transitions.hasOwnProperty(i)) {
        transition = Viper.Transitions[i];
        transition.out = (function (transition) { return function (x) {
            return 1 - transition(1 - x);
        }})(transition);
        transition.inOut = (function (transition) { return function (x) {
            return (x > 0.5 ? 2 - transition(2 * (1 - x)) : transition(2 * x)) / 2;
        }})(transition);
    }
}

function compute(from, to, delta) {
    return (to - from) * delta + from;
}

Viper.Parsers = {
    Number: function () {
        this.parse = function (x, noset) {
            x += '';
            var match = /(\D*)(\d+)(.*)?/.exec(x) || [,,'x' - 2], value = parseFloat(match[2]);
            if (!noset) {
                this.prefix = match[1] || '';
                this.suffix = match[3] || '';
                this.value = value;
            }
            return isNaN(value) ? undefined : value;
        };
        
        this.compute = function (from, to, delta) {
            return this.prefix + compute(this.value, this.parse(to, true), delta) + this.suffix;
        };
    },
    
    Color: function () {
        this.parse = function (x, noset) {
            var intify = parseInt, match;
            if (/^#[\da-f]{6}$/i.test(x))
                match = [intify(x.substring(1, 3), 16), intify(x.substring(3, 5), 16), intify(x.substring(5, 7), 16)];
            else if (match = /^(rgb\()?(\d+),\s*(\d+),\s*(\d+)\)?$/.exec(x))
                match = [intify(match[2]), intify(match[3]), intify(match[4])];
            if (!noset)
                this.value = match;
            return match;
        };
        
        this.compute = function (from, to, delta) {
            for (var colors = [], toArray = this.parse(to, true), i = 0, l = this.value.length; i < l; ++i)
                colors.push(~~(compute(this.value[i], toArray[i], delta) + 0.5));
            return 'rgb(' + colors + ')';
        };
    },
    
    // Adapted from the MooTools Fx.Text plugin by André Fiedler (http://mootools.net/forge/p/fx_text)
    String: function () {
        this.parse = function (x) {
            return '' + x;
        };
        
        this.compute = function (from, to, delta) {
            from += '';
            to += '';
            var l = ~~(to.length * delta + 0.5);
            return to.substr(0, l) + from.substr(l, from.length - l - ~~((from.length - to.length) * delta + 0.5));
        };
    }
};

Viper.Parsers.Color.priority = 1;
Viper.Parsers.String.priority = -9;

Viper.noConflict = function () {
    window.Viper = old;
    return Viper;
};

window.Viper = Viper;

})(this);
