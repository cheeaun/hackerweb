(function(w){
	
	var date = function(){ return +new Date(); },
		supportXDomainRequest = !!w.XDomainRequest,
		supportCORS = 'withCredentials' in new XMLHttpRequest() || supportXDomainRequest,
		worker = false,
		timeout = 15000, // 15 seconds timeout
		requests = {};

	try {
		worker = new Worker('js/hnapi-worker.js');
		worker.addEventListener('message', function(e){
			var data = e.data,
				url = data.url || '';
			if (!requests[url]) return;
			var r = requests[url];
			if (data.error){
				r.error(data.error);
			} else {
				r.success(data.response);
			}
			delete requests[url];
		}, false);
	} catch (e){}

	var req = function(url, success, error){
			if (!success) success = function(){};
			if (!error) error = function(){};
			if (supportCORS){
				if (worker){
					requests[url] = {
						success: success,
						error: error
					};
					worker.postMessage({
						url: url,
						timeout: timeout
					});
				} else {
					var r = requests[url] || (supportXDomainRequest ? new XDomainRequest() : new XMLHttpRequest());
					if (r._timeout) clearTimeout(r._timeout);
					r._timeout = setTimeout(function(){
						r.abort();
					}, timeout);
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
					};
					if (r.readyState <= 1 || supportXDomainRequest){ // XDomainRequest doesn't have readyState
						r.open('GET', url + '?' + date(), true);
						r.send();
					}
					requests[url] = r;
				}
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
		'http://node-hnapi-hp.hp.af.cm/', // HP Cloud
		'http://node-hnapi-rs.rs.af.cm/', // Rackspace Cloud
		'http://node-hnapi.azurewebsites.net/', // Windows Azure
		'http://node-hnapi-asia.azurewebsites.net/' // Windows Azure (2)
	];
	urls.sort(function() {return 0.5 - Math.random()}); // Shuffle the API URLs

	var length = urls.length;
	var reqAgain = function(i, path, success, error){
		var errorFunc = (i < length-1) ? function(){
			reqAgain(i+1, path, success, error);
		} : error;
		req(urls[i] + path, success, errorFunc);
	};
	var reqs = function(path, success, error){
		req(urls[0] + path, success, function(){
			reqAgain(0, path, success, error);
		});
	};
	
	var hnapi = {
		
		urls: urls,

		news: function(success, error){
			reqs('news', success, error);
		},
		
		news2: function(success, error){
			reqs('news2', success, error);
		},
		
		item: function(id, success, error){
			reqs('item/' + id, success, error);
		},

		comments: function(id, success, error){
			reqs('comments/' + id, success, error);
		}
		
	};
	
	w.hnapi = hnapi;
	
})(window);