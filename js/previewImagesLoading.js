// debug
var numberOfPreviewImagesLoaded = 0; // currently displayed, resets when applying new filtering/sorting
var numberOfFullSizeImagesLoaded = 0; // loaded in this session without page refresh

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

$(function(){
	refreshSelectableTags();
	refreshSelectableCategories();
});

$(function() {

	Galleria.loadTheme('lib/folio/galleria.folio.min.js');
	
	// causes cors error with local files in FF, first param must be an URL, https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSRequestNotHttp
	//$.getJSON('imageData.json', function( data ) {
	//	Galleria.run('.galleria', {
	//	dataSource: data});
	
	initSidebar();
	
	loadImages();
	
});


var imagesToLoad;
var scrolledToEnd = false;
var lastChunkLoaded = false;
function loadImages() {

	numberOfPreviewImagesLoaded = 0;

	imagesToLoad = imgData;
	if (typeof filterFunction === 'function') {
		imagesToLoad = filterFunction(imagesToLoad);
	}
	
	$('#filteredImgNumberInfo').html(imagesToLoad.length + ' images to show.');
	
	imagesToLoad.sort(sortImages);

	Galleria.run('.galleria', {
		dataSource: imagesToLoad.slice(0,30),
		transition: 'pulse',
		thumbCrop: 'width',
		imageCrop: false,
		carousel: false,
		show: false,
		easing: 'galleriaOut',
		fullscreenDoubleTap: false,
		// Shows navigation as cursor for webkit
		_webkitCursor: true,
		// Animates the thumbnails: when a new image is pushed they fly into place
		// unfortunately bugged: the images keep loading for around 5sec even though they are actually loaded (even on local)
		_animate: false,
		// Centers the thumbnails inside it’s container
		_center: true
	});
	
	// navigate to top
	window.scrollTo(0, 0);
}


Galleria.ready(function(options) {
	scrolledToEnd = false;
	lastChunkLoaded = false;
	updateLazyLoadSentinel();
});

function updateLazyLoadSentinel() {
	var galleriaRef = Galleria.get(0);
	var thumbsContainer = $('.galleria-thumbnails');
	thumbsContainer.append('<div id="sentinel"></div>');
	var sentinel = $('#sentinel').get(0);
	
	var callback = (entries, observer) => {
	  entries.forEach(entry => {
		  if (entry.isIntersecting) {
			scrolledToEnd = true;
			tryLoadNextChunk();
		  } else {
			scrolledToEnd = false;
		  }
	  });
	};
	
	var observer = new IntersectionObserver(callback);
	observer.observe(sentinel);
	
	galleriaRef.bind("thumbnail", function(e) {
		++numberOfPreviewImagesLoaded;
		thumbsContainer.get(0).appendChild(sentinel);
		if (e.index == galleriaRef.getDataLength() - 1) {
			lastChunkLoaded = true;
			tryLoadNextChunk();
		}
	});
}

function tryLoadNextChunk() {

	var gallery = Galleria.get(0);
	var chunkSize = 15;
	var currentLoadSize = gallery.getDataLength();
	
	if (lastChunkLoaded && scrolledToEnd && currentLoadSize < imagesToLoad.length) {
		
		var nextLoadSize = currentLoadSize + chunkSize;
		if (nextLoadSize > imagesToLoad.length) {
			nextLoadSize = imagesToLoad.length;
		}
		
		gallery.push(imagesToLoad.slice(currentLoadSize, nextLoadSize));
		
		lastChunkLoaded = false;
	}
}