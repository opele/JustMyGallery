
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


function navigateToPrevious(event) {
    if (event) event.stopPropagation();
    
    if (currentImageIndex > 0) {
		openImgDetailsView(currentImageIndex - 1);
    }
}

function navigateToNext(event) {
    if (event) event.stopPropagation();
    
    if (currentImageIndex < imagesToLoad.length - 1) {
		openImgDetailsView(currentImageIndex + 1);
    }
}

function updateModalNav() {
	modalNavCurrentEl.value = currentImageIndex + 1;
	modalNavMaxEl.textContent = imagesToLoad.length;
}

function applyImageSizeRange(img, size) {

	let currentImg = img;

	if (!size) {
		size = { w: currentImg.naturalWidth, h: currentImg.naturalHeight };
	};

	let imgHeightExceedsWidth = size.h > size.w;
	
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
	
	// attempt to scale the image according to its longer side, meaning the other side falls into place since we are scaling uniformly
	let scalingLongerSide = false;
	let scaleHeight = false;
	let scaleWidth = false;
	if (imgHeightExceedsWidth) {
		if (attemptScaleHeight) {
			// For comparing if the image height exceeds the configured height threshold,
			// first factor out the width, so when the image is also wide we still scale down to perfect fit.
			// However, fallback to the original height when width scaling is turned off.
			let heightToCompare = size.h;
			if (attemptScaleDownWidth) {
				heightToCompare *= optimalScaleWidth;
			}
			// get the ratio between this image height to the screen height
			let heightWindowRatio = heightToCompare / screenHeight;
			// only scale height if we don't exceed our threshold
			scaleHeight = scaleHeightRatioThreshold > heightWindowRatio;
			scalingLongerSide = scaleHeight;
		}
	} else {
		// the image is wider than high
		if (attemptScaleWidth) {
			// For comparing if the image width exceeds the configured width threshold,
			// first factor out the height, so when the image is also tall we still scale down to perfect fit.
			// However, fallback to the original width when height scaling is turned off.
			let widthToCompare = size.w;
			if (attemptScaleDownHeight) {
				widthToCompare *= optimalScaleHeight;
			}
			// get the ratio between this image width to the screen width
			let widthWindowRatio = widthToCompare / screenWidth;
			// only scale width if we don't exceed our threshold
			scaleWidth = scaleWidthRatioThreshold > widthWindowRatio;
			scalingLongerSide = scaleWidth;
		}
	}
	
	if (!scalingLongerSide) {
		// fallback scaling according to shorter side, so at least this side is fit to the screen size
		if (imgHeightExceedsWidth) {
			// attempt to scale width
			if (attemptScaleWidth) {
				let widthToCompare = size.w;
				// get the ratio between this image width to the screen width
				let widthWindowRatio = widthToCompare / screenWidth;
				// only scale width if we don't exceed our threshold
				scaleWidth = scaleWidthRatioThreshold > widthWindowRatio;
			}
			
		} else {
			// the image is wider than high
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
	
	displayImagesStartingAt(currentImageIndex);
}

