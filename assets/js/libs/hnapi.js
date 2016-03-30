(function(w){

	var date = function(){ return +new Date(); },
		supportXDomainRequest = !!w.XDomainRequest,
		supportCORS = 'withCredentials' in new XMLHttpRequest() || supportXDomainRequest,
		worker = false,
		timeout = 20000, // 20 seconds timeout
		requests = {};

	try {
		worker = new Worker('js/hnapi-worker.js');
		worker.addEventListener('message', function(e){
			var data = e.data,
				url = data.url || '';
			if (!requests[url]) return;
			var r = requests[url];
			var error = r.error;
			var success = r.success;
			delete requests[url];
			if (data.error){
				error(data.error);
			} else {
				success(data.response);
			}
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
					r.open('GET', url, true);
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
		'https://node-hnapi-eu.herokuapp.com/', // Heroku (EU)
		'https://node-hnapi.azurewebsites.net/', // Windows Azure (North EU)
		'https://node-hnapi-eus.azurewebsites.net/' // Windows Azure (East US)
		// '//node-hnapi-asia.azurewebsites.net/', // Windows Azure (East Asia)
		// '//node-hnapi-weu.azurewebsites.net/', // Windows Azure (West EU)
		// '//node-hnapi-wus.azurewebsites.net/', // Windows Azure (West US)
		// '//node-hnapi-ncus.azurewebsites.net/' // Windows Azure (North Central US)
	];
	var shuffle = function(array){ // Fisher-Yates
		for (var i = array.length - 1; i > 0; i--){
			var j = Math.floor(Math.random() * (i + 1));
			var temp = array[i];
			array[i] = array[j];
			array[j] = temp;
		}
	};
	shuffle(urls);
	urls.unshift('https://api.hackerwebapp.com/'); // The ultimate API

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
