(function(w){
	
	var date = function(){
			return +new Date();
		},
		req = function(url, success, error){
			var r = new XMLHttpRequest();
			if (!success) success = function(){};
			if (!error) error = function(){};
			if ('withCredentials' in r){ // CORS
				try {
					r.open('GET', url + '?' + date(), true);
					r.onload = function(){
						try {
							success(JSON.parse(this.responseText));
						} catch(e){
							error(e);
						}
					};
					r.onerror = error;
					r.send();
				} catch (e){
					error(e);
				}
			} else {
				var s = document.createElement('script'),
					callback = 'callback' + date();
				w[callback] = success;
				s.onerror = error;
				s.src = url + '?callback=' + callback;
				document.body.appendChild(s);
			}
		};
	
	var hnapi = {
		
		url: 'http://node-hnapi.herokuapp.com/',
		
		news: function(success, error){
			req(hnapi.url + 'news' , success, error);
		},
		
		news2: function(success, error){
			req(hnapi.url + 'news2' , success, error);
		},
		
		item: function(id, success, error){
			req(hnapi.url + 'item/' + id, success, error);
		},

		comments: function(id, success, error){
			req(hnapi.url + 'comments/' + id, success, error);
		}
		
	};
	
	w.hnapi = hnapi;
	
})(window);