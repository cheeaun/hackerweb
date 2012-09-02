(function(w, d){
	var body = d.body,
		$ = function(id){ return d.getElementById(id) },
		hideAllViews = function(){
			var views = d.querySelectorAll('.view');
			for (var i=0, l=views.length; i<l; i++){
				views[i].classList.add('hidden');
			}
		},
		flipWise = {
			clockwise: ['flip-out-to-left', 'flip-in-from-left'],
			anticlockwise: ['flip-out-to-right', 'flip-in-from-right']
		},
		flip = function(opts){
			var inEl = opts.in,
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
			var inEl = opts.in,
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
		tmpl = function(template, data){
			var t = TEMPLATES[template];
			if (!t) return;
			if (!data) return t;
			return t.render(data);
		},
		getScreenState = function(){
			return /wide/i.test(w.getComputedStyle(body,':after').getPropertyValue('content')) ? 'wide' : 'narrow';
		},
		// Very basic object cloning, not deep.
		clone = function(obj){
			var target = {};
			for (var i in obj){
				if (obj.hasOwnProperty(i)) target[i] = obj[i];
			}
			return target;
		};

	// Wide screen state
	var isWideScreen = getScreenState() == 'wide';
	window.onresize = function(){
		var wide = getScreenState() == 'wide';
		if (wide != isWideScreen){
			isWideScreen = wide;
			location.reload();
		}
	};
	
	var currentView = null;
	
	var routes = {
		'/': function(){
			var view = $('view-home');
			if (!isWideScreen){
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
			} else {
				hideAllViews();
				$('overlay').classList.add('hide');
				view.classList.remove('hidden');
				var viewComments = $('view-comments');
				viewComments.classList.remove('hidden');
				viewComments.querySelector('section').innerHTML = '<div class="view-blank-state"><div class="view-blank-state-text">No Story Selected.</div></div>';
				viewComments.querySelector('header h1').innerHTML = '';
				viewComments.querySelector('header a.header-back-button').style.display = 'none';
				delete viewComments.dataset.id;
				PubSub.publish('updateCurrentStory');
			}
			currentView = 'home';
		},
		'/about': function(){
			var view = $('view-about');
			if (!isWideScreen){
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
			} else {
				view.classList.remove('hidden');
				$('view-home').classList.remove('hidden');
				$('view-comments').classList.remove('hidden');
				setTimeout(function(){
					$('overlay').classList.remove('hide');
				}, 1);
			}
			currentView = 'about';
		},
		'/item/(\\d+)': function(id){
			var view = $('view-comments');
			if (!isWideScreen){
				if (!currentView){
					hideAllViews();
					view.classList.remove('hidden');
				} else if (currentView != 'comments'){
					slide({
						in: view,
						out: $('view-' + currentView),
						direction: 'rtl'
					});
				}
			} else {
				hideAllViews();
				$('overlay').classList.add('hide');
				view.classList.remove('hidden');
				$('view-home').classList.remove('hidden');
				PubSub.publish('updateCurrentStory', id);
				view.querySelector('header a.header-back-button').style.display = '';
			}

			currentView = 'comments';
			if (id && view.dataset.id != id){
				view.dataset.id = id;

				var viewHeading = view.querySelector('header h1'),
					viewSection = view.querySelector('section');

				var post = amplify.store.sessionStorage('hacker-item-' + id),
					$commentsScroll = view.querySelector('.scroll'),
					loadComments = function(_data, id){
						if (!_data || _data.error) return;
						var data = clone(_data);
						amplify.store.sessionStorage('hacker-comments-' + id, data);
						var ul = viewSection.querySelector('.comments>ul');
						if (!ul.querySelector('.more-link-container')){
							ul.insertAdjacentHTML('beforeend', '<li class="more-link-container"><a class="more-link" data-id="' + id + '">More&hellip;</a></li>');
						}
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
					loadPost = function(_data, id){
						var data = clone(_data),
							tmpl1 = tmpl('post-comments');

						data.has_post = !!data.title;
						if (!data.has_post){
							viewHeading.innerHTML = '';
							viewSection.innerHTML = tmpl1.render(data);
							PubSub.publish('adjustCommentsSection');
							return;
						}

						var tmpl2 = tmpl('comments'),
							a = d.createElement('a');
						// If "local" link, link to Hacker News web site
						if (/^item/i.test(data.url)){
							data.url = 'http://news.ycombinator.com/' + data.url;
						} else {
							a.href = data.url;
							data.domain = a.hostname.replace(/^www\./, '');
						}
						data.has_comments = data.comments && !!data.comments.length;
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
								p.width = (p.points/total*100).toFixed(1) + '%';
							});
							data.has_poll = data.has_content = true;
						}
						data.short_hn_url = 'news.ycombinator.com/item?id=' + id;
						data.hn_url = 'http://' + data.short_hn_url;
						viewHeading.innerHTML = data.title;

						var html = tmpl1.render(data, {comments_list: tmpl2});
						var div = d.createElement('div');
						div.innerHTML = html;

						// Make all links open in new tab/window
						var links = div.querySelectorAll('a');
						for (var i=0, l=links.length; i<l; i++){
							links[i].target = '_blank';
						}

						// 20K chars will be the max to trigger collapsible comments.
						// I can use number of comments as the condition but some comments
						// might have too many chars and make the page longer.
						if (html.length > 20000){
							var subUls = div.querySelectorAll('.comments>ul>li>ul');
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
						}

						while (viewSection.hasChildNodes()){
							viewSection.removeChild(viewSection.childNodes[0]);
						}
						while (div.hasChildNodes()){
							viewSection.appendChild(div.childNodes[0]);
						}
						delete div;

						// Adjust comments section height
						setTimeout(function(){
							PubSub.publishSync('adjustCommentsSection');
						}, isWideScreen ? 1 : 360); // >350ms, which is the sliding animation duration

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

				if (post){
					$commentsScroll.querySelector('section').scrollTop = 0;
					loadPost(post, id);
				} else {
					// Render the post data concurrently while loading the comments
					// if the data is in 'news' or 'news2' cache
					var news = amplify.store('hacker-news');
					if (news){
						for (var i=0, l=news.length; i<l; i++){
							var p = news[i];
							if (id == p.id){
								post = p;
								break;
							}
						}
					}
					if (!post){
						var news = amplify.store('hacker-news2');
						if (news){
							for (var i=0, l=news.length; i<l; i++){
								var p = news[i];
								if (id == p.id){
									post = p;
									break;
								}
							}
						}
					}
					if (post){
						post.loading = true;
						loadPost(post, id);
					} else {
						loadPost({loading: true}, id);
					}
					var showError = function(){
						if (post){
							delete post.loading;
							post.load_error = true;
							loadPost(post, id);
						} else {
							loadPost({load_error: true}, id);
						}
					};
					hnapi.item(id, function(data){
						// Avoiding the case where the wrong post is loaded when connection is slow
						if (view.dataset.id != id) return;

						if (!data || data.error && currentView == 'comments'){
							showError();
							return;
						}
						amplify.store.sessionStorage('hacker-item-' + id, data, {
							expires: 1000*60*5 // 5 minutes
						});
						PubSub.publish('updateNewsStory', {
							id: id,
							data: data
						});
						loadPost(data, id);
					}, function(e){
						if (view.dataset.id != id) return;
						showError();
					});
				}
			}
		}
	};
	
	var prevRoute, currentRoute;
	var router = Router(routes).configure({
		on: function(){
			var _prevRoute = currentRoute;
			currentRoute = location.hash;
			// Sometimes the same route is triggered more than once
			// So, make sure the previous route is different than the current route
			if (_prevRoute != currentRoute) prevRoute = _prevRoute;
			amplify.store('hacker-hash', currentRoute);
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
			var hash = target.hash;
			if (isWideScreen && /about/i.test(currentRoute) && hash == '#/' && prevRoute){
				location.hash = prevRoute;
			} else {
				location.hash = hash;
			}
		}
	});
	tappable('#view-home-refresh', {
		noScroll: true,
		onTap: function(e){
			PubSub.publishSync('reloadNews', {
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
	var listTappedDelay;
	tappable('#view-home .tableview-links li>a:first-child', {
		allowClick: !isWideScreen,
		activeClassDelay: 100,
		inactiveClassDelay: isWideScreen ? 100 : 1000,
		onStart: function(e, target){
			if (isWideScreen){
				var ul = target.parentNode.parentNode;
				listTappedDelay = setTimeout(function(){
					ul.classList.add('list-tapped');
				}, 100);
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
				ul.classList.remove('list-tapped');
			}, 100);
		},
		onTap: function(e, target){
			if (target.classList.contains('more-link')){
				var loadNews2 = function(_data){
				};
				target.classList.add('loading');
				var news2 = amplify.store('hacker-news2');
				setTimeout(function(){
					target.classList.remove('loading');
					var targetParent = target.parentNode;
					targetParent.parentNode.removeChild(targetParent);
					if (!news2) return;
					var data = news2.slice();
					var html = markupNews(data, 31);
					$('hnlist').insertAdjacentHTML('beforeend', html);
				}, 500);
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
				tmpl2 = tmpl('comments'),
				html = tmpl1.render(comments, {comments_list: tmpl1}),
				li = target.parentNode,
				ul = li.parentNode,
				more_comments_id = comments.more_comments_id,
				_ul = d.createElement('ul');

			_ul.innerHTML = html;

			var links = _ul.querySelectorAll('a');
			for (var i=0, l=links.length; i<l; i++){
				links[i].target = '_blank';
			}

			var subLis = _ul.children;
			for (var i=0, l=subLis.length; i<l; i++){
				var subUl = subLis[i].getElementsByTagName('ul')[0];
				var commentsCount = subUl.querySelectorAll('.metadata').length;
				subUl.style.display = 'none';
				if (commentsCount){
					subUl.insertAdjacentHTML('beforebegin', tmpl2.render({
						comments_count: commentsCount,
						i_reply: commentsCount == 1 ? 'reply' : 'replies'
					}));
				}
			}

			if (more_comments_id && amplify.store.sessionStorage('hacker-comments-' + more_comments_id)){
				_ul.insertAdjacentHTML('beforeend', '<li class="more-link-container"><a class="more-link" data-id="' + more_comments_id + '">More&hellip;</a></li>');
			}
			ul.removeChild(li);
			while (_ul.hasChildNodes()){
				ul.appendChild(_ul.childNodes[0]);
			}
			delete _ul;
		} else {
			// TODO: Need funnier error message than this.
			alert('Oops, the comments have expired.');
		}
	});
	tappable('#view-comments .load-error button', function(){
		delete $('view-comments').dataset.id; // Force re-dispatch of route
		router.dispatch('on', location.hash.slice(1));
	});

	PubSub.subscribe('updateCurrentStory', function(msg, id){
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

	PubSub.subscribe('updateNewsStory', function(msg, story){
		if (!story || !story.id) return;
		var id = story.id;
		var data = story.data;
		var post;
		var newsCache = 'hacker-news';
		var news = amplify.store(newsCache);
		if (news){
			for (var i=0, l=news.length; i<l; i++){
				var p = news[i];
				if (id == p.id){
					post = p;
					break;
				}
			}
		}
		if (!post){
			newsCache = 'hacker-news2';
			news = amplify.store(newsCache);
			if (news){
				for (var i=0, l=news.length; i<l; i++){
					var p = news[i];
					if (id == p.id){
						post = p;
						break;
					}
				}
			}
		}
		if (!post) return;
		// Pass in the possibly changed values
		var changed = false;
		['title', 'url',  'time_ago', 'comments_count', 'points'].forEach(function(key){
			var val = data[key];
			if (post[key] != val){
				post[key] = val;
				changed = true;
			}
		});
		if (!changed) return;
		// Update the news cache
		amplify.store(newsCache, news);
		// Update the story in the news list
		var storyEl = $('story-' + id);
		if (!storyEl) return;
		post.selected = !!storyEl.querySelector('a[href].selected');
		post.i = storyEl.dataset.index;
		storyEl.insertAdjacentHTML('afterend', markupStory(post));
		storyEl.parentNode.removeChild(storyEl);
	});
	
	var $homeScroll = d.querySelector('#view-home .scroll'),
		$homeScrollSection = $homeScroll.querySelector('section'),
		markupStory = function(item){
			if (/^item/i.test(item.url)){
				item.url = '#/item/' + item.id;
			} else {
				item.external = true;
				var a = d.createElement('a');
				a.href = item.url;
				item.domain = a.hostname.replace(/^www\./, '');
				delete a;
			}
			if (isWideScreen){
				item.url = item.id ? ('#/item/' + item.id) : item.url;
			} else {
				if (item.type == 'link') item.detail_disclosure = true;
				if (/^#\//.test(item.url)) item.disclosure = true;
			}
			item.i_point = item.points == 1 ? 'point' : 'points';
			item.i_comment = item.comments_count == 1 ? 'comment' : 'comments';
			return tmpl('post', item);
		},
		markupNews = function(data, i){
			var html = '';
			if (!i) i = 1;
			data.forEach(function(item){
				item.i = i++;
				html += markupStory(item);
			});
			return html;
		},
		loadNews = function(_data){
			var data = _data.slice();
			var html = '<ul class="tableview tableview-links" id="hnlist">'
				+ markupNews(data)
				+ (amplify.store('hacker-news2') ? '<li><a class="more-link">More&hellip;<span class="loader"></span></a></li>' : '')
				+ '</ul>';
			$homeScrollSection.innerHTML = html;
			PubSub.publish('updateCurrentStory');
		},
		loadingNews = false;
	
	PubSub.subscribe('reloadNews', function(msg, opts){
		if (loadingNews) return;
		if (!opts) opts = {};
		var cached = amplify.store('hacker-news-cached');
		var tmpl1 = tmpl('stories-load');
		if (cached){
			var news = amplify.store('hacker-news');
			var delay = opts.delay;
			if (delay){
				loadingNews = true;
				$homeScrollSection.innerHTML = tmpl1.render({loading: true});
				setTimeout(function(){
					loadingNews = false;
					loadNews(news);
				}, delay);
			} else {
				loadNews(news);
			}
		} else {
			loadingNews = true;
			$homeScrollSection.innerHTML = tmpl1.render({loading: true});
			var showError = function(){
				$homeScrollSection.innerHTML = tmpl1.render({load_error: true});
			};
			hnapi.news(function(data){
				loadingNews = false;
				if (!data || data.error){
					showError();
					return;
				}
				amplify.store('hacker-news', data);
				amplify.store('hacker-news-cached', true, {
					expires: 1000*60*10 // 10 minutes
				});
				amplify.store('hacker-news2', null);
				loadNews(data);
				// Preload news2 to prevent discrepancies between /news and /news2 results
				hnapi.news2(function(data){
					if (!data || data.error) return;
					amplify.store('hacker-news2', data);
					$('hnlist').insertAdjacentHTML('beforeend', '<li><a class="more-link">More&hellip;<span class="loader"></span></a></li>');
				});
			}, function(e){
				loadingNews = false;
				showError();
			});
		}
	});

	PubSub.publish('reloadNews');

	// Auto-reload news for some specific situations...
	w.addEventListener('pageshow', function(){
		setTimeout(function(){
			if (currentView == 'home' && $('hnlist') && !amplify.store('hacker-news-cached')){
				PubSub.publishSync('reloadNews');
			}
		}, 1);
	}, false);

	PubSub.subscribe('adjustCommentsSection', function(){
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
	});

	window.addEventListener('resize', function(){
		PubSub.publishSync('adjustCommentsSection');
	}, false);
	window.addEventListener('orientationchange', function(){
		PubSub.publishSync('adjustCommentsSection');
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
	if (!isWideScreen){
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
	} else {
		var loader = $('apploader');
		loader.parentNode.removeChild(loader);
	}

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