(function(root, factory){
  // Set up Tappable appropriately for the environment.
  if (typeof define === 'function' && define.amd){
    // AMD
    define('tappable', [], function(){
      factory(root, window.document);
      return root.tappable;
    });
  } else {
    // Browser global scope
    factory(root, window.document);
  }
}(this, function(w, d){

  var abs = Math.abs,
    noop = function(){},
    defaults = {
      noScroll: false,
      activeClass: 'tappable-active',
      onTap: noop,
      onStart: noop,
      onMove: noop,
      onMoveOut: noop,
      onMoveIn: noop,
      onEnd: noop,
      onCancel: noop,
      allowClick: false,
      boundMargin: 50,
      noScrollDelay: 0,
      activeClassDelay: 0,
      inactiveClassDelay: 0
    },
    supportTouch = 'ontouchend' in document,
    events = {
      start: supportTouch ? 'touchstart' : 'mousedown',
      move: supportTouch ? 'touchmove' : 'mousemove',
      end: supportTouch ? 'touchend' : 'mouseup'
    },
    getTargetByCoords = function(x, y){
      var el = d.elementFromPoint(x, y);
      if (el.nodeType == 3) el = el.parentNode;
      return el;
    },
    getTarget = function(e){
      var el = e.target;
      if (el) {
        if (el.nodeType == 3) el = el.parentNode;
        return el;
      }
      var touch = e.targetTouches[0];
      return getTargetByCoords(touch.clientX, touch.clientY);
    },
    clean = function(str){
      return str.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
    },
    addClass = function(el, className){
      if (!className) return;
      if (el.classList){
        el.classList.add(className);
        return;
      }
      if (clean(el.className).indexOf(className) > -1) return;
      el.className = clean(el.className + ' ' + className);
    },
    removeClass = function(el, className){
      if (!className) return;
      if (el.classList){
        el.classList.remove(className);
        return;
      }
      el.className = el.className.replace(new RegExp('(^|\\s)' + className + '(?:\\s|$)'), '$1');
    },
    matchesSelector = function(node, selector){
      var root = d.documentElement,
        matches = root.matchesSelector || root.mozMatchesSelector || root.webkitMatchesSelector || root.oMatchesSelector || root.msMatchesSelector;
      return matches.call(node, selector);
    },
    closest = function(node, selector){
      var matches = false;
      do {
        matches = matchesSelector(node, selector);
      } while (!matches && (node = node.parentNode) && node.ownerDocument);
      return matches ? node : false;
    };

  w.tappable = function(selector, opts){
    if (typeof opts == 'function') opts = { onTap: opts };
    var options = {};
    for (var key in defaults) options[key] = opts[key] || defaults[key];

    var el = options.containerElement || d.body,
      startTarget,
      prevTarget,
      startX,
      startY,
      elBound,
      cancel = false,
      moveOut = false,
      activeClass = options.activeClass,
      activeClassDelay = options.activeClassDelay,
      activeClassTimeout,
      inactiveClassDelay = options.inactiveClassDelay,
      inactiveClassTimeout,
      noScroll = options.noScroll,
      noScrollDelay = options.noScrollDelay,
      noScrollTimeout,
      boundMargin = options.boundMargin;

    var onStart = function(e){
      var target = closest(getTarget(e), selector);
      if (!target) return;

      if (activeClassDelay){
        clearTimeout(activeClassTimeout);
        activeClassTimeout = setTimeout(function(){
          addClass(target, activeClass);
        }, activeClassDelay);
      } else {
        addClass(target, activeClass);
      }
      if (inactiveClassDelay && target == prevTarget) clearTimeout(inactiveClassTimeout);

      startX = e.clientX;
      startY = e.clientY;
      if (!startX || !startY){
        var touch = e.targetTouches[0];
        startX = touch.clientX;
        startY = touch.clientY;
      }
      startTarget = target;
      cancel = false;
      moveOut = false;
      elBound = noScroll ? target.getBoundingClientRect() : null;

      if (noScrollDelay){
        clearTimeout(noScrollTimeout);
        noScroll = false; // set false first, then true after a delay
        noScrollTimeout = setTimeout(function(){
          noScroll = true;
        }, noScrollDelay);
      }
      options.onStart.call(el, e, target);
    };

    var onMove = function(e){
      if (!startTarget) return;

      if (noScroll){
        e.preventDefault();
      } else {
        clearTimeout(activeClassTimeout);
      }

      var target = e.target,
        x = e.clientX,
        y = e.clientY;
      if (!target || !x || !y){ // The event might have a target but no clientX/Y
        var touch = e.changedTouches[0];
        if (!x) x = touch.clientX;
        if (!y) y = touch.clientY;
        if (!target) target = getTargetByCoords(x, y);
      }

      if (noScroll){
        if (x>elBound.left-boundMargin && x<elBound.right+boundMargin && y>elBound.top-boundMargin && y<elBound.bottom+boundMargin){ // within element's boundary
          moveOut = false;
          addClass(startTarget, activeClass);
          options.onMoveIn.call(el, e, target);
        } else {
          moveOut = true;
          removeClass(startTarget, activeClass);
          options.onMoveOut.call(el, e, target);
        }
      } else if (!cancel && abs(y - startY) > 10){
        cancel = true;
        removeClass(startTarget, activeClass);
        options.onCancel.call(target, e);
      }

      options.onMove.call(el, e, target);
    };

    var onEnd = function(e){
      if (!startTarget) return;

      clearTimeout(activeClassTimeout);
      if (inactiveClassDelay){
        if (activeClassDelay && !cancel) addClass(startTarget, activeClass);
        var activeTarget = startTarget;
        inactiveClassTimeout = setTimeout(function(){
          removeClass(activeTarget, activeClass);
        }, inactiveClassDelay);
      } else {
        removeClass(startTarget, activeClass);
      }

      options.onEnd.call(el, e, startTarget);

      var rightClick = e.which == 3 || e.button == 2;
      if (!cancel && !moveOut && !rightClick){
        options.onTap.call(el, e, startTarget);
      }

      prevTarget = startTarget;
      startTarget = null;
      setTimeout(function(){
        startX = startY = null;
      }, 400);
    };

    var onCancel = function(e){
      if (!startTarget) return;
      removeClass(startTarget, activeClass);
      startTarget = startX = startY = null;
      options.onCancel.call(el, e);
    };

    var onClick = function(e){
      var target = closest(e.target, selector);
      if (target){
        e.preventDefault();
      } else if (startX && startY && abs(e.clientX - startX) < 25 && abs(e.clientY - startY) < 25){
        e.stopPropagation();
        e.preventDefault();
      }
    };

    el.addEventListener(events.start, onStart, false);

    el.addEventListener(events.move, onMove, false);

    el.addEventListener(events.end, onEnd, false);

    el.addEventListener('touchcancel', onCancel, false);

    if (!options.allowClick) el.addEventListener('click', onClick, false);

    return {
      el : el,
      destroy : function () {
        el.removeEventListener(events.start, onStart, false);
        el.removeEventListener(events.move, onMove, false);
        el.removeEventListener(events.end, onEnd, false);
        el.removeEventListener('touchcancel', onCancel, false);
        if (!options.allowClick) el.removeEventListener('click', onClick, false);

        return this;
      }
    };

  };

}));
