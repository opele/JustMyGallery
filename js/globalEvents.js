// window keyboard event listener
 $(function() {
		 
		 // use keydown instead of keypress which also catches non-printing keys such as Shift, Esc...
		$(window).keydown(function( event ) {
		
			if (isViewingImage() && !isEditingModalComponent()) { // single image mode
				// enable rating with number keys 1 to 5
				processKeyEvtForRating(event);
				
				if (event.key == "ArrowLeft") {
				  navigateToPrevious(null);
				  
				} else if (event.key == "ArrowRight") {
				  navigateToNext(null);
				  
				} else if (event.key == "Escape") {
				  closeModal(true);
				  
				} else if (event.key == "ArrowUp") {
					modal.scrollTop -= 20;
					
				} else if (event.key == "ArrowDown") {
					modal.scrollTop += 20;
				}
				
			} else if (!isViewingImage()) { // displaying gallery with preview images
			
				if (event.key == 'Escape') {
					closeSidebar();
				
				} else if (event.key == '1' && !isSidebarVisible()) {
					// when the sidebar is already visible, this prevents switching between the different sidebars
					// this is a problem when typing numbers into an input field
					openSearchSidebar();
				} else if (event.key == '3' && !isSidebarVisible()) {
					openSettingsSidebar();
				}
			}
				
		});
		
		// TODO
		$(window).on("mousewheel DOMMouseScroll", function(event) {
			if (isViewingImage() && !isEditingModalComponent()) {
				resizeImage(event);
				// return false; // causes warning as listerner is registered as passive
			}
		});
 });