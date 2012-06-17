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
				var d = w.document,
					s = d.createElement('script'),
					callback = 'callback' + date();
				w[callback] = success;
				s.onerror = error;
				s.src = url + '?callback=' + callback;
				d.body.appendChild(s);
			}
		};
	
	var hnapi = {
		
		url: 'http://node-hnapi.herokuapp.com/', // Heroku
		url2: 'http://node-hnapi.jit.su/', // Nodejitsu
		// Note: Nodejitsu is the backup for now, in case Heroku is down (once in a while)

		news: function(success, error){
			var path = 'news';
			req(hnapi.url + path, success, function(){
				req(hnapi.url2 + path, success, error);
			});
		},
		
		news2: function(success, error){
			var path = 'news2';
			req(hnapi.url + path, success, function(){
				req(hnapi.url2 + path, success, error);
			});
		},
		
		item: function(id, success, error){
			var path = 'item/' + id;
			req(hnapi.url + path, success, function(){
				req(hnapi.url2 + path, success, error);
			});
		},

		comments: function(id, success, error){
			var path = 'comments/' + id;
			req(hnapi.url + path, success, function(){
				req(hnapi.url2 + path, success, error);
			});
		}
		
	};
	
	w.hnapi = hnapi;
	
})(window);