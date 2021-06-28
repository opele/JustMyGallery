
/* SHOW IMAGE IN ORIGINAL SIZE */


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

function closeModal(forceClose) {
	
	if (!forceClose && isEditingTags()) return;
	
    modal.style.display = "none";
	
	hideImageSizeRange();
	if (customTagsDirty) {
		refreshSelectableTags();
		maybeRemovePreviewImg();
	}
	
	if (!isSidebarVisible())
		$('.sidebar-open-button').show();
	
	$('body').css('overflow', 'auto');
}

// if a tag was removed, the image may not pass the currently selected filter criteria anymore
function maybeRemovePreviewImg() {
	// this is a nice to have self contained functionality, so an error should not impact other features
	try {
		let currImgData = imagesToLoad[currentImageIndex];
		// double check we got the right image
		if (currImgData && gallery.images[currentImageIndex] && currImgData.image === gallery.images[currentImageIndex].image) {
			if (!filterFunction([currImgData]).length) {
				gallery.remove(currentImageIndex, 1);
				imagesToLoad.splice(currentImageIndex, 1);
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
	
	// when scrolled to the bottom and navigating to the next image, we want to start from the top again
	modal.scrollTop = 0;
	
	let currentImg = modalImg;
	let screenWidth = document.documentElement.clientWidth;
	let optimalWidth = optimalWidthRatio * screenWidth;
	let optimalScaleWidth = optimalWidth / currentImg.naturalWidth;
	
	let screenHeight = document.documentElement.clientHeight;
	let optimalHeight = optimalHeightRatio * screenHeight;
	let optimalScaleHeight = optimalHeight / currentImg.naturalHeight;
	
	// determine if the height should be fitted to the window size
	let scaleHeight = false;
	// check if enabled in options
	if (scaleUpImageHeight) {
		// evaluate if we should scale height at all, we don't want to shrink down very long images like webcomics
		// 1. get the length of the image but AFTER we scaled to optimal width
		let heightWithOptimalWidth = optimalScaleWidth * currentImg.naturalHeight;
		// 2. get the ratio between this height to the screen height
		let heightWithOptimalWidthWindowHeightRatio = heightWithOptimalWidth / screenHeight;
		// 3. only scale height if we don't exceed our threshold
		scaleHeight = scaleHeightRatioThreshold > heightWithOptimalWidthWindowHeightRatio;
	}
	
	let optimalScale = 1.0;
	if (scaleHeight && scaleUpImageWidth) {
		optimalScale = Math.min(optimalScaleHeight, optimalScaleWidth);
	} else if (scaleHeight) {
		optimalScale = optimalScaleHeight;
	} else if (scaleUpImageWidth) {
		optimalScale = optimalScaleWidth;
	}
	 
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

function preloadImages() {
	preloadNextImages();
	preloadPreviousImages();
}

function preloadNextImages() {
	for (let i = 0; i < numberOfNextImgsToPreload; i++) {
		
		let nextImgInx = currentImageIndex + 1 + i;
		if (nextImgInx >= imagesToLoad.length) break;
		
        preloadedImages[i] = new Image();
        preloadedImages[i].src = imagesToLoad[nextImgInx].image;
    }
}

function preloadPreviousImages() {

	if (preloadedImages.length > 30) preloadedImages = [];
	let start = preloadedImages.length;
	
	for (let i = 0; i < numberOfPrevImgsToPreload; i++) {
		
		let prevImgInx = currentImageIndex - 1 - i;
		if (prevImgInx < 0) break;
		
        preloadedImages[start + i] = new Image();
        preloadedImages[start + i].src = imagesToLoad[prevImgInx].image;
    }
}
