
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

var gallery;
var imagesToLoad;
var chunkSize = 15;
var scrolledToEnd = false;

// detail image view
var currentImageIndex = 0; // index of the currently or last opened image
var modal;
var modalImg;
var next;
var previous;
var captionText;


$(function(){
	refreshSelectableTags();
	refreshSelectableCategories();
});

$(function() {

	modal = document.getElementById("myModal");
	modalImg = document.getElementById("modalImg");
	captionText = document.getElementById("caption");
	
	initSidebar();
	
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
	  images: imagesToLoad.slice(0,30),
	  columnWidth: 230,
	  spacing: 10,
	  imageOnLoadCallback: updateLazyLoadSentinel
	});
	
	// navigate to top
	window.scrollTo(0, 0);
}

// Add or update LazyLoadSentinel when an image loads. Passed into Gallery constructor.
// This event may only fire for one image if the whole chunk is loaded from cache. 
// imageData then points to a random image and can have top = 0 but gallery.loadedImages is incremented by the chunk size (all images loaded = true).
// Therefore, can't use imageData to position the sentinel. Retrieve the last loaded image after which the sentinel should be positioned.
function updateLazyLoadSentinel(e, imageData, imgEl) {
		
	// TODO: when image fails loading, we never get past this
	if (!gallery.allImgsLoaded()) return;
	
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

function tryLoadNextChunk() {

	var currentLoadSize = gallery.getDataLength();
	
	if (gallery.lastLoaded() && scrolledToEnd && currentLoadSize < imagesToLoad.length) {
		
		var nextLoadSize = currentLoadSize + chunkSize;
		if (nextLoadSize > imagesToLoad.length) {
			nextLoadSize = imagesToLoad.length;
		}
		gallery.pushAll(imagesToLoad.slice(currentLoadSize, nextLoadSize));
		
		lastChunkLoaded = false;
	}
}

function updateImgCountDisplay() {
	$('#filteredImgNumberInfo').html(imagesToLoad.length + ' images to show.');
}
