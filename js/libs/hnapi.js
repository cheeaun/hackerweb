(function(w){
	
	var date = function(){
			return +new Date();
		},
		supportXDomainRequest = !!w.XDomainRequest,
		supportCORS = 'withCredentials' in new XMLHttpRequest() || supportXDomainRequest,
		requests = {},
		req = function(url, success, error){
			if (!success) success = function(){};
			if (!error) error = function(){};
			if (supportCORS){
				var r = requests[url] || (w.XDomainRequest ? new XDomainRequest() : new XMLHttpRequest());
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
				if (r.readyState <= 1 || supportXDomainRequest){ // XDomainRequest doesn't have readyState
					r.open('GET', url + '?' + date(), true);
					r.send();
				}
				requests[url] = r;
			} else {
				// Very, very basic JSON-P fallback
				var d = w.document,
					s = d.createElement('script'),
					callback = 'callback' + date();
				w[callback] = success;
				s.onerror = error;
				s.src = url + '?callback=' + callback;
				d.body.appendChild(s);
			}
		};

	var urls = [
		'http://node-hnapi.herokuapp.com/', // Heroku
		'http://node-hnapi.jit.su/', // Nodejitsu
		'http://node-hnapi.nodester.com/' // Nodester
	];
	var requests = function(path, success, error){
		req(urls[0] + path, success, function(){
			req(urls[1] + path, success, function(){
				req(urls[2] + path, success, error);
			});
		});
	};
	
	var hnapi = {
		
		urls: urls,

		news: function(success, error){
			requests('news', success, error);
		},
		
		news2: function(success, error){
			requests('news2', success, error);
		},
		
		item: function(id, success, error){
			requests('item/' + id, success, error);
		},

		comments: function(id, success, error){
			requests('comments/' + id, success, error);
		}
		
	};
	
	w.hnapi = hnapi;
	
})(window);