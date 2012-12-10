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

	var urls = {
		primary: 'http://node-hnapi.herokuapp.com/', // Heroku
		secondary: [
			'http://node-hnapi.ap01.aws.af.cm/', // AWS (Asia Pacific)
			'http://node-hnapi-hp.hp.af.cm/', // HP Cloud
			'http://node-hnapi-rs.rs.af.cm/', // Rackspace Cloud
			'http://node-hnapi.azurewebsites.net/' // Windows Azure
		]
	};

	var length = urls.secondary.length;
	var reqAgain = function(i, path, success, error){
		var errorFunc = (i < length-1) ? function(){
			reqAgain(i+1, path, success, error);
		} : error;
		req(urls.secondary[i] + path, success, errorFunc);
	};
	var requests = function(path, success, error){
		req(urls.primary + path, success, function(){
			urls.secondary.sort(function() {return 0.5 - Math.random()}); // Shuffle the API URLs
			reqAgain(0, path, success, error);
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