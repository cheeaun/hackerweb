self.addEventListener('install', function(event){
	console.log('Install');
});

self.addEventListener('activate', function(event){
	console.log('Activate');
});

var cacheName = 'hackerweb-v1';
var successResponses = /^0|([123]\d\d)|(40[14567])|410$/;

function fetchAndCache(request){
	console.log('fetchAndCache', request.url);
	return fetch(request.clone()).then(function(response){
		console.log(request.method, request.url, response.status, response.type);
		if (request.method == 'GET' && response && successResponses.test(response.status) && response.type == 'basic'){
			console.log('Cache', request.url);
			caches.open(cacheName).then(function(cache){
				cache.put(request, response);
			});
		}
		return response.clone();
	});
};

function cacheOnly(request){
	console.log('cacheOnly', request.url);
	return caches.open(cacheName).then(function(cache){
		return cache.match(request);
	});
};

// Fastest strategy from https://github.com/GoogleChrome/sw-toolbox
self.addEventListener('fetch', function(event){
	var request = event.request;
	var url = request.url;
	console.log('Fetch', url);
	event.respondWith(new Promise(function(resolve, reject){
		var rejected = false;
		var reasons = [];

		var maybeReject = function(reason){
			reasons.push(reason.toString());
			if (rejected){
				reject(new Error('Both cache and network failed: "' + reasons.join('", "') + '"'));
			} else {
				rejected = true;
			}
		};

		var maybeResolve = function(result){
			if (result instanceof Response){
				resolve(result);
			} else {
				maybeReject('No result returned');
			}
		};

		fetchAndCache(request.clone()).then(maybeResolve, maybeReject);
		cacheOnly(request).then(maybeResolve, maybeReject);
	}));
});
