!function(w, d){
	var body = d.body,
		$hnlist = d.getElementById('hnlist');
	
	w.loadNews = function(data){
		if (!data || !data.items){
			alert('Things borked, try reload plz?');
			return;
		}
		var html = '',
			a = d.createElement('a');
		data.items.forEach(function(item){
			a.href = item.url;
			var domain = a.hostname.match(/[^.]+\.[^.]+$/i)[0];
			html += '<li>'
					+ '<a href="' + item.url + '">'
						+ '<b>' + item.title + ' <small>(' + domain + ')</small></b>'
						+ '<span class="metadata">' + item.points + ' points by ' + item.postedBy + ' ' + item.postedAgo + '</span>'
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
	w.onorientationchange = scrollTop;
	scrollTop();
	
	var $viewSections = d.querySelectorAll('.view>section');
	for (var i=0, l=$viewSections.length; i<l; i++){
		new ScrollFix($viewSections[i]);
	}
	
	var news = amplify.store('news');
	if (news){
		w.loadNews(news);
	} else {
		var script = d.createElement('script');
		script.src = 'http://api.ihackernews.com/page?format=jsonp&callback=loadNews';
		body.appendChild(script);
	}
}(window, document);