(function(w){
	var d = w.document,
		body = d.body,
		scrollTops = {},
		scrollTimeout,
		getScrollTop = function(){
			return w.pageYOffset || d.compatMode === 'CSS1Compat' && d.documentElement.scrollTop || body.scrollTop || 0;
		},
		saveScrollTop = function(){
			scrollTops[location.hash.slice(1)] = getScrollTop();
		};
	w.addEventListener('scroll', function(){
		// debouncing scrolls
		clearTimeout(scrollTimeout);
		scrollTimeout = setTimeout(saveScrollTop, 500);
	}, false);
	ruto.config({
		on: function(){
			var hash = location.hash.slice(1);
			w.scrollTo(0, scrollTops[hash] || 0);
			scrollTops[hash] = getScrollTop();
		}
	});

	// Adjust min-height on the views based on the viewport
	// While waiting for viewport units to be more widely supported by modern browsers
	var head = d.head || d.getElementsByTagName('head')[0];
	var adjustViewsHeight = function(){
		var vh = window.innerHeight;
		var style = $('view-height');
		if (!style){
			style = d.createElement('style');
			style.id = 'view-height';
			head.appendChild(style);
		}
		style.textContent = '.view>.scroll{min-height: ' + (vh*.85) + 'px}';
	}
	w.addEventListener('resize', adjustViewsHeight, false);
	w.addEventListener('orientationchange', adjustViewsHeight, false);
	adjustViewsHeight();

	ibento('#view-home-refresh', 'click', hn.news.reload);

	ibento('#view-home .more-link', 'click', function(e, target){
		hn.news.more(target);
	});

	ibento('button.comments-toggle', 'click', function(e, target){
		hn.comments.toggle(target);
	});

	ibento('section.comments li>a.more-link', 'click', function(e, target){
		hn.comments.more(target);
	});

	ibento('#view-comments .load-error button', 'click', hn.comments.reload);

	hn.init();
})(window);