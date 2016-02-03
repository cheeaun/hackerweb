HackerWeb
=========

A simply readable Hacker News web app. <http://hackerwebapp.com/>

About
-----

This project started as one of my silly mini-projects. I create this initially to try out iOS 5+ Mobile Safari's new `-webkit-overflow-scrolling: touch` CSS support. I need some sort of content for scrolling, so why not [Hacker News](https://news.ycombinator.com/)' stories? I'm also trying something called [Fake it 'til you make it](http://snook.ca/archives/conferences/fake-it) which I make the web app looks (and feels) like a native mobile app. In this case, like a native iOS app. If the web app is loaded on non-iOS devices, it'll switch to the 'web' theme which is like a generic theme for other browsers and platforms.

Read my two-part blog post on how I built this web app:

- [How I built the Hacker News mobile web app](http://cheeaun.com/blog/2012/03/how-i-built-hacker-news-mobile-web-app) ([HN thread](https://news.ycombinator.com/item?id=3662709))
- [How I built the Hacker News mobile web app, Part 2](http://cheeaun.com/blog/2012/03/how-i-built-hacker-news-mobile-web-app_26) ([HN thread](https://news.ycombinator.com/item?id=3756771))

Also read my introductory post, [Introducing HackerWeb](http://cheeaun.com/blog/2012/12/introducing-hackerweb).

Technical stuff
---------------

This web app works best on iOS 5+ Mobile Safari (iOS theme) and other modern browsers (web theme). It uses these wonderful scripts:

- [Hogan.js](https://github.com/twitter/hogan.js) - logic-less templating
- [Amplify.Store](http://amplifyjs.com/api/store/) - client-side storage
- ruto.js - `location.hash` router
- iOS
	- [Tappable](https://github.com/cheeaun/tappable) - touch-friendly tap events
	- [Tween.js](https://github.com/sole/tween.js) - simple tweening engine
- Web
	- ibento.js - simple event delegation
	- [classList.js](https://github.com/eligrey/classList.js) - shim for `element.classList`
- Vanilla JavaScript - everything else

Also uses the [unofficial Hacker News API](https://github.com/cheeaun/node-hnapi/).

Development stuff
--------------------

### Prerequisites

```
git clone git://github.com/cheeaun/hackerweb.git
cd hackerweb/
npm install
```

### [Grunt](http://gruntjs.com/) tasks

- `grunt templates` - Compile templates in `templates/*` to generate `assets/js/templates.js`
- `grunt uglify` - Concat and minify JavaScript files in `assets/js/*` to generate `js/*`
- `grunt watch` - Watch the templates and scripts, run `templates` and `uglify` tasks when they're changed
- `grunt embedImage` - Embed images into CSS files. This will parse CSS files in `assets/css/*` and change this (any lines with `url()`):

	```
	background-image: url(PATH); /* embedImages:url(PATH) */
	```

	... into this:

	```
	background-image: url(data:DATAURI); /* embedImages:url(PATH) */
	```

- `grunt connect` - Run a local dev server. Arguments:
	- `--port=XX` - specify a custom port number

- `grunt server` - Run both `watch` and `connect` tasks at the same time

Contributing and Feedback
-------------------------

Feel free to fork, file some issues or [tweet your feedback](https://twitter.com/cheeaun) to me.

Do check out these awesome contributions as well:

- [Bookmarklet to switch between HackerNews and HackerWeb](https://gist.github.com/duncansmart/4672084) by [duncansmart](https://github.com/duncansmart)
- [HNmobile Bookmarklet](http://neocoder.github.com/hnmbookmarklet/) by [neocoder](https://github.com/neocoder)
- [Hacker News Menu Tab](http://www.guidefreitas.com/2012/03/hacker-news-menu-tab.html) ([GitHub](https://github.com/guidefreitas/HNewsTab)) by Guilherme Defreitas

License
-------

[MIT](http://cheeaun.mit-license.org/).

Other similar apps
------------------

This is the not the first third-party app for Hacker News. Others have tried doing the same thing, despite some slight differences. I've compiled [a list of apps here](https://github.com/cheeaun/awesome-hacker-news).
