/* SHOW IMAGE IN ORIGINAL SIZE */

// allow scrolling with mousewheel
var scrollDistance = 170;

$(window).on("mousewheel DOMMouseScroll", function(event){
	// is viewing image in original size / custom resize mode on
	if ($("#fullSizeImage").length && $("#fullSizeImage").get(0).style.display != "none") {
		var target = $(".galleria-images").get(0);

		event.preventDefault();
		
		if (event.shiftKey) {
			// change image size
			var range = $("#imageSizeRange");
			if (range.length) {
				var delta = event.originalEvent.wheelDelta/120 || -event.originalEvent.detail/3;
				range.val(range.val() - delta*0.04);
				range.change();
			}
			
		} else {
			// scroll the view
			var delta = event.originalEvent.wheelDelta/120 || -event.originalEvent.detail/3;
			target.scrollTop -= parseInt(delta*scrollDistance);
		}
		
	}
});


Galleria.on('fullscreen_exit', function(e) {
	hideImageSizeRange();
});

function hideImageSizeRange() {
	var range = $("#imageSizeRange");
	if (range.length) {
		range.css('display','none');
	}
}

// galleria event callback when an preview image has been selected and is displayed in the lightbox 
Galleria.on('image', function(e) {

	++numberOfFullSizeImagesLoaded;
		
	// move the info box to the left from center
	// actually moves presumably because the folio theme sets the style -webkit-transition: all 100ms;
	$('.galleria-info').css("left", "0px");

	// TODO: remove, can be retireved statically
	var galleriaRef = this;
	
	displayRating(e.imageTarget);

	// when selecting next or prev image, need to reset the full size image view as it does not display properly (scroll pane is still as large as previous image)
	// to do so we set a custom id to mark the image we last viewed in full size, retrieving the current image from Galleria would not work because the full sized image may not be the current one anymore
	if ($("#fullSizeImage").length) {
		resetFullSizeView(e, galleriaRef)
	}

	// show original image size when clicking on the image
	// e.imageTarget = the currently active IMG HTML element
	e.imageTarget.parentElement.onclick = function() {
	
		if (!$("#fullSizeImage").length) {
			
			currentImg = e.imageTarget;
			currentImg.id = "fullSizeImage";
			
			currentImg.parentElement.parentElement.style.overflow = 'auto';
			currentImg.parentElement.style.overflow = ''; // if we set auto here, it will crop the vertical scrollbar for some reason
			currentImg.parentElement.style.height = 'auto';
			currentImg.parentElement.style.width = 'auto';
			currentImg.parentElement.style.position = '';
			
			currentImg.style.height = 'auto';
			currentImg.style.width = 'auto';
			currentImg.height = 'auto';
			currentImg.width = 'auto';
			currentImg.style.margin = 'auto';
			// clear the absolute positioning because for some reason does not show otherwise
			currentImg.style.position = '';
			currentImg.style.overflow = 'auto';
			
			// issue: this hides the left/right navigation completely
			//$(".galleria-image-nav").css("z-index", "-1");
			// the nav spans from right to left with 100% width and would blocks click event on the image or the scrollbar
			// it starts to block because the position is cleared from the image, which means the z-index property stops working and it slides into the background
			// so set to ignore click events but allow click events specifically on the left and right navigation which are only small bars on the sides of the screen
			$(".galleria-image-nav").css("pointer-events", "none");
			$(".galleria-image-nav-right").css("pointer-events", "auto");
			$(".galleria-image-nav-left").css("pointer-events", "auto");
			// need to leave a bit of space to not obstruct the scrollbar by the right nav element control which overlays the image
			$(".galleria-image-nav").css("width", "99%");
			
			// custom resize
			let optimalWidthRatio = 0.80;
			let maxScale = 1.5;
			let screenWidth = document.documentElement.clientWidth;
			let optimalWidth = optimalWidthRatio * screenWidth;
			let optimalScale = optimalWidth / currentImg.clientWidth;
			if (optimalScale > maxScale) {
				optimalScale = maxScale;
			}
			
			var range = $("#imageSizeRange");
			if (!range.length) {
				var rangeHtml = '<input type="range" class="form-range image-size-range" min="0.1" max="' + maxScale + '" step="0.01" id="imageSizeRange" data-toggle="tooltip" data-placement="bottom" title="Use Shift + Mousewheel">';
				$('.galleria-container').append(rangeHtml);
				range = $("#imageSizeRange");
			} else {
				range.css('display','block');
			}
			
			range.css("display", "block");
			range.on("input change", function() {
				applyScaleToImg(range.val(), currentImg);
			});
			
			range.val(optimalScale);
			applyScaleToImg(range.val(), currentImg);
			
		} else {
			resetFullSizeView(e, galleriaRef);
		}
	}
});

function applyScaleToImg(scale, currentImg) {
	var newHeight = currentImg.naturalHeight * scale + 'px';
	var newWidth = currentImg.naturalWidth * scale + 'px';
	currentImg.style.height = newHeight;
	currentImg.style.width = newWidth;
	currentImg.width = newWidth;
	currentImg.height = newHeight;
}

// TODO: no need to pass in the galleria ref, can be retirved statically
function resetFullSizeView(e, galleriaRef) {
	// Fitting image to screen size
	
	var currentImg = $("#fullSizeImage").get(0);
	
	hideImageSizeRange();
	
	currentImg.parentElement.parentElement.style.overflow = 'hidden';
	currentImg.parentElement.style.overflow = 'hidden';
	currentImg.parentElement.style.height = '100%';
	currentImg.parentElement.style.width = '100%';
	currentImg.parentElement.style.position = 'absolute';
	
	currentImg.style.height = '100%';
	currentImg.style.width = '100%';
	currentImg.height = '';
	currentImg.width = '';
	currentImg.style.margin = '';
	currentImg.style.position = 'absolute';
	currentImg.style.overflow = 'hidden';
	
	// bug: do not unset these; for some reason they are sometimes not set again so the image can not be clicked...
	//$(".galleria-image-nav").css("width", "100%");
	//$(".galleria-image-nav").css("pointer-events", "");
	//$(".galleria-image-nav-right").css("pointer-events", "");
	//$(".galleria-image-nav-left").css("pointer-events", "");
	
	currentImg.id = null;
	
	// TODO: if the window is resized while viewing full image, the image is rescaled to fit the screen, above code to reset the style should be triggered on the rescale callback
	//galleriaRef.resize({width:'100%', height:'100%'});
	galleriaRef.refreshImage();
}