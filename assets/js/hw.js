(function(w){
	var d = w.document;

	var $ = w.$ = function(id){
		return d.getElementById(id);
	};

	var pubsubCache = {},
		clone = function(obj){
			var target = {};
			for (var i in obj){
				if (obj.hasOwnProperty(i)) target[i] = obj[i];
			}
			return target;
		};

	var hw = {
		// PubSub
		pub: function(topic, data){
			var t = pubsubCache[topic];
			if (!t) return;
			for (var i=0, l=t.length; i<l; i++){
				t[i].call(this, data);
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
		},
		setTitle: function(str){
			var title = 'HackerWeb';
			if (str){
				str = str.replace(/^\s+|\s+$/g, ''); // trim
				if (str.toLowerCase() != title.toLowerCase()){
					title = str + ' – ' + title;
				}
			}
			document.title = title;
		}
	};

	// Log API failures/errors to GA
	if (typeof ga != 'undefined') hw.sub('logAPIError', function(type){
		ga('send', 'event', 'Errors', 'API', type);
	});

	var tmpl = hw.tmpl;

	// Fix browsers freak out of amplify.store.sessionStorage not a function
	if (!amplify.store.sessionStorage || typeof amplify.store.sessionStorage != 'function'){
		amplify.store.sessionStorage = amplify.store.memory; // Fallback to in-memory storage
	}

	var linkElement = d.createElement('a');
	var domainsCache = {};
	var domainify = function(url){
		var domained = domainsCache[url];
		if (domained) return domained;
		linkElement.href = url;
		var domain = linkElement.hostname.replace(/^www\./, '');
		var pathname = linkElement.pathname.replace(/^\//, '').split('/')[0];
		var pathnameLen = pathname.length;
		var firstPath = domain.length <= 25 && pathnameLen > 3 && pathnameLen <= 15 && /^[^0-9][^.]+$/.test(pathname) ? ('/' + pathname) : '';
		domained = domain + firstPath;
		return domained;
	};

	var $homeScroll = d.querySelector('#view-home .scroll'),
		$homeScrollSection = $homeScroll.querySelector('section'),
		loadingNews = false;

	hw.news = {
		options: {
			disclosure: true
		},
		markupStory: function(item){
			if (/^item/i.test(item.url)){
				item.url = '#/item/' + item.id;
			} else {
				item.external = true;
				item.domain = domainify(item.url);
			}
			if (!hw.news.options.disclosure){
				if (item.id) item.url = '#/item/' + item.id;
			} else {
				if (item.type == 'link') item.detail_disclosure = true;
				if (/^#\//.test(item.url)){
					item.disclosure = true;
					item.domain = null;
				}
			}
			item.i_point = item.points == 1 ? 'point' : 'points';
			item.i_comment = item.comments_count == 1 ? 'comment' : 'comments';
			return tmpl('post', item);
		},
		markupStories: function(data, i){
			var html = '';
			if (!i) i = 1;
			var markupStory = hw.news.markupStory;
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
			storyEl.insertAdjacentHTML('afterend', hw.news.markupStory(post));
			storyEl.parentNode.removeChild(storyEl);
		},
		render: function(opts){
			if (loadingNews) return;
			if (!opts) opts = {};
			var cached = amplify.store('hacker-news-cached');
			var tmpl1 = tmpl('stories-load');
			var loadNews = function(_data){
				var data = _data.slice();
				var html = '<ul class="tableview tableview-links" id="hwlist">'
					+ hw.news.markupStories(data)
					+ (amplify.store('hacker-news2') ? '<li><a class="more-link">More&hellip;<span class="loader"><i class="icon-loading"></i></span></a></li>' : '')
					+ '</ul>';
				$homeScrollSection.innerHTML = html;
				hw.pub('onRenderNews');
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
					hw.pub('logAPIError', 'news');
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
						$('hwlist').insertAdjacentHTML('beforeend', '<li><a class="more-link">More&hellip;<span class="loader"></span></a></li>');
					});
				}, function(e){
					loadingNews = false;
					showError();
				});
			}
		},
		reload: function(){
			hw.news.render({
				delay: 300 // Cheat a little to make user think that it's doing something
			});
		},
		more: function(target){
			target.classList.add('loading');
			var news2 = amplify.store('hacker-news2');
			setTimeout(function(){
				target.classList.remove('loading');
				var targetParent = target.parentNode;
				if (!targetParent) return;
				if (targetParent.parentNode) targetParent.parentNode.removeChild(targetParent);
				if (!news2) return;
				var data = news2.slice();
				var html = hw.news.markupStories(data, 31);
				$('hwlist').insertAdjacentHTML('beforeend', html);
			}, 400);
		}
	};

	var $commentsView = $('view-comments'),
		$commentsHeading = $commentsView.querySelector('header h1'),
		$commentsSection = $commentsView.querySelector('section');

	hw.comments = {
		currentID: null,
		render: function(id){
			if (!id) return;
			var post = amplify.store.sessionStorage('hacker-item-' + id);
			if (hw.comments.currentID == id && post) return;
			hw.comments.currentID = id;

			var loadComments = function(_data, id){
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
			};
			var loadPost = function(_data, id){
				var data = clone(_data),
					tmpl1 = tmpl('post-comments');

				data.has_post = !!data.title;
				if (!data.has_post){
					hw.setTitle();
					$commentsHeading.innerHTML = '';
					$commentsSection.innerHTML = tmpl1.render(data);
					hw.pub('adjustCommentsSection');
					hw.pub('onRenderComments');
					return;
				}

				var tmpl2 = tmpl('comments');
				// If "local" link, link to Hacker News web site
				if (/^item/i.test(data.url)){
					data.url = '//news.ycombinator.com/' + data.url;
				} else {
					data.domain = domainify(data.url);
				}
				data.has_comments = data.comments && !!data.comments.length;
				data.i_point = data.points == 1 ? 'point' : 'points';
				data.i_comment = data.comments_count == 1 ? 'comment' : 'comments';
				data.has_content = !!data.content;
				if (data.poll){
					var total = 0;
					var max = 0;
					data.poll.forEach(function(p){
						var points = p.points;
						if (points > max) max = points;
						total += points;
						p.i_point = points == 1 ? 'point' : 'points';
					});
					data.poll.forEach(function(p){
						var points = p.points;
						p.percentage = (points/total*100).toFixed(1);
						p.width = (points/max*100).toFixed(1) + '%';
					});
					data.has_poll = data.has_content = true;
				}
				data.short_hn_url = 'news.ycombinator.com/item?id=' + id;
				data.hn_url = '//' + data.short_hn_url;
				hw.setTitle(data.title);
				$commentsHeading.innerHTML = data.title;

				var html = tmpl1.render(data, {comments_list: tmpl2});
				var div = d.createElement('div');
				div.innerHTML = html;

				// Make all links open in new tab/window
				// If it's a comment permalink, link to HN
				var links = div.querySelectorAll('a');
				for (var i=0, l=links.length; i<l; i++){
					var link = links[i];
					if (link.classList.contains('comment-permalink')){
						var id = link.dataset ? link.dataset.id : link.getAttribute('data-id');
						link.href = '//news.ycombinator.com/item?id=' + id;
					}
					link.target = '_blank';
				}

				// Highlight the OP
				var opUser = data.user;
				if (opUser){
					var users = div.querySelectorAll('.user');
					for (var i=0, l=users.length; i<l; i++){
						var user = users[i];
						if (user.textContent.trim() == opUser){
							user.classList.add('op');
							user.title = 'Original Poster';
						}
					}
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

				hw.pub('onRenderComments');
			};

			if (post){
				$commentsSection.scrollTop = 0;
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
					hw.pub('logAPIError', 'comments');
				};
				hnapi.item(id, function(data){
					// Avoiding the case where the wrong post is loaded when connection is slow
					if (hw.comments.currentID != id) return;

					if (!data || data.error && hw.currentView == 'comments'){
						showError();
						return;
					}
					amplify.store.sessionStorage('hacker-item-' + id, data, {
						expires: 1000*60*5 // 5 minutes
					});
					// Sync the story to the one listed in the stories list
					hw.news.updateStory({
						id: id,
						data: data
					});
					loadPost(data, id);
				}, function(e){
					if (hw.comments.currentID != id) return;
					showError();
				});
			}
		},
		toggle: function(target){
			var ul = target.nextElementSibling;
			if (ul){
				var ulStyle = ul.style;
				// Fix weird bug introduced in iOS6
				// Toggling this button somehow make the content scroll to top.
				var top = $commentsSection.scrollTop;
				ulStyle.display = (ulStyle.display == 'none') ? '' : 'none';
				$commentsSection.scrollTop = top;
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
			hw.comments.currentID = null;
			ruto.reload();
		}
	};

	hw.init = function(){
		hw.news.render();
		ruto.init();
	};

	w.hw = hw;

	ruto
		.config({
			before: function(path, name){
				hw.hideAllViews();
				var view = $('view-' + name);
				view.classList.remove('hidden');
				hw.currentView = name;
				hw.setTitle(view.querySelector('header h1').textContent);
			},
			notfound: function(){
				ruto.go('/');
			}
		})
		.add('/', 'home')
		.add('/about', 'about')
		.add(/^\/item\/(\d+)$/i, 'comments', function(path, id){
			hw.comments.render(id);
		});
})(window);