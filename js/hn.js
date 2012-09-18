(function(w){
	var d = w.document,
		body = d.body;

	var $ = w.$ = function(id){
		return d.getElementById(id)
	};

	var pubsubCache = {},
		slice = Array.prototype.slice,
		clone = function(obj){
			var target = {};
			for (var i in obj){
				if (obj.hasOwnProperty(i)) target[i] = obj[i];
			}
			return target;
		};

	var hn = {
		// PubSub
		pub: function(topic){
			var t = pubsubCache[topic];
			if (!t) return;
			var args = slice.call(arguments, 1);
			for (var i=0, l=t.length; i<l; i++){
				t[i].apply(this, args);
			}
		},
		sub: function(topic, fn){
			if (!pubsubCache[topic]) pubsubCache[topic] = [];
			pubsubCache[topic].push(fn);
		},
		currentView: null,
		hideAllViews: function(){
			var views = d.querySelectorAll('.view');
			for (var i=0, l=views.length; i<l; i++){
				views[i].classList.add('hidden');
			}
		},
		tmpl: function(template, data){
			var t = TEMPLATES[template];
			if (!t) return;
			if (!data) return t;
			return t.render(data);
		}
	};

	// Log API failures/errors to GA
	if (typeof _gaq != 'undefined') hn.sub('logAPIError', function(msg, type){
		_gaq.push(['_trackEvent', 'Errors', 'API', type]);
	});

	var tmpl = hn.tmpl;

	var $homeScroll = d.querySelector('#view-home .scroll'),
		$homeScrollSection = $homeScroll.querySelector('section'),
		loadingNews = false;

	hn.news = {
		options: {
			disclosure: true
		},
		markupStory: function(item){
			if (/^item/i.test(item.url)){
				item.url = '#/item/' + item.id;
				item.domain = null;
			} else {
				item.external = true;
				var a = d.createElement('a');
				a.href = item.url;
				item.domain = a.hostname.replace(/^www\./, '');
				delete a;
			}
			// if (isWideScreen){
			if (!hn.news.options.disclosure){
				if (item.id){
					item.url = '#/item/' + item.id;
					item.domain = null;
				}
			} else {
				if (item.type == 'link') item.detail_disclosure = true;
				if (/^#\//.test(item.url)) item.disclosure = true;
			}
			item.i_point = item.points == 1 ? 'point' : 'points';
			item.i_comment = item.comments_count == 1 ? 'comment' : 'comments';
			return tmpl('post', item);
		},
		markupStories: function(data, i){
			var html = '';
			if (!i) i = 1;
			var markupStory = hn.news.markupStory;
			data.forEach(function(item){
				item.i = i++;
				html += markupStory(item);
			});
			return html;
		},
		// Re-markup the story item in the News list when
		// there's an update from specific API call of the item.
		// Make sure the title, points, comments count, etc matches.
		updateStory: function(story){
			if (!story || !story.id) return;
			var id = story.id;
			var data = story.data;
			var post;
			var newsCache = 'hacker-news';
			var news = amplify.store(newsCache);
			if (news){
				for (var i=0, l=news.length; i<l; i++){
					var p = news[i];
					if (id == p.id){
						post = p;
						break;
					}
				}
			}
			if (!post){
				newsCache = 'hacker-news2';
				news = amplify.store(newsCache);
				if (news){
					for (var i=0, l=news.length; i<l; i++){
						var p = news[i];
						if (id == p.id){
							post = p;
							break;
						}
					}
				}
			}
			if (!post) return;
			// Pass in the possibly changed values
			var changed = false;
			['title', 'url',  'time_ago', 'comments_count', 'points'].forEach(function(key){
				var val = data[key];
				if (post[key] != val){
					post[key] = val;
					changed = true;
				}
			});
			if (!changed) return;
			// Update the news cache
			amplify.store(newsCache, news);
			// Update the story in the news list
			var storyEl = $('story-' + id);
			if (!storyEl) return;
			post.selected = !!storyEl.querySelector('a[href].selected');
			post.i = storyEl.dataset ? storyEl.dataset.index : storyEl.getAttribute('data-index');
			storyEl.insertAdjacentHTML('afterend', hn.news.markupStory(post));
			storyEl.parentNode.removeChild(storyEl);
		},
		render: function(opts){
			if (loadingNews) return;
			if (!opts) opts = {};
			var cached = amplify.store('hacker-news-cached');
			var tmpl1 = tmpl('stories-load');
			var loadNews = function(_data){
				var data = _data.slice();
				var html = '<ul class="tableview tableview-links" id="hnlist">'
					+ hn.news.markupStories(data)
					+ (amplify.store('hacker-news2') ? '<li><a class="more-link">More&hellip;<span class="loader"></span></a></li>' : '')
					+ '</ul>';
				$homeScrollSection.innerHTML = html;
				hn.pub('onRenderNews');
			};
			if (cached){
				var news = amplify.store('hacker-news');
				var delay = opts.delay;
				if (delay){
					loadingNews = true;
					$homeScrollSection.innerHTML = tmpl1.render({loading: true});
					setTimeout(function(){
						loadingNews = false;
						loadNews(news);
					}, delay);
				} else {
					loadNews(news);
				}
			} else {
				loadingNews = true;
				$homeScrollSection.innerHTML = tmpl1.render({loading: true});
				var showError = function(){
					$homeScrollSection.innerHTML = tmpl1.render({load_error: true});
					hn.pub('logAPIError', 'news');
				};
				hnapi.news(function(data){
					loadingNews = false;
					if (!data || data.error){
						showError();
						return;
					}
					amplify.store('hacker-news', data);
					amplify.store('hacker-news-cached', true, {
						expires: 1000*60*10 // 10 minutes
					});
					amplify.store('hacker-news2', null);
					loadNews(data);
					// Preload news2 to prevent discrepancies between /news and /news2 results
					hnapi.news2(function(data){
						if (!data || data.error) return;
						amplify.store('hacker-news2', data);
						$('hnlist').insertAdjacentHTML('beforeend', '<li><a class="more-link">More&hellip;<span class="loader"></span></a></li>');
					});
				}, function(e){
					loadingNews = false;
					showError();
				});
			}
		},
		reload: function(){
			hn.news.render({
				delay: 300 // Cheat a little to make user think that it's doing something
			});
		},
		more: function(target){
			target.classList.add('loading');
			var news2 = amplify.store('hacker-news2');
			setTimeout(function(){
				target.classList.remove('loading');
				var targetParent = target.parentNode;
				targetParent.parentNode.removeChild(targetParent);
				if (!news2) return;
				var data = news2.slice();
				var html = hn.news.markupStories(data, 31);
				$('hnlist').insertAdjacentHTML('beforeend', html);
			}, 400);
		}
	};

	var $commentsView = $('view-comments'),
		$commentsHeading = $commentsView.querySelector('header h1'),
		$commentsSection = $commentsView.querySelector('section');

	hn.comments = {
		currentID: null,
		render: function(id){
			if (!id || hn.comments.currentID == id) return;
			hn.comments.currentID = id;

			var post = amplify.store.sessionStorage('hacker-item-' + id),
				$commentsScroll = $commentsView.querySelector('.scroll'),
				loadComments = function(_data, id){
					if (!_data || _data.error) return;
					var data = clone(_data);
					amplify.store.sessionStorage('hacker-comments-' + id, data);
					var ul = $commentsSection.querySelector('.comments>ul');
					if (!ul.querySelector('.more-link-container')){
						ul.insertAdjacentHTML('beforeend', '<li class="more-link-container"><a class="more-link" data-id="' + id + '">More&hellip;</a></li>');
					}
					if (!data.more_comments_id) return;

					// Preload all 'More' comments
					var loadMoreComments = function(id){
						var comments = amplify.store.sessionStorage('hacker-comments-' + id);
						if (!comments){
							hnapi.comments(id, function(data){
								if (!data || data.error) return;
								amplify.store.sessionStorage('hacker-comments-' + id, data);
								if (data.more_comments_id) loadMoreComments(data.more_comments_id);
							});
						} else {
							if (comments.more_comments_id) loadMoreComments(comments.more_comments_id);
						}
					};
					loadMoreComments(data.more_comments_id);
				},
				loadPost = function(_data, id){
					var data = clone(_data),
						tmpl1 = tmpl('post-comments');

					data.has_post = !!data.title;
					if (!data.has_post){
						$commentsHeading.innerHTML = '';
						$commentsSection.innerHTML = tmpl1.render(data);
						hn.pub('adjustCommentsSection');
						hn.pub('onRenderComments');
						return;
					}

					var tmpl2 = tmpl('comments'),
						a = d.createElement('a');
					// If "local" link, link to Hacker News web site
					if (/^item/i.test(data.url)){
						data.url = 'http://news.ycombinator.com/' + data.url;
					} else {
						a.href = data.url;
						data.domain = a.hostname.replace(/^www\./, '');
					}
					data.has_comments = data.comments && !!data.comments.length;
					data.i_point = data.points == 1 ? 'point' : 'points';
					data.i_comment = data.comments_count == 1 ? 'comment' : 'comments';
					data.has_content = !!data.content;
					if (data.poll){
						var total = 0;
						data.poll.forEach(function(p){
							var points = p.points;
							total += points;
							p.i_point = points == 1 ? 'point' : 'points';
						});
						data.poll.forEach(function(p){
							p.width = (p.points/total*100).toFixed(1) + '%';
						});
						data.has_poll = data.has_content = true;
					}
					data.short_hn_url = 'news.ycombinator.com/item?id=' + id;
					data.hn_url = 'http://' + data.short_hn_url;
					$commentsHeading.innerHTML = data.title;

					var html = tmpl1.render(data, {comments_list: tmpl2});
					var div = d.createElement('div');
					div.innerHTML = html;

					// Make all links open in new tab/window
					var links = div.querySelectorAll('a');
					for (var i=0, l=links.length; i<l; i++){
						links[i].target = '_blank';
					}

					// 20K chars will be the max to trigger collapsible comments.
					// I can use number of comments as the condition but some comments
					// might have too many chars and make the page longer.
					if (html.length > 20000){
						var subUls = div.querySelectorAll('.comments>ul>li>ul');
						var tmpl3 = tmpl('comments-toggle');
						for (var j=0, l=subUls.length; j<l; j++){
							var subUl = subUls[j],
								commentsCount = subUl.querySelectorAll('.metadata').length;
							subUl.style.display = 'none';
							if (commentsCount){
								subUl.insertAdjacentHTML('beforebegin', tmpl3.render({
									comments_count: commentsCount,
									i_reply: commentsCount == 1 ? 'reply' : 'replies'
								}));
							}
						}
					}

					while ($commentsSection.hasChildNodes()){
						$commentsSection.removeChild($commentsSection.childNodes[0]);
					}
					while (div.hasChildNodes()){
						$commentsSection.appendChild(div.childNodes[0]);
					}
					delete div;

					// Grab 'More' comments
					if (data.more_comments_id){
						var id = data.more_comments_id;
						var comments = amplify.store.sessionStorage('hacker-comments-' + id);
						if (comments){
							loadComments(comments, id);
						} else {
							hnapi.comments(id, function(data){
								loadComments(data, id);
							});
						}
					}

					hn.pub('onRenderComments');
				};

			if (post){
				$commentsScroll.querySelector('section').scrollTop = 0;
				loadPost(post, id);
			} else {
				// Render the post data concurrently while loading the comments
				// if the data is in 'news' or 'news2' cache
				var news = amplify.store('hacker-news');
				if (news){
					for (var i=0, l=news.length; i<l; i++){
						var p = news[i];
						if (id == p.id){
							post = p;
							break;
						}
					}
				}
				if (!post){
					var news = amplify.store('hacker-news2');
					if (news){
						for (var i=0, l=news.length; i<l; i++){
							var p = news[i];
							if (id == p.id){
								post = p;
								break;
							}
						}
					}
				}
				if (post){
					post.loading = true;
					loadPost(post, id);
				} else {
					loadPost({loading: true}, id);
				}
				var showError = function(){
					if (post){
						delete post.loading;
						post.load_error = true;
						loadPost(post, id);
					} else {
						loadPost({load_error: true}, id);
					}
					hn.pub('logAPIError', 'comments');
				};
				hnapi.item(id, function(data){
					// Avoiding the case where the wrong post is loaded when connection is slow
					if (hn.comments.currentID != id) return;

					if (!data || data.error && hn.currentView == 'comments'){
						showError();
						return;
					}
					amplify.store.sessionStorage('hacker-item-' + id, data, {
						expires: 1000*60*5 // 5 minutes
					});
					// Sync the story to the one listed in the stories list
					hn.news.updateStory({
						id: id,
						data: data
					});
					loadPost(data, id);
				}, function(e){
					if (hn.comments.currentID != id) return;
					showError();
				});
			}
		},
		toggle: function(target){
			var ul = target.nextElementSibling;
			if (ul){
				var ulStyle = ul.style;
				ulStyle.display = (ulStyle.display == 'none') ? '' : 'none';
			}
		},
		more: function(target){
			var id = target.dataset ? target.dataset.id : target.getAttribute('data-id');
			var comments = amplify.store.sessionStorage('hacker-comments-' + id);
			if (comments){
				var tmpl1 = tmpl('comments'),
					tmpl2 = tmpl('comments'),
					html = tmpl1.render(comments, {comments_list: tmpl1}),
					li = target.parentNode,
					ul = li.parentNode,
					more_comments_id = comments.more_comments_id,
					_ul = d.createElement('ul');

				_ul.innerHTML = html;

				var links = _ul.querySelectorAll('a');
				for (var i=0, l=links.length; i<l; i++){
					links[i].target = '_blank';
				}

				var subLis = _ul.children;
				for (var i=0, l=subLis.length; i<l; i++){
					var subUl = subLis[i].getElementsByTagName('ul')[0];
					var commentsCount = subUl.querySelectorAll('.metadata').length;
					subUl.style.display = 'none';
					if (commentsCount){
						subUl.insertAdjacentHTML('beforebegin', tmpl2.render({
							comments_count: commentsCount,
							i_reply: commentsCount == 1 ? 'reply' : 'replies'
						}));
					}
				}

				if (more_comments_id && amplify.store.sessionStorage('hacker-comments-' + more_comments_id)){
					_ul.insertAdjacentHTML('beforeend', '<li class="more-link-container"><a class="more-link" data-id="' + more_comments_id + '">More&hellip;</a></li>');
				}
				ul.removeChild(li);
				while (_ul.hasChildNodes()){
					ul.appendChild(_ul.childNodes[0]);
				}
				delete _ul;
			} else {
				// TODO: Need funnier error message than this.
				alert('Oops, the comments have expired.');
			}
		},
		reload: function(){
			hn.comments.currentID = null;
			ruto.reload();
		}
	};

	hn.init = function(){
		hn.news.render();
		ruto.init();
	};

	w.hn = hn;

	ruto
		.config({
			before: function(path, name){
				hn.hideAllViews();
				var view = $('view-' + name);
				view.classList.remove('hidden');
				hn.currentView = name;
			},
			notfound: function(){
				ruto.go('/');
			}
		})
		.add('/', 'home')
		.add('/about', 'about')
		.add(/^\/item\/(\d+)$/i, 'comments', function(path, id){
			hn.comments.render(id);
		});

	// "Naturally" reload when an update is available
	if (w.applicationCache){
		var reload = false;
		w.applicationCache.addEventListener('updateready', function(){
			if (w.applicationCache.status == w.applicationCache.UPDATEREADY){
				w.applicationCache.swapCache();
				reload = true;
			}
		}, false);

		var checkReload = function(){
			if (reload){
				 location.reload();
			} else if (!amplify.store('hacker-update-delay')){
				try { // There's nothing to update for first-time load, browser freaks out :/
					w.applicationCache.update();
					// Delay check update to after next 1 hour
					amplify.store('hacker-update-delay', 1, {
						expires: 1000*60*60 // 1 hour
					});
				} catch (e){}
			}
		};
		w.addEventListener('pageshow', checkReload, false);
		w.addEventListener('focus', checkReload, false);
	}

	// Use GA to track the update rate of this manifest appcache thing
	// and see how fast users are updated to the latest cache/version
	if (typeof _gaq != 'undefined' && w.applicationCache) w.addEventListener('load', function(){
		setTimeout(function(){
			var r = new XMLHttpRequest();
			r.open('GET', 'manifest.appcache', true);
			r.onload = function(){
				var text = this.responseText;
				if (!text) return;
				var version = (text.match(/#\s\d[^\n\r]+/) || [])[0];
				if (version) _gaq.push(['_trackEvent', 'Appcache', 'Version', version.replace(/^#\s/, '')]);
			};
			r.send();
		}, 1000);
	}, false);
})(window);