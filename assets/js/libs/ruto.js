/*!
 * ruto.js, yet another simple hash router
 *
 * Copyright 2012, Lim Chee Aun (http://cheeaun.com/)
 * Licensed under the MIT license.
 * http://cheeaun.mit-license.org/
 */

(function(w){
	var routes = [],
		noop = function(){},
		options = {
			defaultPath: '/',
			before: noop,
			on: noop,
			notfound: noop
		};

	var ruto = {
		current: null,
		previous: null,
		config: function(opts){
			for (var o in opts){
				if (opts.hasOwnProperty(o)) options[o] = opts[o];
			}
			return ruto;
		},
		add: function(path, name, fn){
			if (path && name){
				if (typeof name == 'function'){
					fn = name;
					name = null;
				}
				routes.push({
					path: path,
					name: name,
					fn: fn || function(){}
				});
			}
			return ruto;
		},
		go: function(path){
			location.hash = path;
			return ruto;
		},
		back: function(path){
			// Only 1-step back
			if (ruto.previous){
				history.back();
				ruto.previous = null;
			} else if (path){ // Fallback if can't go back
				location.hash = path;
			}
			return ruto;
		}
	};

	var hashchange = function(){
		var hash = location.hash.slice(1),
			found = false,
			current = ruto.current;

		if (!hash) hash = options.defaultPath;

		if (current && current != ruto.previous){
			ruto.previous = current;
		}
		ruto.current = hash;

		for (var i=0, l=routes.length; i<l && !found; i++){
			var route = routes[i],
				path = route.path,
				name = route.name,
				fn = route.fn;
			if (typeof path == 'string'){
				if (path.toLowerCase() == hash.toLowerCase()){
					options.before.call(ruto, path, name);
					fn.call(ruto);
					options.on.call(ruto, path, name);
					found = true;
				}
			} else { // regexp
				var matches = hash.match(path);
				if (matches){
					options.before.call(ruto, path, name, matches);
					fn.apply(ruto, matches);
					options.on.call(ruto, path, name, matches);
					found = true;
				}
			}
		}

		if (!found) options.notfound.call(ruto);

		return ruto;
	};
	ruto.init = function(path){
		w.addEventListener('hashchange', hashchange);
		return hashchange();
	};
	ruto.reload = hashchange;

	w.ruto = ruto;
})(window);