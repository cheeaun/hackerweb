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
		slide = function(el, direction){
			if (typeof el == 'string') el = $(el);
			var inout = (direction.match(/^in|out/i) || ['in'])[0];
			if (inout == 'in') el.classList.remove('hidden');
			var className = 'slide-' + direction,
				reset = function(){
					el.removeEventListener('webkitAnimationEnd', reset, false);
					if (inout == 'out') el.classList.add('hidden');
					el.classList.remove(className);
				};
			el.addEventListener('webkitAnimationEnd', reset, false);
			el.classList.add(className);
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
	
	var currentView = null;
	var routes = {
		'/': function(){
			var view = $('view-home');
			if (!currentView){
				hideAllViews();
				view.classList.remove('hidden');
			} else if (currentView != 'home'){
				slide('view-' + currentView, 'out-to-right');
				slide(view, 'in-from-left');
			}
			currentView = 'home';
		},
		'/item/(\\d+)': function(id){
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
				var post = amplify.store.sessionStorage('hacker-post-' + id),
					$commentsScroll = view.querySelector('.scroll'),
					loadPost = function(data){
						$commentsScroll.classList.remove('loading');
						if (!data) return;
						amplify.store.sessionStorage('hacker-post-' + id, data, {
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
				post ? loadPost(post) : hnapi.post(id, loadPost);
			}
		}
	};
	Router(routes).configure({
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
	
	tappable('.view>header a.header-button', {
		noScroll: true,
		onTap: function(e, target){
			location.hash = target.getAttribute('href');
		}
	});
	tappable('.view>header', {
		onTap: function(e, target){
			var section = target.nextElementSibling.firstElementChild;
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
	tappable('.view section ul li a:first-child', {
		allowClick: true,
		activeClassDelay: 100,
		inactiveClassDelay: 500
	});
	tappable('.view section ul li a.detail-disclosure', {
		noScroll: true,
		noScrollDelay: 100,
		onTap: function(e, target){
			location.hash = target.getAttribute('href');
		}
	});
	
	var $homeScroll = d.querySelector('#view-home .scroll'),
		loadNews = function(data){
			$homeScroll.classList.remove('loading');
			if (!data){
				alert('Things borked, try reload plz?');
				return;
			}
			amplify.store('hacker-news', data, {
				expires: 1000*60*10 // 10 minutes
			});
			var html = '',
				i = 1;
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
			$hnlist.innerHTML = html;
		};
	var news = amplify.store('hacker-news');
	$homeScroll.classList.add('loading');
	news ? loadNews(news) : hnapi.news(loadNews);
}(window, document);