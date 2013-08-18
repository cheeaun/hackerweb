(function(w){
	if (!w.addEventListener) return; // If the browser doesn't even support this, just give up.

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
		var vh = w.innerHeight;
		var style = $('view-height');
		if (!style){
			style = d.createElement('style');
			style.id = 'view-height';
			head.appendChild(style);
		}
		if (w.innerWidth >= 788) vh *= .85;
		style.textContent = '.view>.scroll{min-height: ' + vh + 'px}';
	};
	w.addEventListener('resize', adjustViewsHeight, false);
	w.addEventListener('orientationchange', adjustViewsHeight, false);
	adjustViewsHeight();

	ibento('#view-home-refresh', 'click', hw.news.reload);

	ibento('#view-home .more-link', 'click', function(e, target){
		hw.news.more(target);
	});

	ibento('button.comments-toggle', 'click', function(e, target){
		hw.comments.toggle(target);
	});

	ibento('section.comments li>a.more-link', 'click', function(e, target){
		hw.comments.more(target);
	});

	ibento('#view-comments .load-error button', 'click', hw.comments.reload);

	if (/Mobile;.*Firefox/.test(navigator.userAgent) && navigator.mozApps){ // Firefox Mobile
		var request = navigator.mozApps.getSelf(); // Check if installed on Firefox OS
		request.onsuccess = function(){
			if (request.result){
				// Bind all external links to window.open which invokes a system-provided "browser" window
				ibento('a[href]:not([href^="#"])', 'click', function(e, target){
					e.preventDefault();
					window.open(target.href, 'browser');
				});
			}
		}
	}

	window.onload = hw.init;
})(window);