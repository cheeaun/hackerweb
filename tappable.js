var tappable = function(el, opts){
	if (!el) return;
	
	var noop = function(){},
		abs = Math.abs,
		cancel = false,
		moveOut = false,
		startTarget,
		startX,
		startY,
		options = {
			noScroll: false,
			activeClass: 'tappable-active',
			onTap: noop,
			onStart: noop,
			onMove: noop,
			onMoveOut: noop,
			onMoveIn: noop,
			onEnd: noop,
			onCancel: noop,
			allowClick: false
		};
	
	if (typeof el == 'string') el = document.getElementById(el);
	if (typeof opts == 'function') opts = { onTap: opts };
	for (var key in (opts || {})) options[key] = opts[key];
	
	if (!window.Touch && opts){
		var onTap = (typeof opts == 'function') ? opts : opts.onTap;
		el.addEventListener('click', onTap, false);
		return;
	}
	
	var noScroll = options.noScroll,
		activeClass = options.activeClass,
		clean = function(str){
			return str.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
		},
		addActiveClass = function(){
			if (!activeClass) return;
			if (clean(el.className).indexOf(activeClass) > -1) return;
			el.className = clean(el.className + ' ' + activeClass);
		},
		removeActiveClass = function(){
			if (!activeClass) return;
			el.className = el.className.replace(new RegExp('(^|\\s)' + activeClass + '(?:\\s|$)'), '$1');
		},
		move = function(e){
			var changedTouches = e.changedTouches[0],
				clientX = changedTouches.clientX,
				clientY = changedTouches.clientY,
				target = document.elementFromPoint(clientX, clientY);
			if (!e.target) e.target = target;
			if (target.nodeType == 3) target = target.parentNode;
			
			if (noScroll){
				if (target != el){
					moveOut = true;
					removeActiveClass();
					options.onMoveOut.call(el, e, target);
				} else if (moveOut && target == el){
					moveOut = false;
					addActiveClass();
					options.onMoveIn.call(el, e, target);
				}
			} else if (!cancel){
				cancel = true;
				removeActiveClass();
				options.onCancel.call(el, e, target);
			}
			
			options.onMove.call(el, e, target);
		},
		end = function(e){
			removeActiveClass();
			el.removeEventListener('touchmove', move, false);
			el.removeEventListener('touchend', end, false);
			
			var target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
			if (!e.target) e.target = target;
			if (target.nodeType == 3) target = target.parentNode;
			
			options.onEnd.call(el, e, target);
			
			if (!cancel && target == startTarget){
				setTimeout(function(){
					options.onTap.call(el, e, target);
				}, 1);
			}
		};
	
	el.addEventListener('touchstart', function(e){
		if (noScroll) e.preventDefault();
		
		addActiveClass();
		el.addEventListener('touchmove', move, false);
		el.addEventListener('touchend', end, false);
		
		var targetTouches = e.targetTouches[0],
			clientX = targetTouches.clientX,
			clientY = targetTouches.clientY,
			target = document.elementFromPoint(clientX, clientY);
		if (!e.target) e.target = target;
		if (target.nodeType == 3) target = target.parentNode;
		
		startTarget = target;
		startX = clientX;
		startY = clientY;
		cancel = false;
		
		options.onStart.call(el, e, target);
	}, false);
	
	el.addEventListener('touchcancel', function(e){
		removeActiveClass();
		options.onCancel.call(el, e);
	});
	
	if (!options.allowClick) el.addEventListener('click', function(e){
		e.preventDefault();
	}, false);
};