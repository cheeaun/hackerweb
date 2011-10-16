/**
 * OverflowScrollingFix v1.0 ~ Developed by Matteo Spinelli, http://cubiq.org
 * Released "AS IS" with no warranty whatsoever to the public domain
 */

var OSFix = (function(){

// Constructor
var	OverflowScrollingFix = function (el) {
		if (!this.needFix) return;
		this.el = typeof el == 'object' ? el : document.querySelector(el);
		this.el.addEventListener('touchstart', this, false);
	};

// Prototype
OverflowScrollingFix.prototype = {
	needFix: 'webkitOverflowScrolling' in document.documentElement.style,

	handleEvent: function (e) {
		if (e.type == 'touchstart') this.touchStart(e);
	},

	touchStart: function (e) {
		var maxScroll = this.el.scrollHeight - this.el.offsetHeight;
		if (this.el.scrollTop <= 0) this.el.scrollTop = 1;
		else if (this.el.scrollTop >= maxScroll) this.el.scrollTop = maxScroll - 1;
	},

	destroy: function () {
		if (!this.needFix) return;
		this.el.removeEventListener('touchStart', this, false);
	}
};

return OverflowScrollingFix;

})();