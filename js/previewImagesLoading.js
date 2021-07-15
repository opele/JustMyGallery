
var customTagsDirty = false; // when true, tags need to be refreshed

var sortByRating = false;
var sortByDateAsc = false;
var sortByDateDesc = false;
var sortByName = false;

var filterByNameEnabled = false;
var filterByDateEnabled = false;
var currentFromFilterDate;
var currentToFilterDate;
var filterByTagsEnabled = false;
var currentFilterTags;
var filterByCategoryEnabled = false;
var currentFilterCategory;
var categoriesAndTags = true;

var nameFilterFunc = function(dataItemToFilter) {return true;};
var tagsFilterFunc = function(dataItemToFilter) {return true;};
var categoryFilterFunc = function(dataItemToFilter) {return true;};
var dateRangeFilterFunc = function(dataItemToFilter) {return true;};
var filterFunction = function(arr) {
		return arr.filter(function(dataItemToFilter) {
				return nameFilterFunc(dataItemToFilter) && 
				
					// if tag AND category filters are on, only then consider categoriesAndTags
					// otherwise the OR condition is true and we don't even evaluate the filters
					((!filterByTagsEnabled || !filterByCategoryEnabled) ||
						((categoriesAndTags && tagsFilterFunc(dataItemToFilter) && categoryFilterFunc(dataItemToFilter)) ||
						(!categoriesAndTags && (tagsFilterFunc(dataItemToFilter) || categoryFilterFunc(dataItemToFilter))))
					) &&
					
					// if one of them is off, then just apply it regardless of categoriesAndTags
					// this avoids showing all results when categoriesAndTags = false (i.e. OR filtering) and one of the filters is not active (i.e. allows all)
					((filterByTagsEnabled && filterByCategoryEnabled) ||
						(tagsFilterFunc(dataItemToFilter) && categoryFilterFunc(dataItemToFilter))
					) &&
					
					dateRangeFilterFunc(dataItemToFilter);
			});
	};

// gallery object which manages the preview images
var gallery;
// imagesToLoad contains all the images available for display according to currently selected filter criteria
var imagesToLoad;
// index of the first loaded preview image, all previous images are not displayed in the gallery
// i.e. equal to the number of unloaded previous images
var imgIdxOffset = 0;
// number of next images to load when scrolled to the bottom
var chunkSize = 15;
var scrolledToEnd = false;
var scrolledToTop = false;

/** detail image view element variables for caching **/
var currentImageIndex = 0; // index of the currently or last opened image
var modal;
var modalImg;
var next;
var previous;
var captionText;
var ratingEl;
var predefinedTagsEl;
var userDefinedTagsEl;
var modalNavCurrentEl;
var modalNavMaxEl;
var addBookmarkEl;

/** bookmarks modal **/
var bookmarksModalEl;
var bookmarksListEl;

/** scaling options for the image details view, most of which can be user configured **/
var scaleUpImageHeight = true;
var scaleUpImageWidth = true;
var scaleDownImageWidth = true;
var scaleDownImageHeight = true;
// the image width is scaled to 70% of the screen width
var optimalWidthRatio = 0.7;
// the image height is scaled to 95% of the screen height
var optimalHeightRatio = 0.95;
// when image width is scaled down to fit the screen, the image must be more than 3x as tall than the screen to NOT scale height
var scaleHeightRatioThreshold = 3;
// when image height is scaled down to fit the screen, the image must be more than 3x as wide than the screen to NOT scale width
var scaleWidthRatioThreshold = 3;
// only allow to scale up to twice the original size (original size = slider in the middle)
var maxScale = 2;

// preloading options of full sized images in relation the the currently opened image
var preloadedImages = [];
var numberOfPrevImgsToPreload = 1;
var numberOfNextImgsToPreload = 2;

$(function(){
	refreshSelectableTags();
	refreshSelectableCategories();
});

$(function() {

	modal = document.getElementById("imageModal");
	modalImg = document.getElementById("modalImg");
	captionText = document.getElementById("caption");
	ratingEl = document.getElementById("rating");
	predefinedTagsEl = document.getElementById("predefinedTags");
	userDefinedTagsEl = document.getElementById("myTags");
	modalNavCurrentEl = document.getElementById("modalNavCurrent");
	modalNavMaxEl = document.getElementById("modalNavMax");
	addBookmarkEl = document.getElementById("addBookmark");
	
	bookmarksModalEl = document.getElementById("bookmarksModal");
	bookmarksListEl = document.getElementById("bookmarksList");
	
	initSearchSidebar();
	initSettingsSidebar();
	
	loadImages();
});

function loadImages() {
	
	scrolledToEnd = false;

	imagesToLoad = imgData;
	if (typeof filterFunction === 'function') {
		imagesToLoad = filterFunction(imagesToLoad);
	}
	
	updateImgCountDisplay();
	
	imagesToLoad.sort(sortImages);
	
	gallery = new Gallery({
	  container: '.gallery-container',
	  images: imagesToLoad.slice(imgIdxOffset, 30),
	  columnWidth: 230,
	  spacing: 10,
	  imageOnLoadCallback: updateLazyLoadSentinel
	});
	
	if (imgIdxOffset > 0) {
		// add space to allow scrolling up for loading previous images
		gallery.options.container.css('padding-top', '500px');
		window.scrollTo(0, 1000);
	} else {
		// navigate to top
		window.scrollTo(0, 0);
	}
}

function displayImagesStartingAt(offset) {
	imgIdxOffset = offset;
	loadImages();
}

// Add or update LazyLoadSentinel when an image loads. Passed into Gallery constructor.
// This event may only fire for one image if the whole chunk is loaded from cache. 
// imageData then points to a random image and can have top = 0 but gallery.loadedImages is incremented by the chunk size (all images loaded = true).
// Therefore, can't use imageData to position the sentinel. Retrieve the last loaded image after which the sentinel should be positioned.
function updateLazyLoadSentinel(e, imageData, imgEl) {
		
	// TODO: when image fails loading, we never get past this
	if (!gallery.allImgsLoaded()) return;
	
	updateBottomSentinel();
	updateTopSentinel();
}

function updateBottomSentinel() {
	
	let lastLoadedImgData = gallery.lastLoaded();
	
	var sentinel = $('#sentinel');
	let isNew = false;
	
	if (sentinel == null || !sentinel.length) {
		isNew = true;
		gallery.columnsContainer.append('<div id="sentinel"></div>');
		sentinel = $('#sentinel');
	}
	
	if (!sentinel.position() || sentinel.position().top < lastLoadedImgData.top)
		sentinel.css({top: lastLoadedImgData.top, left: lastLoadedImgData.left, position:'absolute'});
	
	if (isNew) {
		registerIntersectionCallback();
	} else {
		tryLoadNextChunk();
	}
}

function updateTopSentinel() {
	
	var sentinel = $('#topSentinel');
	let isNew = false;
	
	if (sentinel == null || !sentinel.length) {
		isNew = true;
		gallery.columnsContainer.append('<div id="topSentinel"></div>');
		sentinel = $('#topSentinel');
	}
	
	sentinel.css({top: '-100px', left: '50%', position:'absolute'});
	
	if (isNew) {
		registerIntersectionWithTopCallback();
	} else {
		tryLoadPreviousChunk();
	}
}

// detect scrolling down
var observer;
function registerIntersectionCallback() {
	let intersectionCallback = (entries, observer) => {
	  entries.forEach(entry => {
		  if (entry.isIntersecting) {
			scrolledToEnd = true;
			tryLoadNextChunk();
		  } else {
			scrolledToEnd = false;
		  }
	  });
	};
	
	observer = new IntersectionObserver(intersectionCallback);
	observer.observe($('#sentinel').get(0));
}

// detect scrolling up
var topObserver;
function registerIntersectionWithTopCallback() {
	let intersectionCallback = (entries, observer) => {
	  entries.forEach(entry => {
		  if (entry.isIntersecting) {
			scrolledToTop = true;
			tryLoadPreviousChunk();
		  } else {
			scrolledToTop = false;
		  }
	  });
	};
	
	topObserver = new IntersectionObserver(intersectionCallback);
	topObserver.observe($('#topSentinel').get(0));
}

// load new images and append to the end of the gallery
function tryLoadNextChunk() {

	var currentLoadSize = gallery.getDataLength();
	var nextImgsToLoadCnt = imagesToLoad.length - imgIdxOffset;
	
	if (gallery.lastLoaded() && scrolledToEnd && currentLoadSize < nextImgsToLoadCnt) {
		
		var nextLoadSize = currentLoadSize + chunkSize;
		if (nextLoadSize > nextImgsToLoadCnt) {
			nextLoadSize = nextImgsToLoadCnt;
		}
		gallery.pushAll(imagesToLoad.slice(currentLoadSize + imgIdxOffset, nextLoadSize));
		
		lastChunkLoaded = false;
	}
}

// load new images and stack on top of the gallery
function tryLoadPreviousChunk() {

	// TODO
	if (scrolledToTop)
		console.log("loading previous");
}

function updateImgCountDisplay() {
	$('#filteredImgNumberInfo').html(imagesToLoad.length + ' images to show.');
}
