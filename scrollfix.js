/**
 * ScrollFix v0.1
 * http://www.joelambert.co.uk
 *
 * Copyright 2011, Joe Lambert.
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 */

var ScrollFix = function(elem) {
	// Variables to track inputs
	var startY = startTopScroll = deltaY = undefined,
	
	// Create a lock to prevent multiple interference per interaction
	modifiedY = false,
	
	// Get the first child of the element and treat it as the content	
	content = elem.querySelector('*');
	
	// If there is no content, then do nothing	
	if(!content)
		return;

	// Handle the start of interactions
	elem.addEventListener('touchstart', function(event){
		startY = event.touches[0].pageY;
		startTopScroll = elem.scrollTop;
		
		// Reset the lock
		modifiedY = false;
		
		//console.log('start (top):', startTopScroll);
		//console.log('start (bottom):', startTopScroll + elem.offsetHeight, content.offsetHeight);
		
		if(startTopScroll <= 0)
			elem.scrollTop = 1;

		if(startTopScroll + elem.offsetHeight >= content.offsetHeight)
			elem.scrollTop = content.offsetHeight - elem.offsetHeight - 1;
	}, false);
	
	// Handle movements
	elem.addEventListener('touchmove', function(event){
		deltaY = event.touches[0].pageY - startY;
		
		// Is the content currently at the top?
		if(startTopScroll == 0 && deltaY > 0 && !modifiedY) {
			// Offset the scroll position to prevent Safari scrolling the whole page
			elem.scrollTop = 1;
			modifiedY = true;
			event.stopPropagation();
		}
		
		//console.log(startTopScroll, elem.offsetHeight, content.offsetHeight);
		
		// Is the content currently at the bottom?
		if(startTopScroll + elem.offsetHeight == content.offsetHeight && !modifiedY) {
			// Offset the scroll position to prevent Safari scrolling the whole page
			elem.scrollTop = startTopScroll-1;
			modifiedY = true;
			event.stopPropagation();
		}
	}, false);
};