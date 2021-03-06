
/* SHOW IMAGE IN ORIGINAL SIZE */

let currSelectedImg;

$(function () {
	var range = $("#imageSizeRange");
	range.on("input change", function () {
		applyScaleToImg(range.val(), modalImg[0], currSelectedImg.size);
	});
});

let isPanning = false;
let modalImg;

function openImgDetailsView(imgIndex) {
	modalImg = $('#modalImg');
	
	isPanning = false;
	resetPan();

	let isValid = isNumber(imgIndex) && Number.isInteger(imgIndex) && imgIndex >= 0 && imgIndex <= imagesToLoad.length;
	
	if (!isValid) {
		console.log("Warning: ignoring invalid image index: " + imgIndex);
		return;
	}

	let modalPanner = $('#modalPanner');
	$('#imageSizeRangeContainer').show();
	$('.loader').show();
	$('.sidebar-open-button').hide();
	$('body').css('overflow', 'hidden');
	
	let imageData = currSelectedImg = imagesToLoad[imgIndex];
	currentImageIndex = imgIndex;
	
	if (canNavigateToNext()) {
		$('.next').show();
	} else {
		$('.next').hide();
	}
	
	if (canNavigateToPrevious()) {
		$('.previous').show();
	} else {
		$('.previous').hide();
	}

	// Create a new image element to avoid showing a previous image
	modalImg[0].remove();
	modalPanner.append('<img class="modal-content" id="modalImg" draggable="false"></img>');
	modalImg = $('#modalImg');

	applyImageSizeRange(modalImg[0], imageData.size);
	
	installPanning();
	
	var imgLoaded = function (e) {
		$('.loader').hide();
		preloadImages();
	};
	
	modalImg.on('load', imgLoaded);
	modalImg.attr('src', imageData.image);
	
	if (modalImg[0].complete){
		imgLoaded();
	}
	
	captionText.innerHTML = imageData.title;
	displayRating(imageData.image);
	updateModalNav();
	updateBookmarkOnImageDetailView(imageData.image);
	
	modal.style.display = "block";
	displayTags(imageData.tags);
}

var panStart = { x: 0, y: 0 };
var pan = { x: 0, y: 0 };

function resetPan() {
	panStart = { x: 0, y: 0 };
	pan = { x: 0, y: 0 };
	modalImg.css({'transform' : ''});
}

function installPanning() {
	
	modalImg.on('mousemove', e => {
		if (!isPanning)
			return;

		let dx = e.pageX - panStart.x;
		let dy = e.pageY - panStart.y;

		pan.x += dx;
		pan.y += dy;

		panStart.x = e.pageX;
		panStart.y = e.pageY;
		
		applyPanning();
		
	});

	modalImg.on('mousedown', e => {
		event.preventDefault();
		isPanning = true;
		$('.modal-content').css({'cursor': 'grabbing'});

		panStart.x = e.pageX;
		panStart.y = e.pageY;
	});

	modalImg.on('mouseup', e => {
		isPanning = false;
		$('.modal-content').css({'cursor': 'grab'});
	});
}

function applyPanning() {
	modalImg.css({
			'transform': 'translate(' + pan.x + 'px,' + pan.y + 'px)'
		});
}

function canNavigateToPrevious() {
	return currentImageIndex > 0;
}

function navigateToPrevious(event) {
    if (event) event.stopPropagation();
    
    if (canNavigateToPrevious()) {
		openImgDetailsView(currentImageIndex - 1);
    }
}

function canNavigateToNext() {
	return currentImageIndex < imagesToLoad.length - 1;
}

function navigateToNext(event) {
    if (event) event.stopPropagation();
    
    if (canNavigateToNext()) {
		openImgDetailsView(currentImageIndex + 1);
    }
}

function updateModalNav() {
	modalNavCurrentEl.value = currentImageIndex + 1;
	modalNavMaxEl.textContent = imagesToLoad.length;
}

/**
* Updates the size range slider and sets the optimal initial scale.
* Optimal means to size the image so it covers most of the screen but is not cut off.
* Small images are scaled up whereas images exceeding the screen resolution are scaled down.
* Always scale all sides uniformly by a single scalar so proprtions are maintained.
*
* However, very tall or wide images should not be sqeezed (e.g. single image webcomics).
*/
function applyImageSizeRange(img, size) {

	let currentImg = img;

	if (!size) {
		size = { w: currentImg.naturalWidth, h: currentImg.naturalHeight };
	};
	
	let screenWidth = document.documentElement.clientWidth;
	let optimalWidth = optimalWidthRatio * screenWidth;
	let optimalScaleWidth = optimalWidth / size.w;
	let imgWidthExceedsOptimal = optimalScaleWidth < 1;
	let attemptScaleUpWidth = scaleUpImageWidth && !imgWidthExceedsOptimal;
	let attemptScaleDownWidth = scaleDownImageWidth && imgWidthExceedsOptimal;
	let attemptScaleWidth = attemptScaleUpWidth || attemptScaleDownWidth;
	
	let screenHeight = document.documentElement.clientHeight;
	let optimalHeight = optimalHeightRatio * screenHeight;
	let optimalScaleHeight = optimalHeight / size.h;
	let imgHeightExceedsOptimal = optimalScaleHeight < 1;
	let attemptScaleUpHeight = scaleUpImageHeight && !imgHeightExceedsOptimal;
	let attemptScaleDownHeight = scaleDownImageHeight && imgHeightExceedsOptimal;
	let attemptScaleHeight = attemptScaleUpHeight || attemptScaleDownHeight;
	
	// either scale up or down where scaling down has precedence
	let attemptToScaleDown = attemptScaleDownHeight || attemptScaleDownWidth;
	
	// evaluate which side of the image to scale according to the side which required greater scaling (optimal) unless suppressed by config
	let scaleHeight = false;
	let scaleWidth = false;
	// true if height needs to be scaled for optimal image fit, otherwise it's the width
	let scaleHeightForOptimalFit = false;
	if (attemptToScaleDown) {
		// attempt to scale the image according to the side which requires a smaller scaling factor
		if (optimalScaleHeight < optimalScaleWidth) { // check if for the optimal scale we need to adjust the height
			// Now compare the height scale to the configured height scale threshold.
			// As a reference use the image how it would look without the height scale but potentially width scale.
			let heightToCompare = size.h;
			if (attemptScaleDownWidth) {
				heightToCompare *= optimalScaleWidth;
			}
			// get the ratio between this image height to the screen height
			let heightWindowRatio = heightToCompare / screenHeight;
			// only scale height if we don't exceed our threshold
			scaleHeight = scaleHeightRatioThreshold > heightWindowRatio;
			scaleHeightForOptimalFit = true;
		} else {
			// The width needs more or equal scaling than the image height.
			// Now compare the width scale to the configured width scale threshold.
			// As a reference use the image how it would look without the width scale but potentially height scale.
			let widthToCompare = size.w;
			if (attemptScaleDownHeight) {
				widthToCompare *= optimalScaleHeight;
			}
			// get the ratio between this image width to the screen width
			let widthWindowRatio = widthToCompare / screenWidth;
			// only scale width if we don't exceed our threshold
			scaleWidth = scaleWidthRatioThreshold > widthWindowRatio;
			optimalScalingApplies = scaleWidth;
		}
	} else {
		// attempt to scale the image according to the side which requires a larger scaling factor
		if (optimalScaleHeight > optimalScaleWidth) { // check if for the optimal scale we need to adjust the height
			scaleHeight = attemptScaleUpHeight;
			scaleHeightForOptimalFit = true;
		} else {
			scaleWidth = attemptScaleUpWidth;
		}
	}
	
	if (!(scaleHeight || scaleHeight)) { // check if optimal scaling is suppressed
		// fallback: attempt to scale the other side
		if (scaleHeightForOptimalFit) {
			// attempt to scale width
			if (attemptScaleWidth) {
				let widthToCompare = size.w;
				// get the ratio between this image width to the screen width
				let widthWindowRatio = widthToCompare / screenWidth;
				// only scale width if we don't exceed our threshold
				scaleWidth = scaleWidthRatioThreshold > widthWindowRatio;
			}
			
		} else {
			// attempt to scale height
			if (attemptScaleHeight) {
				let heightToCompare = size.h;
				// get the ratio between this image height to the screen height
				let heightWindowRatio = heightToCompare / screenHeight;
				// only scale height if we don't exceed our threshold
				scaleHeight = scaleHeightRatioThreshold > heightWindowRatio;
			}
		}
	}
	
	let optimalScale = 1.0;
	if (scaleHeight) {
		optimalScale = optimalScaleHeight;
	} else if (scaleWidth) {
		optimalScale = optimalScaleWidth;
	}
	 
	if (optimalScale > maxScale) {
		optimalScale = maxScale;
	}
	
	var range = $("#imageSizeRange");
	range.attr('max', maxScale);
	range.css("display", "block");
	range.val(optimalScale);
	applyScaleToImg(range.val(), currentImg, size);
}

function applyScaleToImg(scale, currentImg, size) {
	let newImgWidth = size.w * scale;
	let newImgHeight = size.h * scale;
	let currentImgWidth = parseInt(currentImg.style.width, 10);
	let currentImgHeight = parseInt(currentImg.style.height, 10);
	let scaleDeltaHeight = newImgHeight / currentImgHeight;
	
	currentImg.style.width = newImgWidth + 'px';
	currentImg.style.height = newImgHeight + 'px';
	
	// center image
	let screenHeight = document.documentElement.clientHeight;
	if (newImgHeight < screenHeight) {
		let imgTopPos = (screenHeight / 2) - (newImgHeight / 2);
		currentImg.style.top = imgTopPos + 'px';
	} else {
		currentImg.style.top = 0 + 'px';
	}
	
	// adjust panning translation so the image remains visible when scaled down and was dragged down or up
	if (scaleDeltaHeight < 1) {
		pan.y *= scaleDeltaHeight;
		applyPanning();
	}
}

function resizeImage(event) {
	// change image size based on scroll event
	var range = $("#imageSizeRange");
	if (range.length) {
		var delta = event.originalEvent.wheelDelta/120 || -event.originalEvent.detail/3;
		range.val(range.val() - delta*0.04);
		range.change();
	}
}

function moveImageY(event) {
	// change image Y based on scroll event
	// move the image vertically if there is more to see in the scrolling direction
	let delta = event.originalEvent.wheelDelta/120 || -event.originalEvent.detail/3;
	let isScrollingUp = delta > 0;
	if ((isScrollingUp && isImgTopOutsideScreen()) || (!isScrollingUp && isImgBottomOutsideScreen())) {
		pan.y += delta * 50;
		applyPanning();
	}
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

$(function() {
	$(modalNavCurrentEl).on('keydown', function(e) {
	  if (event.key == 'Enter') {
		event.preventDefault();
		let newImgInx = Number(modalNavCurrentEl.value);
		if (isNumber(newImgInx) && Number.isInteger(newImgInx) && newImgInx > 0 && newImgInx <= imagesToLoad.length && (newImgInx - 1) != currentImageIndex) {
			openImgDetailsView(--newImgInx);
		}
		e.target.blur();
	  }
	});
})


function closeImageView(event, forceClose) {

	if (event.target.id === 'modalImg') {
		return;
	}

	if (!forceClose && isEditingModalComponent()) return;

	$('#imageSizeRangeContainer').hide();
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

function isEditingModalComponent() {
	return isEditingNav() || isEditingTags();
}

function isEditingNav() {
	return activeElementHasId('modalNavCurrent');
}

// if a tag was removed, the image may not pass the currently selected filter criteria anymore
function maybeRemovePreviewImg() {
	// this is a nice to have self contained functionality, so an error should not impact other features
	try {
		let currImgData = imagesToLoad[currentImageIndex];
		// double check we got the right image
		if (currImgData && gallery.images[currentImageIndex] && currImgData.image === gallery.images[currentImageIndex].data.image) {
			if (!filterFunction([currImgData]).length) {
				gallery.remove(currentImageIndex);
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

function syncGalleryWithImg(event) {
	event.stopPropagation();
	
	loadImages(currentImageIndex);
}

