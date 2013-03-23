/*!
 * ibento.js, super duper simple event delegation
 *
 * Copyright 2012, Lim Chee Aun (http://cheeaun.com/)
 * Licensed under the MIT license.
 * http://cheeaun.mit-license.org/
 */

(function(w){
	var d = w.document,
		matchesSelector = function(node, selector){
			var root = d.documentElement,
			matches = root.matchesSelector || root.mozMatchesSelector || root.webkitMatchesSelector || root.oMatchesSelector || root.msMatchesSelector;
			return matches.call(node, selector);
		},
		closest = function(node, selector){
			var matches = false;
			do {
				matches = matchesSelector(node, selector);
			} while (!matches && (node = node.parentNode) && node.ownerDocument);
			return matches ? node : false;
		};

	w.ibento = function(selector, event, fn){
		var body = d.body;
		body.addEventListener(event, function(e){
			var target = closest(e.target, selector);
			if (!target) return;
			fn.call(body, e, target);
		});
	};

})(window);