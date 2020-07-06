(function(w){
	var d = w.document,
		body = d.body,
		flipWise = {
			clockwise: ['flip-out-to-left', 'flip-in-from-left'],
			anticlockwise: ['flip-out-to-right', 'flip-in-from-right']
		},
		flip = function(opts){
			var inEl = opts['in'],
				outEl = opts.out,
				inClass = inEl.classList,
				outClass = outEl.classList,
				direction = opts.direction,
				fn = opts.fn,
				wise = flipWise[direction],
				reset = function(){
					inEl.removeEventListener('webkitAnimationEnd', reset, false);
					body.classList.remove('viewport-flip');
					outClass.add('hidden');
					inClass.remove('flip');
					outClass.remove('flip');
					outClass.remove(wise[0]);
					inClass.remove(wise[1]);
					if (fn) fn.apply();
				};
			body.classList.add('viewport-flip');
			inClass.remove('hidden');
			outClass.add('flip');
			inClass.add('flip');
			inEl.addEventListener('webkitAnimationEnd', reset, false);
			outClass.add(wise[0]);
			inClass.add(wise[1]);
		},
		slideWise = {
			rtl: ['slide-out-to-left', 'slide-in-from-right'],
			ltr: ['slide-out-to-right', 'slide-in-from-left']
		},
		slide = function(opts){
			var inEl = opts['in'],
				outEl = opts.out,
				inClass = inEl.classList,
				outClass = outEl.classList,
				inHeader = inEl.getElementsByTagName('header')[0],
				outHeader = outEl.getElementsByTagName('header')[0],
				inHeaderClass = inHeader.classList,
				outHeaderClass = outHeader.classList,
				direction = opts.direction,
				fn = opts.fn,
				wise = slideWise[direction],
				reset = function(){
					outClass.add('hidden');
					inEl.removeEventListener('webkitAnimationEnd', reset, false);
					outClass.remove('sliding');
					inClass.remove('sliding');
					outClass.remove(wise[0]);
					inClass.remove(wise[1]);
					inHeaderClass.remove('transparent');
					outHeaderClass.remove('transparent');
					if (fn) fn.apply();
				};
			inClass.remove('hidden');
			outClass.add('sliding');
			inClass.add('sliding');
			inEl.addEventListener('webkitAnimationEnd', reset, false);
			inHeaderClass.add('transparent');
			outHeaderClass.add('transparent');
			outClass.add(wise[0]);
			inClass.add(wise[1]);
		},
		getScreenState = function(){
			return w.innerWidth >= 640 ? 'wide' : 'narrow';
		};

	// Disable user scale of the viewport
	var vmeta = d.querySelector('meta[name=viewport]');
	if (!vmeta){
		vmeta = d.createElement('meta');
		vmeta.name = 'viewport';
		d.head.appendChild(vmeta);
	}
	vmeta.content = 'width=device-width, initial-scale=1.0, user-scalable=0, minimum-scale=1.0, maximum-scale=1.0';

	// Apply iOS < 6 styles, only for iPhone/iPod
	var ua = navigator.userAgent,
		isIPhoneIPod = ua && /iPhone|iPod/.test(ua),
		isIOS5 = parseInt((ua.match(/ OS (\d+)_/i) || [,0])[1], 10) < 6;
	if (isIPhoneIPod && isIOS5) body.classList.add('ios5');

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
	body.insertAdjacentHTML('beforeend', isWideScreen ? '<div id="overlay" class="hide"></div>' : '<header class="fake"></header>');

	ruto.config({
		before: function(path, name, matches){
			var currentView = hw.currentView;
			var hideAllViews = hw.hideAllViews;
			var view = $('view-' + name);
			hw.setTitle(view.querySelector('header h1').textContent);

			switch (name){
				case 'home':
					if (!isWideScreen){
						if (!currentView){
							hideAllViews();
							view.classList.remove('hidden');
						} else if (currentView == 'about'){
							flip({
								'in': view,
								out: $('view-' + currentView),
								direction: 'anticlockwise'
							});
						} else if (currentView != 'home'){
							slide({
								'in': view,
								out: $('view-' + currentView),
								direction: 'ltr'
							});
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
					hw.currentView = 'home';
					break;
				case 'about':
					if (!isWideScreen){
						if (!currentView){
							hideAllViews();
							view.classList.remove('hidden');
						} else if (currentView != 'about'){
							flip({
								'in': view,
								out: $('view-home'),
								direction: 'clockwise'
							});
						}
					} else {
						view.classList.remove('hidden');
						$('view-home').classList.remove('hidden');
						$('view-comments').classList.remove('hidden');
						setTimeout(function(){
							$('overlay').classList.remove('hide');
						}, 1);
					}
					hw.currentView = 'about';
					break;
				case 'comments':
					if (!isWideScreen){
						if (!currentView){
							hideAllViews();
							view.classList.remove('hidden');
						} else if (currentView != 'comments'){
							// Scroll to top first then slide, prevent Flash of Unscrolled View (FOUV)
							var id = matches[1];
							if (id && hw.comments.currentID != id) view.querySelector('section').scrollTop = 0;
							slide({
								'in': view,
								out: $('view-' + currentView),
								direction: 'rtl'
							});
						}
					} else {
						hideAllViews();
						$('overlay').classList.add('hide');
						view.classList.remove('hidden');
						$('view-home').classList.remove('hidden');
						hw.pub('selectCurrentStory', matches[1]);
						view.querySelector('header a.header-back-button').style.display = '';
					}
					hw.currentView = 'comments';
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
		setTimeout(function(){
			for (var id in hackerScrollTops){
				$(id).querySelector('.scroll section').scrollTop = hackerScrollTops[id];
			}
		}, 1);
	};
	w.addEventListener('pageshow', restoreScrollTops, false);
	restoreScrollTops();

	// Instantly hide address bar when start tapping the scroll area
	if (isIPhoneIPod){
		var $viewSections = d.querySelectorAll('.view>.scroll'),
			wInnerHeight = null;
		Array.prototype.forEach.call($viewSections, function(view){
			view.addEventListener('touchstart', function(){
				if (w.innerHeight != wInnerHeight){
					w.scrollTo(0, 0);
					if (isIOS5){
						var div = d.createElement('div');
						div.style.height = '600px';
						body.appendChild(div);
						setTimeout(function(){
							body.removeChild(div);
						}, 100);
					}
					wInnerHeight = w.innerHeight;
				}
			}, false);
		});
	}

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
			if (section.scrollTop == 0 || scrollingToTop){
				if (isIPhoneIPod){
					// Show address bar
					var oriHeight = body.style.height;
					body.style.height = '100%';
					setTimeout(function(){
						body.style.height = oriHeight;
					}, 100);
				}
			} else {
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

	// Adjust comments view min-height, a little higher than the scroll area
	// so that it's scrollable. Else, the whole page will scroll instead, which is rather 'ugly'.
	var adjustCommentsSection = function(){
		var viewSection = d.querySelector('#view-comments section');
		if (!viewSection) return;
		var postContentSection = viewSection.querySelector('.post-content');
		var commentsSection = viewSection.querySelector('.comments');
		if (!commentsSection) return;
		var minHeight = viewSection.offsetHeight - postContentSection.offsetHeight + 1;
		var style = $('comment-section-style');
		if (!style){
			style = d.createElement('style');
			style.id = 'comment-section-style';
			d.head.appendChild(style);
		}
		style.textContent = '.view section.comments{min-height: ' + minHeight + 'px;}';
	};
	hw.sub('onRenderComments', function(){
		setTimeout(adjustCommentsSection, isWideScreen ? 1 : 360); // >350ms, which is the sliding animation duration
	});
	w.addEventListener('resize', adjustCommentsSection, false);
	w.addEventListener('orientationchange', adjustCommentsSection, false);

	// Some useful tips from http://24ways.org/2011/raising-the-bar-on-mobile
	var supportOrientation = typeof w.orientation != 'undefined',
		getScrollTop = function(){
			return w.pageYOffset || d.compatMode === 'CSS1Compat' && d.documentElement.scrollTop || body.scrollTop || 0;
		},
		scrollTop = function(){
			if (!supportOrientation) return;
			body.style.height = screen.height + 'px';
			setTimeout(function(){
				w.scrollTo(0, 0);
				body.style.height = w.innerHeight + 'px';
			}, 1);
		};
	if (!isWideScreen){
		if (d.readyState == 'complete'){
			scrollTop();
		} else {
			w.addEventListener('load', scrollTop, false);
		}
		if (supportOrientation) w.onorientationchange = scrollTop;
	}

	hw.news.options.disclosure = !isWideScreen;
	hw.init();
})(window);