!function(w, d){
	var body = d.body,
		$ = function(id){ return d.getElementById(id) },
		isStandalone = 'standalone' in w.navigator && w.navigator.standalone,
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
					inEl.classList.remove('flip');
					outEl.classList.remove('flip');
					outEl.classList.remove(wise[0]);
					inEl.classList.remove(wise[1]);
					outEl.classList.add('hidden');
					if (fn) fn.apply();
				};
			body.classList.add('viewport-flip');
			inEl.classList.add('flip');
			outEl.classList.add('flip');
			inEl.classList.remove('hidden');
			inEl.addEventListener('webkitAnimationEnd', reset, false);
			outEl.classList.add(wise[0]);
			inEl.classList.add(wise[1]);
		},
		slide = function(el, direction, fn){
			if (typeof el == 'string') el = $(el);
			var inout = (direction.match(/^in|out/i) || ['in'])[0];
			if (inout == 'in') el.classList.remove('hidden');
			var header = el.querySelector('header'),
				className = 'slide-' + direction,
				reset = function(){
					el.removeEventListener('webkitAnimationEnd', reset, false);
					header.classList.remove('transparent');
					if (inout == 'out') el.classList.add('hidden');
					el.classList.remove(className);
					el.classList.remove('sliding');
					if (fn) fn.apply();
				};
			el.addEventListener('webkitAnimationEnd', reset, false);
			header.classList.add('transparent');
			el.classList.add(className);
			el.classList.add('sliding');
		},
		tmplCache = {},
		tmpl = function(template, data){
			var t = tmplCache[template];
			if (!t){
				t = $(template + '-tmpl').textContent;
				tmplCache[template] = t;
			}
			if (!data) return t;
			return Mustache.to_html(t, data);
		};
	
	var $commentsScrollSection = d.querySelector('#view-comments .scroll section');
	$commentsScrollSection.addEventListener('scroll', function(){
		amplify.store('hacker-item-scrolltop', $commentsScrollSection.scrollTop);
	}, false);
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
				slide('view-' + currentView, 'out-to-right');
				slide(view, 'in-from-left');
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
					slide('view-' + currentView, 'out-to-left');
					slide(view, 'in-from-right');
				}
				currentView = 'comments';
				if (id){
					var post = amplify.store.sessionStorage('hacker-item-' + id),
						$commentsScroll = view.querySelector('.scroll'),
						loadPost = function(data){
							$commentsScroll.classList.remove('loading');
							if (!data) return;
							amplify.store.sessionStorage('hacker-item-' + id, data, {
								expires: 1000*60*10 // 10 minutes
							});
							var tmpl1 = tmpl('post-comments'),
								tmpl2 = tmpl('comments');
							data.title = data.title.replace(/([^\s])\s+([^\s]+)\s*$/, '$1&nbsp;$2');
							data.has_comments = !!data.comments.length;
							var html = Mustache.to_html(tmpl1, data, {comments_list: tmpl2});
							viewHeading.innerHTML = data.title;
							viewSection.innerHTML = html;
							var links = viewSection.querySelectorAll('a');
							for (var i=0, l=links.length; i<l; i++){
								links[i].target = '_blank';
							}
						};
					viewHeading.innerHTML = viewHeading.dataset.loadingText;
					viewSection.innerHTML = '';
					$commentsScroll.classList.add('loading');
					if (post){
						loadPost(post);
						$commentsScrollSection.scrollTop = amplify.store('hacker-item-scrolltop');
					} else {
						hnapi.item(id, loadPost);
						amplify.store('hacker-item-scrolltop', 0);
					}
				}
			},
			after: function(){
				amplify.store('hacker-item-scrolltop', 0);
			}
		}
	};

	if (isStandalone){
		var hash = amplify.store('hacker-hash');
		if (hash) location.hash = hash;
	}
	Router(routes).configure({
		on: function(){
			if (isStandalone) amplify.store('hacker-hash', location.hash);
		},
		notfound: function(){
			location.hash = '/';
		}
	}).init('/');
	
	var supportOrientation = typeof w.orientation != 'undefined',
		scrollTop = supportOrientation ? function(){
				body.style.height = screen.height + 'px';
				setTimeout(function(){
					w.scrollTo(0, 0);
					body.style.height = w.innerHeight + 'px';
				}, 1);
			} : function(){};
	if (supportOrientation) w.onorientationchange = scrollTop;
	scrollTop();
	
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
				news ? loadNews(news) : hnapi.news(loadNews);
			}, 500); // Cheat a little to make user think that it's doing something
		}
	});
	
	tappable('.view>header h1', {
		onTap: function(e, target){
			var section = target.parentNode.nextElementSibling.firstElementChild;
			if (section.scrollTop == 0) return;
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
	});
	tappable('.tableview-links li>a:first-child, .grouped-tableview-links li>a:first-child', {
		allowClick: true,
		activeClassDelay: 50,
		inactiveClassDelay: 1000,
		onTap: function(e, target){
			if (target.classList.contains('more-link')){
				var loadNews2 = function(data){
					target.classList.remove('loading');
					if (!data) return;
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
				}, 500) : hnapi.news2(loadNews2);
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
				html += tmpl('post', item);
			});
			return html;
		},
		loadNews = function(data){
			$homeScroll.classList.remove('loading');
			if (!data){
				alert('Things borked, try reload plz?');
				return;
			}
			amplify.store('hacker-news', data, {
				expires: 1000*60*10 // 10 minutes
			});
			var html = markupNews(data);
			html += '<li><a class="more-link">More&hellip;<span class="loader"></span></a></li>';
			$hnlist.innerHTML = html;
		};
	
	$homeScrollSection.addEventListener('scroll', function(){
		amplify.store('hacker-news-scrolltop', $homeScrollSection.scrollTop);
	}, false);
	
	var news = amplify.store('hacker-news');
	if (news){
		loadNews(news);
		$homeScrollSection.scrollTop = amplify.store('hacker-news-scrolltop');
	} else {
		$homeScroll.classList.add('loading');
		setTimeout(function(){
			hnapi.news(loadNews);
			amplify.store('hacker-news-scrolltop', 0);
		}, 100);
	}
}(window, document);