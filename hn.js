!function(w, d){
	var body = d.body,
		$ = function(id){ return d.getElementById(id) },
		$hnlist = $('hnlist'),
		hideAllViews = function(){
			var views = d.querySelectorAll('.view');
			for (var i=0, l=views.length; i<l; i++){
				views[i].classList.add('hidden');
			}
		},
		flip = function(opts){
			var inEl = opts.in,
				outEl = opts.out,
				inClass = inEl.classList,
				outClass = outEl.classList,
				direction = opts.direction,
				fn = opts.fn,
				flipWise = {
					clockwise: ['flip-out-to-left', 'flip-in-from-left'],
					anticlockwise: ['flip-out-to-right', 'flip-in-from-right']
				},
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
		slide = function(opts){
			var inEl = opts.in,
				outEl = opts.out,
				inClass = inEl.classList,
				outClass = outEl.classList,
				direction = opts.direction,
				fn = opts.fn,
				slideWise = {
					rtl: ['slide-out-to-left', 'slide-in-from-right'],
					ltr: ['slide-out-to-right', 'slide-in-from-left']
				}
				wise = slideWise[direction],
				reset = function(){
					inEl.removeEventListener('webkitAnimationEnd', reset, false);
					outClass.add('hidden');
					outClass.remove('sliding');
					inClass.remove('sliding');
					outClass.remove(wise[0]);
					inClass.remove(wise[1]);
					inHeader.classList.remove('transparent');
					outHeader.classList.remove('transparent');
					if (fn) fn.apply();
				};
			var inHeader = inEl.querySelector('header'),
				outHeader = outEl.querySelector('header');
			inClass.remove('hidden');
			outClass.add('sliding');
			inClass.add('sliding');
			inEl.addEventListener('webkitAnimationEnd', reset, false);
			inHeader.classList.add('transparent');
			outHeader.classList.add('transparent');
			outClass.add(wise[0]);
			inClass.add(wise[1]);
		},
		tmpl = function(template, data){
			var t = TEMPLATES[template];
			if (!t) return;
			if (!data) return t;
			return t.render(data);
		},
		errors = {
			connectionError: function(e){
				alert('Could not connect to server.');
				throw e;
			},
			serverError: function(e){
				alert('Server is currently unavailable. Please try again later.');
				throw e;
			}
		};
	
	var currentView = null;
	
	var routes = {
		'/': function(){
			var view = $('view-home');
			if (!currentView){
				hideAllViews();
				view.classList.remove('hidden');
			} else if (currentView == 'about'){
				flip({
					in: view,
					out: $('view-' + currentView),
					direction: 'anticlockwise'
				});
			} else if (currentView != 'home'){
				slide({
					in: view,
					out: $('view-' + currentView),
					direction: 'ltr'
				});
			}
			currentView = 'home';
		},
		'/about': function(){
			var view = $('view-about');
			if (!currentView){
				hideAllViews();
				view.classList.remove('hidden');
			} else if (currentView != 'about'){
				flip({
					in: view,
					out: $('view-home'),
					direction: 'clockwise'
				});
			}
			currentView = 'about';
		},
		'/item/(\\d+)': {
			on: function(id){
				var view = $('view-comments'),
					viewHeading = view.querySelector('header h1'),
					viewSection = view.querySelector('section');
				if (!currentView){
					hideAllViews();
					view.classList.remove('hidden');
				} else if (currentView != 'comments') {
					slide({
						in: view,
						out: $('view-' + currentView),
						direction: 'rtl'
					});
				}
				currentView = 'comments';
				if (id){
					var post = amplify.store.sessionStorage('hacker-item-' + id),
						$commentsScroll = view.querySelector('.scroll'),
						loadPost = function(data){
							$commentsScroll.classList.remove('loading');
							if (!data || data.error){
								errors.serverError();
								return;
							}
							amplify.store.sessionStorage('hacker-item-' + id, data, {
								expires: 1000*60*10 // 10 minutes
							});
							var tmpl1 = tmpl('post-comments'),
								tmpl2 = tmpl('comments');
							data.title = data.title.replace(/([^\s])\s+([^\s]+)\s*$/, '$1&nbsp;$2');
							data.has_comments = !!data.comments.length;
							data.i_point = data.points == 1 ? 'point' : 'points';
							data.i_comment = data.comments_count == 1 ? 'comment' : 'comments';
							if (data.poll){
								data.poll.forEach(function(p){
									p.i_point = p.points == 1 ? 'point' : 'points';
								})
							}
							var html = tmpl1.render(data, {comments_list: tmpl2});
							viewHeading.innerHTML = data.title;
							viewSection.innerHTML = html;
							var links = viewSection.querySelectorAll('a');
							for (var i=0, l=links.length; i<l; i++){
								links[i].target = '_blank';
							}
							// 20K chars will be the max to trigger collapsible comments.
							// I can use number of comments as the condition but some comments
							// might have too many chars and make the page longer.
							if (html.length <= 20000) return;
							var subUls = viewSection.querySelectorAll('.comments>ul>li>ul');
							var tmpl3 = tmpl('comments-toggle');
							for (var j=0, l=subUls.length; j<l; j++){
								var subUl = subUls[j],
									commentsCount = subUl.querySelectorAll('.metadata').length;
								subUl.style.display = 'none';
								if (commentsCount){
									subUl.insertAdjacentHTML('beforebegin', tmpl3.render({
										comments_count: commentsCount,
										i_reply: commentsCount == 1 ? 'reply' : 'replies'
									}));
								}
							}
						};
					viewHeading.innerHTML = '';
					viewSection.innerHTML = '';
					$commentsScroll.classList.add('loading');
					if (post){
						loadPost(post);
					} else {
						hnapi.item(id, loadPost, errors.connectionError);
					}
				}
			}
		}
	};
	
	Router(routes).configure({
		on: function(){
			amplify.store('hacker-hash', location.hash);
		},
		notfound: function(){
			location.hash = '/';
		}
	}).init(amplify.store('hacker-hash') || '/');
	
	w.addEventListener('pagehide', function(){
		amplify.store('hacker-hash', location.hash);
		var views = d.querySelectorAll('.view'),
			hackerScrollTops = {};
		for (var i=0, l=views.length; i<l; i++){
			var view = views[i],
				viewID = view.id,
				scrollSection = view.querySelector('.scroll section');
			hackerScrollTops[viewID] = scrollSection.scrollTop || 0;
		}
		amplify.store('hacker-scrolltops', hackerScrollTops);
	}, false);
	w.addEventListener('pageshow', function(){
		var hash = amplify.store('hacker-hash'),
			hackerScrollTops = amplify.store('hacker-scrolltops');
		setTimeout(function(){
			if (hash) location.hash = hash;
			for (var id in hackerScrollTops){
				$(id).querySelector('.scroll section').scrollTop = hackerScrollTops[id];
			}
		}, 1);
	}, false);
	
	var $viewSections = d.querySelectorAll('.view>.scroll');
	for (var i=0, l=$viewSections.length; i<l; i++){
		var view = $viewSections[i];
		view.addEventListener('touchstart', function(){
			w.scrollTo(0, 0);
		}, false);
	}
	
	tappable('.view>header a.header-button[href]', {
		noScroll: true,
		onTap: function(e, target){
			location.hash = target.hash;
		}
	});
	tappable('#view-home-refresh', {
		noScroll: true,
		onTap: function(e){
			$hnlist.innerHTML = '';
			$homeScroll.classList.add('loading');
			setTimeout(function(){
				var news = amplify.store('hacker-news');
				if (news){
					loadNews(news);
				} else {
					hnapi.news(function(news){
						loadNews(news);
						// Force preload news2 if news expired
						hnapi.news2(function(data){
							if (!data || data.error){
								errors.serverError();
								return;
							}
							amplify.store('hacker-news2', data, {
								expires: 1000*60*5 // 5 minutes
							});
						});
					}, errors.connectionError);
				}
			}, 500); // Cheat a little to make user think that it's doing something
		}
	});
	
	tappable('.view>header h1', {
		onTap: function(e, target){
			var section = target.parentNode.nextElementSibling.firstElementChild;
			if (section.scrollTop == 0){
				// Show address bar
				var originalHeight = body.style.height;
				body.style.height = '100%';
				setTimeout(function(){
					body.style.height = originalHeight;
				}, 1);
			} else {
				// Scroll the section to top
				// Reset the overflow because the momentum ignores scrollTop setting
				var originalOverflow = section.style.overflow;
				section.style.overflow = 'hidden';
				setTimeout(function(){
					section.style.overflow = originalOverflow;
					var anim = Viper({
						object: section,
						transition: Viper.Transitions.sine,
						property: 'scrollTop',
						to: 0,
						fps: 60 // pushing the limit?
					});
					anim.start();
					anim = null;
				}, 300);
			}
		}
	});
	tappable('.tableview-links li>a:first-child, .grouped-tableview-links li>a:first-child', {
		allowClick: true,
		activeClassDelay: 80,
		inactiveClassDelay: 1000,
		onTap: function(e, target){
			if (target.classList.contains('more-link')){
				var loadNews2 = function(data){
					target.classList.remove('loading');
					if (!data  || data.error){
						errors.serverError();
						return;
					}
					var targetParent = target.parentNode;
					targetParent.parentNode.removeChild(targetParent);
					amplify.store('hacker-news2', data, {
						expires: 1000*60*5 // 5 minutes
					});
					var html = markupNews(data, 31);
					$hnlist.insertAdjacentHTML('beforeend', html);
				};
				var news2 = amplify.store('hacker-news2');
				target.classList.add('loading');
				news2 ? setTimeout(function(){
					loadNews2(news2); // Cheat here too
				}, 500) : hnapi.news2(loadNews2, errors.connectionError);
			} else if (/^#\//.test(target.getAttribute('href'))){ // "local" links
				location.hash = target.hash;
			}
		}
	});
	tappable('.tableview-links li>a.detail-disclosure', {
		noScroll: true,
		noScrollDelay: 100,
		onTap: function(e, target){
			location.hash = target.hash;
		}
	});
	tappable('button.comments-toggle', function(e, target){
		var ul = target.nextElementSibling;
		if (ul){
			var ulStyle = ul.style;
			ulStyle.display = (ulStyle.display == 'none') ? '' : 'none';
		}
	});
	
	var $homeScroll = d.querySelector('#view-home .scroll'),
		$homeScrollSection = $homeScroll.querySelector('section'),
		markupNews = function(data, i){
			var html = '';
			if (!i) i = 1;
			data.forEach(function(item){
				item.title = item.title.replace(/([^\s])\s+([^\s]+)\s*$/, '$1&nbsp;$2');
				if (/^item/i.test(item.url)){
					item.url = '#/item/' + item.id;
				} else {
					item.external = true;
				}
				if (item.type == 'link') item.disclosure = true;
				item.i = i++;
				item.i_point = item.points == 1 ? 'point' : 'points';
				item.i_comment = item.comments_count == 1 ? 'comment' : 'comments';
				html += tmpl('post', item);
			});
			return html;
		},
		loadNews = function(data){
			$homeScroll.classList.remove('loading');
			if (!data || data.error){
				errors.serverError();
				return;
			}
			amplify.store('hacker-news', data, {
				expires: 1000*60*10 // 10 minutes
			});
			var html = markupNews(data);
			html += '<li><a class="more-link">More&hellip;<span class="loader"></span></a></li>';
			$hnlist.innerHTML = html;
		};
	
	var news = amplify.store('hacker-news');
	if (news){
		loadNews(news);
	} else {
		$homeScroll.classList.add('loading');
		w.addEventListener('load', function(){
			// Slight delay to make Mobile Safari thinks that page is already loaded
			// and hides the location bar
			setTimeout(function(){
				hnapi.news(function(news){
					loadNews(news);
					// Preload news2 to prevent discrepancies between /news and /news2 results
					hnapi.news2(function(data){
						if (!data || data.error){
							errors.serverError();
							return;
						}
						amplify.store('hacker-news2', data, {
							expires: 1000*60*5 // 5 minutes
						});
					});
				}, errors.connectionError);
			}, 1);
		});
	}
	
	// Some useful tips from http://24ways.org/2011/raising-the-bar-on-mobile
	var supportOrientation = typeof w.orientation != 'undefined',
		getScrollTop = function(){
			return w.pageYOffset || d.compatMode === 'CSS1Compat' && d.documentElement.scrollTop || body.scrollTop || 0;
		},
		scrollTop = function(){
			if (!supportOrientation) return;
			body.style.height = screen.height + 'px';
			setTimeout(function(){
				w.scrollTo(0, 1);
				var top = getScrollTop();
				w.scrollTo(0, top === 1 ? 0 : 1);
				body.style.height = w.innerHeight + 'px';
			}, 1);
		};
	scrollTop();
	if (supportOrientation) w.onorientationchange = scrollTop;
	
	w.addEventListener('load', function(){
		var scrollCheck = setInterval(function(){
			var top = getScrollTop();
			if (top <= 1){
				clearInterval(scrollCheck);
				setTimeout(function(){
					body.classList.add('show');
				}, 400);
			}
		}, 15);
	}, false);

	// Programmatically update the app cache
	if (w.applicationCache) w.addEventListener('load', function(){
		w.applicationCache.addEventListener('updateready', function(){
			if (w.applicationCache.status == w.applicationCache.UPDATEREADY){
				w.applicationCache.swapCache();
			}
		}, false);
	}, false);
	
	// Use GA to track the update rate of this manifest appcache thing
	// and see how fast users are updated to the latest cache/version
	if (typeof _gaq != 'undefined' && w.applicationCache) w.addEventListener('load', function(){
		setTimeout(function(){
			var r = new XMLHttpRequest();
			r.open('GET', 'manifest.appcache', true);
			r.onload = function(){
				var text = this.responseText;
				if (!text) return;
				var version = (text.match(/#\s\d[^\n\r]+/) || [])[0];
				if (version) _gaq.push(['_trackEvent', 'Appcache', 'Version', version.replace(/^#\s/, '')]);
			};
			r.send();
		}, 1000);
	}, false);
}(window, document);