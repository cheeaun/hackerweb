(function(w){
	
	var date = function(){
			return +new Date();
		},
		req = function(url, success){
			var r = new XMLHttpRequest();
			r.open('GET', url + '?' + date(), true);
			r.onload = function(){
				success(JSON.parse(this.responseText));
			};
			r.onerror = function(){
				var s = document.createElement('script');
				w.callback = success;
				s.src = url + '?callback=callback';
				document.body.appendChild(s);
			};
			r.send();
		};
	
	var hnapi = {
		
		url: 'http://node-hnapi.herokuapp.com/',
		
		news: function(fn){
			req(hnapi.url + 'news' , fn);
		},
		
		news2: function(fn){
			req(hnapi.url + 'news2' , fn);
		},
		
		item: function(id, fn){
			req(hnapi.url + 'item/' + id, fn);
		}
		
	};
	
	w.hnapi = hnapi;
	
})(window);