function isBlank(str) {
	return (!str || /^\s*$/.test(str));
}

function capitalise(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function findIntersection(arr1, arr2) {
	return arr1.filter(function(n) {
		  return arr2.indexOf(n) > -1;
		});
}

function isViewingImage() {
	return Galleria.get(0).getActiveImage() != null && $(Galleria.get(0).getActiveImage()).is(':visible');
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (var i = 0; i < a.length; ++i) {
	if (a[i] !== b[i]) return false;
  }
  return true;
}

function store(key, value) {
	if (isLocalStorageAccepted()) {
		localStorage.setItem(key, value);
	}
}// debug
var numberOfPreviewImagesLoaded = 0; // currently displayed, resets when applying new filtering/sorting
var numberOfFullSizeImagesLoaded = 0; // loaded in this session without page refresh

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
}// window keyboard event listener
 $(function() {
		 
		 // use keydown instead of keypress which also catches non-printing keys such as Shift, Esc...
		$(window).keydown(function( event ) {
		
				if (isViewingImage()) { // single image mode
					// enable rating with number keys 1 to 5
					processKeyEvtForRating(event);
					
				} else { // displaying gallery with preview images
				
					if (event.key == 'Escape') {
						closeSidebar();
					
					} else if (event.key == '1') {
						openSidebar();
					}
				}
		});
 });function sortImages(a, b) {
	
	var ratingSortResult = 0;
	if (sortByRating) {
		ratingSortResult = sortImagesByRating(a, b);
	}
	
	if (ratingSortResult == 0) {
	
		if (sortByDateAsc) {
			if(a.timestamp && b.timestamp) return a.timestamp - b.timestamp;
			
		} else if (sortByDateDesc) {
			if(a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
			
		} else if (sortByName) {
			if(a.title && b.title) {
				var x = a.title.toLowerCase();
				var y = b.title.toLowerCase();
				if (x < y) return -1;
				if (x > y) return 1;
			}
		}
	}
	
	return ratingSortResult;
}

function sortImagesByRating(a, b) {
	var localItemObjA = JSON.parse(localStorage.getItem(a.image));
	var aHasRating = localItemObjA && localItemObjA.rating;
	
	var localItemObjB = JSON.parse(localStorage.getItem(b.image));
	var bHasRating = localItemObjB && localItemObjB.rating;
	
	if (!aHasRating && !bHasRating) return 0;
	if (!aHasRating && bHasRating) return 1;
	if (aHasRating && !bHasRating) return -1;
	if (localItemObjA.rating > localItemObjB.rating) return -1;
	if (localItemObjA.rating < localItemObjB.rating) return 1;
	return 0;
}

$(function() {
	// when the list item is highlighted toggle the switch regardless if the checkbox was actually clicked
	$('#sortByDateAscButton').on('click', function(e) {
	  toggleSortByDateAsc();
	});
	// when the checkbox is focused on, enter key toggles it
	$('#sortByDateAscButton').on('keydown', function(e) {
	  if (event.key == 'Enter') {
		event.preventDefault();
		toggleSortByDateAsc();
	  }
	});
	// ignore clicks directly on the checkbox, which also trigger the parent
	$('#sortByDateAscSwitch').on('click', function(e) {
		return false;
	});
	
	$('#sortByDateDescButton').on('click', function(e) {
	  toggleSortByDateDesc();
	});
	$('#sortByDateDescButton').on('keydown', function(e) {
	  if (event.key == 'Enter') {
		event.preventDefault();
		toggleSortByDateDesc();
	  }
	});
	$('#sortByDateDescSwitch').on('click', function(e) {
		return false;
	});
	
	$('#sortByNameButton').on('click', function(e) {
	  toggleSortByName();
	});
	$('#sortByNameButton').on('keydown', function(e) {
	  if (event.key == 'Enter') {
		event.preventDefault();
		toggleSortByName();
	  }
	});
	$('#sortByNameSwitch').on('click', function(e) {
		return false;
	});
	
	$('#sortByRatingButton').on('click', function(e) {
	  toggleSortByRating();
	});
	$('#sortByRatingButton').on('keydown', function(e) {
	  if (event.key == 'Enter') {
		event.preventDefault();
		toggleSortByRating();
	  }
	});
	$('#sortByRatingSwitch').on('click', function(e) {
		return false;
	});
});

function toggleSortByDateAsc() {
	sortByDateAsc = !sortByDateAsc;
	sortByDateDesc = false;
	sortByName = false;
	refreshSortingUi();
	persistSorting();
	loadImages();
}

function toggleSortByDateDesc() {
	sortByDateDesc = !sortByDateDesc;
	sortByDateAsc = false;
	sortByName = false;
	refreshSortingUi();
	persistSorting();
	loadImages();
}

function toggleSortByName() {
	sortByName = !sortByName;
	sortByDateDesc = false;
	sortByDateAsc = false;
	refreshSortingUi();
	persistSorting();
	loadImages();
}

function toggleSortByRating() {
	sortByRating = !sortByRating;
	$('#sortByRatingSwitch').prop('checked', sortByRating);
	persistSorting();
	loadImages();
}

function refreshSortingUi() {
	$('#sortByDateAscSwitch').prop('checked', sortByDateAsc);
	$('#sortByDateDescSwitch').prop('checked', sortByDateDesc);
	$('#sortByNameSwitch').prop('checked', sortByName);
	$('#sortByRatingSwitch').prop('checked', sortByRating);
}

function persistSorting() {
	store('sortByRating', sortByRating);
	store('sortByDateAsc', sortByDateAsc);
	store('sortByDateDesc', sortByDateDesc);
	store('sortByName', sortByName);
}
// image title filter
(function() {
		$('#inputNameFilter').keypress(function(event) {
			
			if (event.key == 'Enter') { // return key
				event.preventDefault();
				filterByName();
				$('[data-toggle="tooltip"]').tooltip('hide');
			}
		});
}());

function filterByName() {
	
	var filter = $("#inputNameFilter").val();
	
	filterByNameEnabled = !isBlank(filter);
	applyFilterByName(filter);
	
	store('filterByNameEnabled', filterByNameEnabled);
	store('currentFilterByName', filter);

	loadImages();
}

function applyFilterByName(filter) {
	
	if (filterByNameEnabled) {
		nameFilterFunc = function(dataItemToFilter) {
				return dataItemToFilter.title && dataItemToFilter.title.toLowerCase().includes(filter.toLowerCase());
			}
	} else {
		nameFilterFunc = function(dataItemToFilter) {return true;};
	}
	
	displayAsActive(filterByNameEnabled, $('#nameFilterContainer').get(0));
}

// date filter
function filterByDateRange() {
	
	// the number of milliseconds from midnight UTC the morning of 1970-01-01 to the time represented by the Date object
	filterFrom = document.getElementById("inputDateFromFilter").valueAsNumber;
	filterTo = document.getElementById("inputDateToFilter").valueAsNumber;
	
	// check if dates changed
	if ( (filterFrom !== currentFromFilterDate && !(isNaN(filterFrom) && isNaN(currentFromFilterDate))) || 
		 (filterTo !== currentToFilterDate && !(isNaN(filterTo) && isNaN(currentToFilterDate)))) {
		currentFromFilterDate = filterFrom;
		currentToFilterDate = filterTo;
	} else {
		return;
	}
	
	filterByDateEnabled = !((isBlank(filterFrom) || isNaN(filterFrom)) && (isBlank(filterTo) || isNaN(filterTo)));
	
	applyFilterByDateRange();
	
	store('filterByDateEnabled', filterByDateEnabled);
	store('currentFromFilterDate', currentFromFilterDate);
	store('currentToFilterDate', currentToFilterDate);
	
	loadImages();
}

function applyFilterByDateRange() {
	
	var filterFrom = currentFromFilterDate;
	var filterTo = currentToFilterDate;
	
	if (filterByDateEnabled) {
		if (isBlank(filterFrom) || isNaN(filterFrom)) {
			filterFrom = -1;
		}
		
		if (isBlank(filterTo) || isNaN(filterTo)) {
			filterTo = Number.MAX_VALUE;
		}
	
		dateRangeFilterFunc = function(dataItemToFilter) {
				return dataItemToFilter.timestamp && dataItemToFilter.timestamp >= filterFrom && dataItemToFilter.timestamp <= filterTo;
			}
		
	} else { 
		dateRangeFilterFunc = function(dataItemToFilter) {return true;};
	}
	
	displayAsActive(filterByDateEnabled, $('#dateFilterContainer').get(0));
}

function filterFromDateChanged() {
	var filterFrom = document.getElementById("inputDateFromFilter").valueAsNumber;
	if (isBlank(filterFrom) || isNaN(filterFrom)) filterByDateRange(); // onblur does not fire in FF when clearing the date
}

function filterToDateChanged() {
	var filterTo = document.getElementById("inputDateToFilter").valueAsNumber;
	if (isBlank(filterTo) || isNaN(filterTo)) filterByDateRange(); // onblur does not fire in FF when clearing the date
}


// tags filter
function filterByTags() {

	var filterTags = $('#tagsFilter').val();
	
	if (arraysEqual(filterTags, currentFilterTags)) return;
	
	currentFilterTags = filterTags;
	filterByTagsEnabled = filterTags && filterTags.length > 0;
	
	applyFilterByTags();
	
	store('filterByTagsEnabled', filterByTagsEnabled);
	store('currentFilterTags', currentFilterTags);
	
	loadImages();
}

function applyFilterByTags() {
	
	if (filterByTagsEnabled) {
		tagsFilterFunc = function(dataItemToFilter) {
				return dataItemToFilter.tags && findIntersection(dataItemToFilter.tags.split(","), currentFilterTags).length > 0;
			}
	} else {
		tagsFilterFunc = function(dataItemToFilter) {return true;};
	}
	
	displayAsActive(filterByTagsEnabled, $('#tagsFilterContainer').get(0));
}

// category filter
$(function() {
		// this event triggers when clearing the selected value on a single select dropdown
		// TODO: this will not work with multiple clearable dropdowns
		$('.bs-select-clear-selected').click(function() {
			
			currentFilterCategory = null;
			filterByCategoryEnabled = false;
			categoryFilterFunc = function(dataItemToFilter) {return true;};
			
			displayAsActive(filterByCategoryEnabled, $('#categoryFilterContainer').get(0));
			
			store('filterByCategoryEnabled', filterByCategoryEnabled);
			store('currentFilterCategory', currentFilterCategory);
			
			loadImages();
		});
});

function filterByCategory() {

	var filterCategory = $('#categoryFilter').val();
	
	if (filterCategory === currentFilterCategory) return;
	currentFilterCategory = filterCategory;
	filterByCategoryEnabled = !isBlank(filterCategory);
	
	applyFilterByCategory();
	
	store('filterByCategoryEnabled', filterByCategoryEnabled);
	store('currentFilterCategory', currentFilterCategory);
	
	loadImages();
}

function applyFilterByCategory() {
	
	if (filterByCategoryEnabled) {
		categoryFilterFunc = function(dataItemToFilter) {
				return dataItemToFilter.categories && dataItemToFilter.categories.split(",").includes(currentFilterCategory);
			}
	} else {
		categoryFilterFunc = function(dataItemToFilter) {return true;};
	}
	
	displayAsActive(filterByCategoryEnabled, $('#categoryFilterContainer').get(0));
}

// combine tags and category filter
function toggleTagsAndCategoryFilter() {

	categoriesAndTags = !categoriesAndTags;
	
	applyTagsAndCategoryFilter();
	
	store('categoriesAndTags', categoriesAndTags);
	
	if (filterByCategoryEnabled && filterByTagsEnabled) {
		loadImages();
	}
}

function applyTagsAndCategoryFilter() {
	
	if (categoriesAndTags) {
		$('#toggleTagsAndCategoryFilterBtn').html("Tags AND Category");
	} else {
		$('#toggleTagsAndCategoryFilterBtn').html("Tags OR Category");
	}
}function openSidebar() {
  $('#sidebarOpenBtn').hide();
  document.getElementById("sidebar-container").style.left = "0px";
}

function closeSidebar() {
  document.getElementById("sidebar-container").style.left = "-250px";
  $('#sidebarOpenBtn').show(500);
}

$(function() {
		
	$('#closeSidebarBtn').keydown(function(event) {
			if (event.key == 'Enter') closeSidebar();
		});
	
});

function displayAsActive(isActive, element) {
	if (isActive) {
		element.classList.remove("bg-dark");
		element.classList.add("active");
	} else {
		element.classList.remove("active");
		element.classList.add("bg-dark");
	}
}

function initSidebar() {
	
	var currentFilterByName = null;
	
	if (isLocalStorageAccepted()) {
		// sorting
		sortByRating = localStorage.getItem('sortByRating') == 'true';
		sortByDateAsc = localStorage.getItem('sortByDateAsc') == 'true';
		sortByDateDesc = localStorage.getItem('sortByDateDesc') == 'true';
		sortByName = localStorage.getItem('sortByName') == 'true';
	
		// filters
		filterByNameEnabled = localStorage.getItem('filterByNameEnabled') == 'true';
		currentFilterByName = localStorage.getItem('currentFilterByName');
		filterByDateEnabled = localStorage.getItem('filterByDateEnabled') == 'true';
		currentFromFilterDate = parseInt(localStorage.getItem('currentFromFilterDate'));
		currentToFilterDate = parseInt(localStorage.getItem('currentToFilterDate'));
		filterByTagsEnabled = localStorage.getItem('filterByTagsEnabled') == 'true';
		currentFilterTags = localStorage.getItem('currentFilterTags');
		filterByCategoryEnabled = localStorage.getItem('filterByCategoryEnabled') == 'true';
		currentFilterCategory = localStorage.getItem('currentFilterCategory');
		categoriesAndTags = localStorage.getItem('categoriesAndTags') == 'true';
	}
	
	refreshSortingUi();
	
	$('#inputNameFilter').val(currentFilterByName);
	applyFilterByName(currentFilterByName);
	
	document.getElementById("inputDateFromFilter").valueAsNumber = currentFromFilterDate;
	document.getElementById("inputDateToFilter").valueAsNumber = currentToFilterDate;
	applyFilterByDateRange();
	
	if (currentFilterTags != null && currentFilterTags.length > 0) {
		$('#tagsFilter').selectpicker('val', currentFilterTags.split(","));
	}
	applyFilterByTags();
	
	if (!isBlank(currentFilterCategory)) {
		$('#categoryFilter').selectpicker('val', currentFilterCategory);
	}
	applyFilterByCategory();
	
	applyTagsAndCategoryFilter();
}

// toggle z-index on show and hide dropdown events, so the select options do not display behind other controls
$(function() {
		$('#tagsFilter').on('show.bs.select', function (e) {
			toggleDisplaySidebarElementInForeground($('#tagsFilterContainer'), true);
		});

		$('#tagsFilter').on('hide.bs.select', function (e) {
			toggleDisplaySidebarElementInForeground($('#tagsFilterContainer'), false);
			filterByTags();
		});
		
		// close the select menue when pressing left key
		// enter key (de)selects the focused element
		$('#tagsFilter + button.btn.dropdown-toggle').keydown(function( event ) {
			var selectWidget = $('#tagsFilter');
			if (selectWidget.parent().hasClass('show')) {
				if (event.key == 'ArrowLeft')
					selectWidget.selectpicker('toggle');
			} else {
				if (event.key == 'Backspace') {
					selectWidget.selectpicker('deselectAll');
					filterByTags();
				}
			}
		});
		
});

// toggle z-index on show and hide dropdown events, so the select options do not display behind other controls
$(function() {
		$('#categoryFilter').on('show.bs.select', function (e) {
			toggleDisplaySidebarElementInForeground($('#categoryFilterContainer'), true);
		});

		$('#categoryFilter').on('hide.bs.select', function (e) {
			toggleDisplaySidebarElementInForeground($('#categoryFilterContainer'), false);
			filterByCategory();
		});
		
		// close the select menue when pressing left key
		$('#categoryFilter + button.btn.dropdown-toggle').keydown(function( event ) {
			var selectWidget = $('#categoryFilter');
			if (selectWidget.parent().hasClass('show')) {
				if (event.key == 'ArrowLeft')
					selectWidget.selectpicker('toggle');
			} else {
				if (event.key == 'Backspace' && selectWidget.val().length > 0) {
					$('.bs-select-clear-selected').click();
				}
			}
		});
});

function toggleDisplaySidebarElementInForeground(element, showInForeground) {
	$('#sidebar-container > ul > div').each(function(index) {
		if (showInForeground) {
			if (!element.is($(this))) {
				$(this).css('z-index', 0);
			}
		} else {
			$(this).css('z-index', 2)
		}
	});
}

 // initialising selections
 // tags
 function refreshSelectableTags() {
	var allTagsSet = new Set();
	imgData.forEach(function(imgDataItem) {
		if (imgDataItem.tags) {
			imgDataItem.tags.split(',').forEach(t => allTagsSet.add(t));
		}
	});
	
	$('#tagsFilter').empty();
	allTagsSet.forEach(function(tag) {
		$('#tagsFilter').append('<option value="' + tag + '">' + tag + '</option>');
	});
	
	$('#tagsFilter').selectpicker('refresh');
 }
 
 
 // categories
 function refreshSelectableCategories() {
	var allCategoriesSet = new Set();
	imgData.forEach(function(imgDataItem) {
		if (imgDataItem.categories) {
			imgDataItem.categories.split(',').forEach(t => allCategoriesSet.add(t));
		}
	});
	
	$('#categoryFilter').empty();
	allCategoriesSet.forEach(function(category) {
		$('#categoryFilter').append('<option value="' + category + '">' + capitalise(category) + '</option>');
	});
	
	$('#categoryFilter').selectpicker('refresh');
 }function displayRating(imageTarget) {

	var rateEl = $('.galleria-info').find('#rating');
	if (rateEl.length === 0)
		rateEl = $('.galleria-info').append(ratingHtml).find('#rating');
	
	// disable arrowkey navigation to the next input which changes the selection of the next image when the rating input box is focused
	rateEl.on("keydown keyup keyleft keyright", "input", function(event) { 
			event.preventDefault();
	});
	
	var item = JSON.parse(localStorage.getItem(imageTarget.getAttribute("src")));
	
	refreshRating(rateEl, item == null ? null : item.rating);
}

function rateImage(event, rating) {

	if (!isLocalStorageAccepted()) {
		alert("Unable to remember new rating without permission to use local browser storage.");
		return;
	}

	var galleriaRef = Galleria.get(0);
	var currentImgData = galleriaRef.getData(galleriaRef.getIndex());
	if (currentImgData) {
		localStorage.setItem(currentImgData.image, '{"rating":' + rating + "}");
	}
	
	refreshRating($(event.target.parentElement), rating);
}

function refreshRating(rateEl, rating) {
	rateEl.children('span').each(function(index) {
		var isChecked = rating && index < rating;
		$(this).get(0).className = isChecked ? 'fa fa-star checked' : 'fa fa-star unchecked';
	});
}

var ratingHtml = 
	'<div id="rating" class="rate">'
		+ '<span class = "fa fa-star unchecked" onclick=\'rateImage(event, 1)\'></span>'
		+ '<span class = "fa fa-star unchecked" onclick=\'rateImage(event, 2)\'></span>'
		+ '<span class = "fa fa-star unchecked" onclick=\'rateImage(event, 3)\'></span>'
		+ '<span class = "fa fa-star unchecked" onclick=\'rateImage(event, 4)\'></span>'
		+ '<span class = "fa fa-star unchecked" onclick=\'rateImage(event, 5)\'></span>'
	+ '</div>';
 
 
 function processKeyEvtForRating(event) {
	
	var rateEl = $('.galleria-info').find('#rating');
	
	// enable rating with number keys
	// 1 to 5, works with both: numpad or number keys under F-keys
	if (event.key == '1') {
		rateEl.children('span').get(0).click();
	} else if (event.key == '2') {
		rateEl.children('span').get(1).click();
	} else if (event.key == '3') {
		rateEl.children('span').get(2).click();
	} else if (event.key == '4') {
		rateEl.children('span').get(3).click();
	} else if (event.key == '5') {
		rateEl.children('span').get(4).click();
	}
 }/* SHOW IMAGE IN ORIGINAL SIZE */

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