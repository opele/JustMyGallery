/* SHOW IMAGE IN ORIGINAL SIZE */

// allow scrolling with mousewheel
var scrollDistance = 170;

function resizeImage(event) {

	//event.preventDefault();
	
	if (event.shiftKey) {
		// change image size
		var range = $("#imageSizeRange");
		if (range.length) {
			var delta = event.originalEvent.wheelDelta/120 || -event.originalEvent.detail/3;
			range.val(range.val() - delta*0.04);
			range.change();
		}
		
	}
}


function navigateToPrevious(event) {
    if (event) event.stopPropagation();
    
    if (currentImageIndex > 0) {
        currentImageIndex -= 1;
		let prevImgData = imagesToLoad[currentImageIndex];
        modalImg.src = prevImgData.image;
        captionText.innerHTML = prevImgData.title;
    }
}


function navigateToNext(event) {
    if (event) event.stopPropagation();
    
    if (currentImageIndex < imagesToLoad.length - 1) {
        currentImageIndex += 1;
		let nextImgData = imagesToLoad[currentImageIndex];
        modalImg.src = nextImgData.image;
        captionText.innerHTML = nextImgData.title;
    }
}

function closeModal() {
    modal.style.display = "none";
	
	hideImageSizeRange();
	
	if (!isSidebarVisible())
		$('#sidebarOpenBtn').show();
	
	$('body').css('overflow', 'auto');
}

/*
Galleria.on('fullscreen_exit', function(e) {
	hideImageSizeRange();
	if (customTagsDirty) {
		refreshSelectableTags();
		// issue: shows a white background with a loading animation instead of the preview image of the remaining pictures
		setTimeout(maybeRemovePreviewImg, 3000);
	}
	$('.container').css('display','block');
	
	
});

Galleria.on('fullscreen_enter', function(e) {
	// hide the header, otherwise it flickers into view for a short moment when opening / closing an image
	$('.container').css('display','none');
});
*/

// if a tag was removed, the image may not pass the currently selected filter criteria anymore
function maybeRemovePreviewImg() {
	// this is a nice to have self contained functionality, so an error should have no impact
	try {
		let galRef = Galleria.get(0);
		let currImgInx = galRef.getIndex();
		let currImgData = imagesToLoad[currImgInx];
		// double check we got the right image
		if (currImgData && currImgData.image === galRef.getActiveImage().getAttribute("src")) {
			if (!filterFunction([currImgData]).length) {
				galRef.splice(currImgInx, 1);
				imagesToLoad.splice(currImgInx, 1);
				updateImgCountDisplay();
			}
		}
	} catch (e) {
		console.error('Failed to remove preview image after deleting a tag:');
		console.error(e, e.stack);
	}
}

function hideImageSizeRange() {
	var range = $("#imageSizeRange");
	if (range.length) {
		range.css('display','none');
	}
}

function showImageSizeRange() {
	
	let currentImg = modalImg;
	// custom resize
	let optimalWidthRatio = 0.75;
	let maxScale = 1.5;
	let screenWidth = document.documentElement.clientWidth;
	let optimalWidth = optimalWidthRatio * screenWidth;
	let optimalScale = optimalWidth / currentImg.naturalWidth;
	if (optimalScale > maxScale) {
		optimalScale = maxScale;
	}
	
	var range = $("#imageSizeRange");
	if (!range.length) {
		var rangeHtml = '<input type="range" class="form-range image-size-range" min="0.1" max="' + maxScale + '" step="0.01" id="imageSizeRange" data-toggle="tooltip" data-placement="bottom" title="Use Shift + Mousewheel">';
		gallery.options.container.append(rangeHtml);
		range = $("#imageSizeRange");
	}
	
	range.css("display", "block");
	range.on("input change", function() {
		applyScaleToImg(range.val(), currentImg);
	});
	
	range.val(optimalScale);
	applyScaleToImg(range.val(), currentImg);
}

function applyScaleToImg(scale, currentImg) {
	var newHeight = currentImg.naturalHeight * scale;
	var newWidth = currentImg.naturalWidth * scale;
	currentImg.style.height = newHeight + 'px';
	currentImg.style.width = newWidth + 'px';
	currentImg.width = newWidth;
	currentImg.height = newHeight;
}

/* galleria event callback when an preview image has been selected and is displayed in the lightbox 
Galleria.on('image', function(e) {

	++numberOfFullSizeImagesLoaded;
	
	displayRating(e.imageTarget);
	displayTags(e.imageTarget);

	// when selecting next or prev image, need to reset the full size image view as it does not display properly (scroll pane is still as large as previous image)
	// to do so we set a custom id to mark the image we last viewed in full size, retrieving the current image from Galleria would not work because the full sized image may not be the current one anymore
	if ($("#fullSizeImage").length) {
		resetFullSizeView(e)
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
			resetFullSizeView(e);
		}
	}
});*/

// TODO: no need to pass in the galleria ref, can be retirved statically
function resetFullSizeView(e) {
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
	Galleria.get(0).refreshImage();
}
