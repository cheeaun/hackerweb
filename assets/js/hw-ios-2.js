(function(w){
	var d = w.document;
	var body = d.body;

	var pfx = ['webkit', 'moz', 'MS', 'o', ''];
	var pfxLength = pfx.length;
	var prefixedAddEvent = function(element, type, callback){
		for (var p = 0; p < pfxLength; p++) {
			if (!pfx[p]) type = type.toLowerCase();
			element.addEventListener(pfx[p]+type, callback, false);
		}
	};
	var prefixedRemoveEvent = function(element, type, callback){
		for (var p = 0; p < pfxLength; p++) {
			if (!pfx[p]) type = type.toLowerCase();
			element.removeEventListener(pfx[p]+type, callback, false);
		}
	};

	var slideWise = {
		// outEl, inEl
		rtl: ['slide-out-to-left', 'slide-in-from-right'],
		ltr: ['slide-out-to-right', 'slide-in-from-left']
	};
	var slide = function(opts){
		var inEl = opts['in'];
		var outEl = opts.out;
		var inClass = inEl.classList;
		var outClass = outEl.classList;
		var direction = opts.direction;
		var wise = slideWise[direction];
		var reset = function(){
			outClass.add('hidden');
			outClass.remove(wise[0]);
			inClass.remove(wise[1]);
			prefixedRemoveEvent(inEl, 'AnimationEnd', reset);
		};
		prefixedAddEvent(inEl, 'AnimationEnd', reset);
		inClass.remove('hidden');
		inClass.add(wise[1]);
		outClass.add(wise[0]);
	};

	var pop = function(opts){
		var inEl = opts['in'];
		var outEl = opts.out;
		var inClass = inEl.classList;
		var outClass = outEl.classList;
		var direction = opts.direction;
		if (direction == 'up'){
			outClass.add('no-pointer');
			inClass.remove('hidden');
			inClass.add('slide-up');
		} else {
			var resetDown = function(){
				outClass.remove('slide-down');
				outClass.add('hidden');
				inClass.remove('no-pointer');
				prefixedRemoveEvent(outEl, 'AnimationEnd', resetDown);
			};
			prefixedAddEvent(outEl, 'AnimationEnd', resetDown);
			outClass.remove('slide-up');
			outClass.add('slide-down');
		}
	};

	var getScreenState = function(){
		return ((body.offsetWidth || w.innerWidth) > 736) ? 'wide' : 'narrow';
	};

	// Disable user scale of the viewport
	var vmeta = d.querySelector('meta[name=viewport]');
	if (!vmeta){
		vmeta = d.createElement('meta');
		vmeta.name = 'viewport';
		d.head.appendChild(vmeta);
	}
	vmeta.content = 'width=device-width, initial-scale=1.0, user-scalable=0, minimum-scale=1.0, maximum-scale=1.0';

	// Wide screen state
	var isWideScreen = getScreenState() == 'wide';
	w.addEventListener('resize', function(){
		var wide = getScreenState() == 'wide';
		if (wide != isWideScreen){
			isWideScreen = wide;
			location.reload();
		}
	});

	// Inject some elements for additional iOS decorations
	if (isWideScreen) body.insertAdjacentHTML('beforeend', '<div id="overlay" class="hide"></div>');

	// Detect if swiping from screen edges to navigate back/forward
	var swipeNav = false;
	document.addEventListener('touchstart', function(e){
		var touch = e.targetTouches[0];
		var x = touch.clientX;
		if (x < 20 || x > window.innerWidth-20) swipeNav = true;
	});
	document.addEventListener('touchend', function(e){
		swipeNav = false;
	});

	ruto.config({
		before: function(path, name, matches){
			var previousView = hw.previousView = hw.currentView;
			var currentView = hw.currentView = name;
			var hideAllViews = hw.hideAllViews;
			var view = $('view-' + currentView);
			hw.setTitle(view.querySelector('header h1').textContent);

			switch (currentView){
				case 'home':
					if (!isWideScreen){
						if (previousView == 'comments' && !swipeNav){
							slide({
								'in': view,
								out: $('view-' + previousView),
								direction: 'ltr'
							});
						} else if (previousView == 'about' && !swipeNav){
							pop({
								'in': view,
								out: $('view-' + previousView),
								direction: 'down'
							});
						} else {
							hideAllViews();
							view.classList.remove('hidden');
						}
					} else {
						hideAllViews();
						$('overlay').classList.add('hide');
						view.classList.remove('hidden');
						var viewComments = $('view-comments');
						viewComments.classList.remove('hidden');
						viewComments.querySelector('section').innerHTML = '<div class="view-blank-state"><div class="view-blank-state-text">No Story Selected.</div></div>';
						viewComments.querySelector('header h1').innerHTML = '';
						viewComments.querySelector('header a.header-back-button').style.display = 'none';
						hw.comments.currentID = null;
						hw.pub('selectCurrentStory');
					}
					break;
				case 'about':
					if (!isWideScreen){
						if (previousView == 'home' && !swipeNav){
							pop({
								'in': view,
								out: $('view-' + previousView),
								direction: 'up'
							});
						} else {
							hideAllViews();
							var $viewHome = $('view-home');
							$viewHome.classList.remove('hidden');
							view.classList.remove('hidden');
						}
					} else {
						view.classList.remove('hidden');
						$('view-home').classList.remove('hidden');
						$('view-comments').classList.remove('hidden');
						setTimeout(function(){
							$('overlay').classList.remove('hide');
						}, 1);
					}
					// Track if anyone click 'About'
					if (typeof ga != 'undefined') ga('send', 'pageview', path);
					break;
				case 'comments':
					if (!isWideScreen){
						if (previousView == 'home' && !swipeNav){
							var id = matches[1];
							if (id && hw.comments.currentID != id) view.querySelector('section').scrollTop = 0;
							slide({
								'in': view,
								out: $('view-' + previousView),
								direction: 'rtl'
							});
						} else {
							hideAllViews();
							view.classList.remove('hidden');
						}
					} else {
						hideAllViews();
						$('overlay').classList.add('hide');
						view.classList.remove('hidden');
						$('view-home').classList.remove('hidden');
						hw.pub('selectCurrentStory', matches[1]);
						view.querySelector('header a.header-back-button').style.display = '';
					}
					break;
			}
		}
	});

	// Remember scroll tops of each views
	w.addEventListener('pagehide', function(){
		var views = d.querySelectorAll('.view'),
			hackerScrollTops = {};
		for (var i=0, l=views.length; i<l; i++){
			var view = views[i];
			hackerScrollTops[view.id] = view.querySelector('.scroll section').scrollTop || 0;
		}
		amplify.store('hacker-scrolltops', hackerScrollTops);
	}, false);
	var restoreScrollTops = function(){
		var hackerScrollTops = amplify.store('hacker-scrolltops');
		for (var id in hackerScrollTops){
			var section = $(id).querySelector('.scroll section');
			section.scrollTop = hackerScrollTops[id];
		}
	};
	w.addEventListener('pageshow', restoreScrollTops, false);
	restoreScrollTops();

	tappable('.view>header a.header-button[href]', {
		noScroll: true,
		onTap: function(e, target){
			var hash = target.hash;
			// The close button in 'About' view
			if (isWideScreen && /about/i.test(ruto.current) && hash == '#/'){
				ruto.back('/');
			} else {
				location.hash = hash;
			}
		}
	});

	tappable('#view-home-refresh', {
		noScroll: true,
		onTap: hw.news.reload
	});

	var scrollingToTop = false;
	tappable('.view>header h1', {
		onTap: function(e, target){
			var section = target.parentNode.nextElementSibling.firstElementChild;
			if (section.scrollTop == 0 || scrollingToTop) return;
			// Scroll the section to top
			// Reset the overflow because the momentum ignores scrollTop setting
			if (scrollingToTop) return;
			scrollingToTop = true;
			var originalOverflow = section.style.overflow;
			section.style.overflow = 'hidden';
			setTimeout(function(){
				section.style.overflow = originalOverflow;
				var raf;
				var tween = new TWEEN.Tween({scrollTop: section.scrollTop})
					.to({scrollTop: 0}, 300)
					.easing(TWEEN.Easing.Cubic.InOut)
					.onUpdate(function(){
						section.scrollTop = this.scrollTop;
					})
					.onComplete(function(){
						cancelAnimationFrame(raf);
						tween.stop(); // Removes the tween object
						scrollingToTop = false;
						delete tween;
					})
					.start();
				var step = function(){
					TWEEN.update();
					requestAnimationFrame(step);
				};
				raf = requestAnimationFrame(step);
			}, 200);
		}
	});

	// iPad-specific code for selected items in the list
	// When you tap on an item and drag, selected item will be deselected
	// When drag is done, previous selected item will be re-selected
	var listTappedDelay;
	tappable('#view-home .tableview-links li>a:first-child', {
		allowClick: !isWideScreen,
		activeClassDelay: 100,
		inactiveClassDelay: isWideScreen ? 100 : 1000,
		onStart: function(e, target){
			if (isWideScreen){
				var ul = target.parentNode;
				if (ul){
					ul = ul.parentNode;
					listTappedDelay = setTimeout(function(){
						if (ul) ul.classList.add('list-tapped');
					}, 100);
				}
			}
		},
		onMove: function(){
			if (!isWideScreen) return;
			clearTimeout(listTappedDelay);
		},
		onEnd: function(e, target){
			if (!isWideScreen) return;
			clearTimeout(listTappedDelay);
			var ul = target.parentNode.parentNode;
			setTimeout(function(){
				if (ul) ul.classList.remove('list-tapped');
			}, 100);
		},
		onTap: function(e, target){
			if (target.classList.contains('more-link')){
				hw.news.more(target);
			} else if (/^#\//.test(target.getAttribute('href'))){ // "local" links
				location.hash = target.hash;
			} else if (target.href && isWideScreen){
				w.open(target.href);
			}
		}
	});

	tappable('#view-about .grouped-tableview-links li>a:first-child', {
		allowClick: true,
		activeClassDelay: 100,
		inactiveClassDelay: 1000
	});

	tappable('#view-home .tableview-links li>a.detail-disclosure-button', {
		noScroll: true,
		noScrollDelay: 100,
		onTap: function(e, target){
			if (hw.currentView == 'comments') return;
			location.hash = target.hash;
		}
	});

	tappable('button.comments-toggle', function(e, target){
		hw.comments.toggle(target);
	});

	tappable('#view-comments .load-error button', hw.comments.reload);

	hw.sub('selectCurrentStory', function(id){
		if (!isWideScreen) return;
		if (!id) id = (location.hash.match(/item\/(\d+)/) || [,''])[1];
		var homeView = $('view-home');
		var selectedLinks = homeView.querySelectorAll('a[href].selected');
		for (var i=0, l=selectedLinks.length; i<l; i++){
			selectedLinks[i].classList.remove('selected');
		}
		// If there's no ID, still clear the selected link
		if (!id) return;
		var link = homeView.querySelector('a[href*="item/' + id + '"]');
		if (link){
			link.classList.add('selected');
			setTimeout(function(){
				link.scrollIntoViewIfNeeded ? link.scrollIntoViewIfNeeded() : link.scrollIntoView();
			}, 1);
		}
	});
	hw.sub('onRenderNews', function(){
		hw.pub('selectCurrentStory');
	});

	// Auto-reload news for some specific situations...
	w.addEventListener('pageshow', function(){
		setTimeout(function(){
			if (hw.currentView == 'home' && $('hwlist') && !amplify.store('hacker-news-cached')){
				hw.news.reload();
			}
		}, 1);
	}, false);

	if (!isWideScreen){
		setTimeout(function(){
			var loader = $('apploader');
			if (!loader) return;
			loader.classList.add('hide');
			prefixedAddEvent(loader, 'TransitionEnd', function(){
				loader.parentNode.removeChild(loader);
			});
		}, 200);
	} else {
		var loader = $('apploader');
		loader.parentNode.removeChild(loader);
	}

	// Make about dialog animated after 400ms, for widescreen
	if (isWideScreen) setTimeout(function(){
		$('view-about').classList.add('animated');
	}, 400);

	hw.news.options.disclosure = !isWideScreen;
	hw.init();
})(window);

WebFontConfig = {
	google: { families: [ 'Inconsolata' ] }
};
(function() {
	var wf = document.createElement('script');
	wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
		'://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
	wf.type = 'text/javascript';
	wf.async = 'true';
	var s = document.getElementsByTagName('script')[0];
	s.parentNode.insertBefore(wf, s);
})();
