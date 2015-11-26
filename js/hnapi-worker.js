var requests = {};

addEventListener('message', function(e){
	var data = e.data,
		url = data.url,
		timeout = data.timeout || 20000;
	var r = requests[url] || new XMLHttpRequest();
	if (r._timeout) clearTimeout(r._timeout);
	r._timeout = setTimeout(function(){
		r.abort();
	}, timeout);
	r.onload = function(){
		clearTimeout(this._timeout);
		delete requests[url];
		var response;
		try {
			response = JSON.parse(this.responseText);
		} catch (e){}
		if (this.status == 200 && response && !response.error){
			postMessage({
				url: url,
				response: response
			});
		} else {
			postMessage({
				url: url,
				error: true
			});
		}
	};
	r.onerror = r.onabort = r.ontimeout = function(e){
		clearTimeout(this._timeout);
		delete requests[url];
		postMessage({
			url: url,
			error: JSON.parse(JSON.stringify(e))
		});
	}
	if (r.readyState <= 1){
		r.open('GET', url, true);
		r.send();
	}
	requests[url] = r;
});
