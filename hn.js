!function(w, d){
	var body = d.body,
		$hnlist = d.getElementById('hnlist');
	
	w.loadNews = function(data){
		if (!data || !data.query || !data.query.results){
			alert('Things borked, try reload plz?');
			return;
		}
		var html = '',
			a = d.createElement('a');
		data.query.results.items.forEach(function(item){
			if (!item.item_id) return;
			a.href = item.url;
			var domain = a.hostname.replace('www.', '');
			html += '<li>'
					+ '<a href="' + item.url + '" target="_blank">'
						+ '<b>' + item.title.replace(/([^\s])\s+([^\s]+)\s*$/, '$1&nbsp;$2') + '</b>'
						+ '<span class="metadata">' + domain + '<br>' + item.score + ' by ' + item.user + ' ' + item.time + '</span>'
					+ '</a>'
				+ '</li>';
		});
		$hnlist.innerHTML = html;
		amplify.store('news', data, {
			expires: 1000*60*10 // 10 minutes
		});
	};
	
	var scrollTop = function(){
		body.style.height = screen.height + 'px';
		setTimeout(function(){
			w.scrollTo(0, 0);
			body.style.height = w.innerHeight + 'px';
		}, 1);
	};
	w[(typeof w.orientation != 'undefined') ? 'onorientationchange' : 'resize'] = scrollTop;
	scrollTop();
	
	var $viewSections = d.querySelectorAll('.view>section');
	for (var i=0, l=$viewSections.length; i<l; i++){
		var view = $viewSections[i];
		new ScrollFix(view);
		var tappedEl,
			tappedTimeout,
			moved = false;
			clearTappedEl = function(){
				if (!tappedEl) return;
				clearTimeout(tappedTimeout);
				tappedEl.classList.remove('tapped');
				tappedEl = null;
			};
		view.onscroll = function(){
			moved = false;
		};
		tappable(view, {
			allowClick: true,
			onStart: function(e, target){
				if (!target) return;
				if (target.tagName.toLowerCase() != 'a') return;
				if (target.classList.contains('tapped')) return;
				clearTappedEl();
				tappedEl = target;
				tappedTimeout = setTimeout(function(){
					target.classList.add('tapped');
				}, 100);
			},
			onMove: function(){
				moved = true;
				clearTappedEl();
			},
			onEnd: function(){
				if (moved){
					moved = false;
					return;
				}
				if (!tappedEl) return;
				clearTimeout(tappedTimeout);
				tappedEl.classList.add('tapped');
				setTimeout(clearTappedEl, 300);
			},
			onCancel: clearTappedEl
		});
	}
	
	var news = amplify.store('news');
	if (news){
		w.loadNews(news);
	} else {
		var script = d.createElement('script'),
			q = 'select * from json where url="http://hndroidapi.appspot.com/news" and itemPath = "json.items"',
			src = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(q) + '&format=json&callback=loadNews&_maxage=600';
		script.src = src;
		body.appendChild(script);
	}
}(window, document);