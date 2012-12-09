HackerWeb
=========

A simply readable Hacker News web app. <http://hackerwebapp.com/>

About
-----

This project started as one of my silly mini-projects. I create this initially to try out iOS 5+ Mobile Safari's new `-webkit-overflow-scrolling: touch` CSS support. I need some sort of content for scrolling, so why not [Hacker News](http://news.ycombinator.com/)' stories? I'm also trying something called [Fake it 'til you make it](http://snook.ca/archives/conferences/fake-it) which I make the web app looks (and feels) like a native mobile app. In this case, like a native iOS app. If the web app is loaded on non-iOS devices, it'll switch to the 'web' theme which is like a generic theme for other browsers and platforms.

Read my two-part blog post on how I built this web app:

- [How I built the Hacker News mobile web app](http://cheeaun.com/blog/2012/03/how-i-built-hacker-news-mobile-web-app) ([HN thread](http://news.ycombinator.com/item?id=3662709))
- [How I built the Hacker News mobile web app, Part 2](http://cheeaun.com/blog/2012/03/how-i-built-hacker-news-mobile-web-app_26) ([HN thread](http://news.ycombinator.com/item?id=3756771))

Technical stuff
---------------

This web app works best on iOS 5+ Mobile Safari (iOS theme) and other modern browsers (web theme). It uses these wonderful scripts:

- [Hogan.js](https://github.com/twitter/hogan.js) - logic-less templating
- [Amplify.Store](http://amplifyjs.com/api/store/) - client-side storage
- ruto.js - `location.hash` router
- iOS
	- [Tappable](https://github.com/cheeaun/tappable) - touch-friendly tap events
	- [Viper](https://github.com/alpha123/Viper/) - simple animation
- Web
	- ibento.js - simple event delegation
	- [classList.js](https://github.com/eligrey/classList.js) - shim for `element.classList`
- Vanilla JavaScript - everything else

Also uses the [unofficial Hacker News API](https://github.com/cheeaun/node-hnapi/).

More technical stuff
--------------------

### Running a local server

	git clone git@github.com:cheeaun/hackerweb.git
	cd hackerweb
	node server.js -noappcache

The `-noappcache` argument is to prevent browsers from caching everything in the Application Cache.

### Changes to scripts

If there are changes in the `/js` folder, run this to regenerate the static JavaScript files (skip the npm install if `uglify-js` is already installed):

	npm install uglify-js
	node make-scripts.js

The static JS files are defined by `scripts.json` which specifies which files are combined and minified into smaller individual files.

### Changes to templates

If there are changes in the `/templates` folder, run this to regenerate `js/templates.js` (skip the npm install if `uglify-js` is already installed; do not use `npm install hogan.js` as the current NPM version – 2.0.0 – is not compatible):

	npm install uglify-js
	npm install git://github.com/twitter/hogan.js.git
	node make-templates.js

Contributing and Feedback
-------------------------

Feel free to fork, file some issues or [tweet your feedback](http://twitter.com/cheeaun) to me.

Do check out these awesome contributions as well:

- [HNmobile Bookmarklet](http://neocoder.github.com/hnmbookmarklet/) by [neocoder](https://github.com/neocoder)
- [Hacker News Menu Tab](http://www.guidefreitas.com/2012/03/hacker-news-menu-tab.html) ([GitHub](https://github.com/guidefreitas/HNewsTab)) by Guilherme Defreitas

Other platforms?
----------------

I have plans to make this app look native on other mobile platforms once I fork our some money and get my hands on other mobile devices (Android, Windows Phone, etc) for development and testing. Contact me if you feel generous enough to donate some devices to me :)

License
-------

Licensed under the [MIT License](http://cheeaun.mit-license.org/).

Other similar apps
------------------

This is the not the first third-party app for Hacker News. Others have tried doing the same thing, despite some slight differences. I've compiled [a list of apps here](https://github.com/cheeaun/hackerweb/wiki/Hacker-News-apps).