Hacker News mobile web app
==========================

This is one of my silly mini-projects. I create this initially to try out iOS 5 Mobile Safari's new `-webkit-overflow-scrolling: touch` CSS support. I needed some sort of content for scrolling, so why not [Hacker News](http://news.ycombinator.com/)' stories?

I'm also trying something called [**Fake it 'til you make it**](http://snook.ca/archives/conferences/fake-it) which I make the web app looks more like a native mobile app. In this case, like a native iOS app.

Technical stuff
---------------

This mobile web app primarily works on iOS 5 Mobile Safari. It uses these wonderful scripts:

- [Tappable](https://github.com/cheeaun/tappable) - touch-friendly tap events
- [Director](https://github.com/flatiron/director) - location.hash router
- [Mustache.js](https://github.com/janl/mustache.js/) - logic-less templating
- [Amplify.Store](http://amplifyjs.com/api/store/) - client-side storage
- [Viper](https://github.com/alpha123/Viper/) - simple animation
- Vanilla JavaScript - everything else

Also uses the [unofficial Hacker News API](http://node-hnapi.herokuapp.com/), [open-sourced](https://github.com/cheeaun/node-hnapi).

Contributing and Feedback
-------------------------

Feel free to fork, file some issues or [tweet your feedback](http://twitter.com/cheeaun) to me.

License
-------

Licensed under the [MIT License](http://cheeaun.mit-license.org/).