// window keyboard event listener
 $(function() {
		 
		 // use keydown instead of keypress which also catches non-printing keys such as Shift, Esc...
		$(window).keydown(function( event ) {
		
			if (isViewingImage() && !isEditingTags()) { // single image mode
				// enable rating with number keys 1 to 5
				processKeyEvtForRating(event);
				
			} else { // displaying gallery with preview images
			
				if (event.key == 'Escape') {
					closeSidebar();
				
				} else if (event.key == '1') {
					openSidebar();
				}
			}
				
		});
 });
 
  function isEditingTags() {
	return document.activeElement != null &&
	  document.activeElement.className != null && 
	  document.activeElement.className.includes('my-tag');
  }