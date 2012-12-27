var requests = {};

addEventListener('message', function(e){
	var data = e.data,
		url = data.url,
		timeout = data.timeout || 0;
	var r = requests[url] || new XMLHttpRequest();
	if (r._timeout) clearTimeout(r._timeout);
	r._timeout = setTimeout(function(){
		r.abort();
	}, timeout);
	r.onload = function(){
		clearTimeout(this._timeout);
		delete requests[url];
		var responseText = this.responseText;
		try {
			postMessage({
				success: true,
				url: url,
				response: JSON.parse(responseText)
			});
		} catch(e){
			postMessage({
				url: url,
				error: e
			});
		}
	};
	r.onerror = r.onabort = r.ontimeout = function(e){
		clearTimeout(this._timeout);
		delete requests[url];
		postMessage({
			url: url,
			error: e
		});
	}
	if (r.readyState <= 1){
		r.open('GET', url + '?' + (+new Date()), true);
		r.send();
	}
	requests[url] = r;
});