(function(w, d){
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
	
	var currentView = null,
		currentItemID = null;
	
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
					currentItemID = id;
					var post = amplify.store.sessionStorage('hacker-item-' + id),
						$commentsScroll = view.querySelector('.scroll'),
						loadComments = function(data, id){
							if (!data || data.error) return;
							amplify.store.sessionStorage('hacker-comments-' + id, data);
							var ul = viewSection.querySelector('.comments>ul');
							if (!ul.querySelector('.more-link-container')) ul.innerHTML += '<li class="more-link-container"><a class="more-link" data-id="' + id + '">More&hellip;</a></li>';
							if (!data.more_comments_id) return;
							// Keep getting more and more comments...
							var loadMoreComments = function(id){
								var comments = amplify.store.sessionStorage('hacker-comments-' + id);
								if (!comments){
									hnapi.comments(id, function(data){
										if (!data || data.error) return;
										amplify.store.sessionStorage('hacker-comments-' + id, data);
										if (data.more_comments_id) loadMoreComments(data.more_comments_id);
									});
								} else {
									if (comments.more_comments_id) loadMoreComments(comments.more_comments_id);
								}
							};
							loadMoreComments(data.more_comments_id);
						},
						loadPost = function(data, id){
							var tmpl1 = tmpl('post-comments'),
								tmpl2 = tmpl('comments'),
								a = d.createElement('a');
							// If "local" link, link to Hacker News web site
							if (/^item/i.test(data.url)){
								data.url = 'http://news.ycombinator.com/' + data.url;
							} else {
								a.href = data.url;
								data.domain = a.hostname.replace(/^www\./, '');
							}
							data.title = data.title.replace(/([^\s])\s+([^\s]+)\s*$/, '$1&nbsp;$2');
							data.has_comments = !!data.comments.length;
							data.i_point = data.points == 1 ? 'point' : 'points';
							data.i_comment = data.comments_count == 1 ? 'comment' : 'comments';
							data.has_content = !!data.content;
							if (data.poll){
								var total = 0;
								data.poll.forEach(function(p){
									var points = p.points;
									total += points;
									p.i_point = points == 1 ? 'point' : 'points';
								});
								data.poll.forEach(function(p){
									p.width = Math.ceil(p.points/total*100) + '%';
								});
								data.has_poll = data.has_content = true;
							}
							data.short_hn_url = 'news.ycombinator.com/item?id=' + id;
							data.hn_url = 'http://' + data.short_hn_url;
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
								subUl.classList.add('toggleable');
								if (commentsCount){
									subUl.insertAdjacentHTML('beforebegin', tmpl3.render({
										comments_count: commentsCount,
										i_reply: commentsCount == 1 ? 'reply' : 'replies'
									}));
								}
							}
							// Grab 'More' comments
							if (data.more_comments_id){
								var id = data.more_comments_id;
								var comments = amplify.store.sessionStorage('hacker-comments-' + id);
								if (comments){
									loadComments(comments, id);
								} else {
									hnapi.comments(id, function(data){
										loadComments(data, id);
									});
								}
							}
						};
					viewHeading.innerHTML = '';
					viewSection.innerHTML = '';
					if (post){
						loadPost(post, id);
					} else {
						$commentsScroll.classList.add('loading');
						hnapi.item(id, function(data){
							// Avoiding the case where the wrong post is loaded when connection is slow
							if (currentView != 'comments' || currentItemID != id) return;

							$commentsScroll.classList.remove('loading');
							if (!data || data.error){
								errors.serverError();
								return;
							}
							amplify.store.sessionStorage('hacker-item-' + id, data, {
								expires: 1000*60*5 // 5 minutes
							});
							loadPost(data, id);
						}, errors.connectionError);
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
			reloadNews({
				delay: 500 // Cheat a little to make user think that it's doing something
			});
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
					var targetParent = target.parentNode;
					targetParent.parentNode.removeChild(targetParent);
					var html = markupNews(data, 31);
					$hnlist.insertAdjacentHTML('beforeend', html);
				};
				var news2 = amplify.store('hacker-news2');
				target.classList.add('loading');
				if (news2){
					setTimeout(function(){
						target.classList.remove('loading');
						loadNews2(news2); // Cheat here too
					}, 500);
				} else {
					hnapi.news2(function(data){
						target.classList.remove('loading');
						if (!data  || data.error){
							errors.serverError();
							return;
						}
						amplify.store('hacker-news2', data);
						loadNews2(data);
					}, errors.connectionError);
				}
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
	tappable('.external-button', {
		allowClick: true,
		activeClassDelay: 80,
		inactiveClassDelay: 500
	})
	tappable('button.comments-toggle', function(e, target){
		var ul = target.nextElementSibling;
		if (ul){
			var ulStyle = ul.style;
			ulStyle.display = (ulStyle.display == 'none') ? '' : 'none';
		}
	});
	tappable('section.comments li>a.more-link', function(e, target){
		var id = target.dataset.id;
		var comments = amplify.store.sessionStorage('hacker-comments-' + id);
		if (comments){
			var tmpl1 = tmpl('comments'),
				html = tmpl1.render(comments, {comments_list: tmpl1}),
				li = target.parentNode,
				ul = li.parentNode,
				more_comments_id = comments.more_comments_id;
			if (more_comments_id && amplify.store.sessionStorage('hacker-comments-' + more_comments_id)){
				html += '<li class="more-link-container"><a class="more-link" data-id="' + more_comments_id + '">More&hellip;</a></li>';
			}
			ul.removeChild(li);
			ul.insertAdjacentHTML('beforeend', html);

			var links = ul.querySelectorAll('a');
			for (var i=0, l=links.length; i<l; i++){
				links[i].target = '_blank';
			}

			// Ugly selector here because I need to select only the immediate child ULs, not *all* child ULs
			var subUls = ul.parentNode.parentNode.querySelectorAll('.comments>ul>li>ul:not(.toggleable)');
			var tmpl2 = tmpl('comments-toggle');
			for (var i=0, l=subUls.length; i<l; i++){
				var subUl = subUls[i];
				var commentsCount = subUl.querySelectorAll('.metadata').length;
				subUl.style.display = 'none';
				subUl.classList.add('toggleable');
				if (commentsCount){
					subUl.insertAdjacentHTML('beforebegin', tmpl2.render({
						comments_count: commentsCount,
						i_reply: commentsCount == 1 ? 'reply' : 'replies'
					}));
				}
			}
		} else {
			// TODO: Need funnier error message than this.
			alert('Oops, the comments have expired.');
		}
	});
	
	var $homeScroll = d.querySelector('#view-home .scroll'),
		$homeScrollSection = $homeScroll.querySelector('section'),
		markupNews = function(data, i){
			var html = '';
			if (!i) i = 1;
			var a = d.createElement('a');
			data.forEach(function(item){
				item.title = item.title.replace(/([^\s])\s+([^\s]+)\s*$/, '$1&nbsp;$2');
				if (/^item/i.test(item.url)){
					item.url = '#/item/' + item.id;
				} else {
					item.external = true;
					a.href = item.url;
					item.domain = a.hostname.replace(/^www\./, '');
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
			var html = markupNews(data);
			html += '<li><a class="more-link">More&hellip;<span class="loader"></span></a></li>';
			$hnlist.innerHTML = html;
		},
		loadingNews = false,
		reloadNews = function(opts){
			if (loadingNews) return;
			if (!opts) opts = {};
			var news = amplify.store('hacker-news');
			if (news){
				var delay = opts.delay;
				if (delay){
					loadingNews = true;
					$hnlist.innerHTML = '';
					$homeScroll.classList.add('loading');
					setTimeout(function(){
						loadingNews = false;
						$homeScroll.classList.remove('loading');
						loadNews(news);
					}, delay);
				} else {
					loadNews(news);
				}
			} else {
				loadingNews = true;
				$hnlist.innerHTML = '';
				$homeScroll.classList.add('loading');
				hnapi.news(function(data){
					loadingNews = false;
					$homeScroll.classList.remove('loading');
					if (!data || data.error){
						errors.serverError();
						return;
					}
					amplify.store('hacker-news', data, {
						expires: 1000*60*5 // 5 minutes
					});
					loadNews(data);
					// Preload news2 to prevent discrepancies between /news and /news2 results
					hnapi.news2(function(data){
						if (!data || data.error){
							errors.serverError();
							return;
						}
						amplify.store('hacker-news2', data);
					});
				}, function(e){
					loadingNews = false;
					errors.connectionError(e);
				});
			}
		};
	
	reloadNews();
	// Auto-reload news for some specific situations...
	w.addEventListener('pageshow', function(){
		setTimeout(function(){
			if (currentView == 'home' && $hnlist.innerHTML && !amplify.store('hacker-news')){
				reloadNews();
			}
		}, 1);
	}, false);
	
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
					var loader = $('apploader');
					loader.classList.add('hide');
					loader.addEventListener('webkitTransitionEnd', function(){
						loader.parentNode.removeChild(loader);
					}, false);
				}, 400);
			}
		}, 15);
	}, false);

	// "Naturally" reload when an update is available
	if (w.applicationCache){
		var reload = false;
		w.applicationCache.addEventListener('updateready', function(){
			if (w.applicationCache.status == w.applicationCache.UPDATEREADY){
				w.applicationCache.swapCache();
				reload = true;
			}
		}, false);

		w.addEventListener('pageshow', function(){
			if (reload){
				 location.reload();
			} else if (!amplify.store('hacker-update-delay')){
				try { // There's nothing to update for first-time load, browser freaks out :/
					w.applicationCache.update();
					// Delay check update to after next 1 hour
					amplify.store('hacker-update-delay', 1, {
						expires: 1000*60*60 // 1 hour
					});
				} catch (e){}
			}
		}, false);
	}
	
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
})(window, document);