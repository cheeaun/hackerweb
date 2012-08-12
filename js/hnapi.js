(function(w){
	
	var date = function(){
			return +new Date();
		},
		supportCORS = 'withCredentials' in new XMLHttpRequest(),
		requests = {},
		req = function(url, success, error){
			if (!success) success = function(){};
			if (!error) error = function(){};
			if (!supportCORS){
				error(new Error('CORS not supported.'));
				return;
			};
			var r = requests[url] || new XMLHttpRequest();
			if (r._timeout) clearTimeout(r._timeout);
			r._timeout = setTimeout(function(){
				r.abort();
			}, 15000); // 15 seconds timeout
			r.onload = function(){
				clearTimeout(this._timeout);
				delete requests[url];
				try {
					success(JSON.parse(this.responseText));
				} catch(e){
					error(e);
				}
			};
			r.onerror = r.onabort = r.ontimeout = function(e){
				clearTimeout(this._timeout);
				delete requests[url];
				error(e);
			}
			if (r.readyState <= 1){
				r.open('GET', url + '?' + date(), true);
				r.send();
			}
			requests[url] = r;
		};
	
	var hnapi = {
		
		url: 'http://node-hnapi.herokuapp.com/', // Heroku
		url2: 'http://node-hnapi.nodester.com/', // Nodester
		// Note: Nodester is the backup for now, in case Heroku is down (once in a while)

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