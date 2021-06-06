
var numberOfPreviewImagesLoaded = 0; // currently displayed and loaded images, resets when applying new filtering/sorting
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

var gallery;
var imagesToLoad;
var chunkSize = 15;
var scrolledToEnd = false;
var lastChunkLoaded = false;


$(function(){
	refreshSelectableTags();
	refreshSelectableCategories();
});

$(function() {
	
	initSidebar();
	
	loadImages();
	
	scrolledToEnd = false;
	lastChunkLoaded = false;
	addLazyLoadSentinel();
	
});


function loadImages() {

	numberOfPreviewImagesLoaded = 0;

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
	  spacing: 10
	});
	
	// navigate to top
	window.scrollTo(0, 0);
}

function updateImgCountDisplay() {
	$('#filteredImgNumberInfo').html(imagesToLoad.length + ' images to show.');
}

function addLazyLoadSentinel() {
	gallery.columnsContainer.append('<div id="sentinel"></div>');
	var sentinel = $('#sentinel');
	
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
	observer.observe(sentinel.get(0));
	
	gallery.bind("previewImgLoaded", function(e, imageData, imgEl) {
		++numberOfPreviewImagesLoaded;
		
		if (sentinel.css("top") < imageData.thumbnail.css("top"))
			sentinel.css({top: imageData.thumbnail.css("top"), left: imageData.thumbnail.css("left"), position:'absolute'});
		
		if (numberOfPreviewImagesLoaded == gallery.getDataLength() - 1) {
			lastChunkLoaded = true;
			tryLoadNextChunk();
		}
	});
}

function tryLoadNextChunk() {

	var currentLoadSize = gallery.getDataLength();
	
	if (lastChunkLoaded && scrolledToEnd && currentLoadSize < imagesToLoad.length) {
		
		var nextLoadSize = currentLoadSize + chunkSize;
		if (nextLoadSize > imagesToLoad.length) {
			nextLoadSize = imagesToLoad.length;
		}
		
		gallery.pushAll(imagesToLoad.slice(currentLoadSize, nextLoadSize));
		
		lastChunkLoaded = false;
	}
}
