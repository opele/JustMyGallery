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

function displayTags(imageTarget) {

	var tagsEl = $('.galleria-info').find('#predefinedTags');
	if (tagsEl.length === 0)
		tagsEl = $('.galleria-info').append(tagsHtml).find('#predefinedTags');
	else 
		tagsEl.html("");
	
	var galleriaRef = Galleria.get(0);
	var currentImgData = galleriaRef.getData(galleriaRef.getIndex());
	if (currentImgData && currentImgData.tags) {
		// padding does not work because it inlines the tags with the previous div
		tagsEl.html("&nbsp;&nbsp;&nbsp;&nbsp;Tags: " + currentImgData.tags.replaceAll(',', ', '));
	}
	
	
	if (isLocalStorageAccepted()) {
		// option to add custom tags
		
		var myTagsEl = $('.galleria-info').find('#myTags');
		if (myTagsEl.length === 0)
			myTagsEl = $('.galleria-info').append(myTagsHtml).find('#myTags');
		
		myTagsEl.html(myTagsPrefix);
		
		var emptyMyTag = myTagsEl.append(myTagEmptyHtml).find('.my-tag').last();
		emptyMyTag.keypress(myTagKeypress);
		emptyMyTag.keydown(myTagKeydown);
		
		//var item = JSON.parse(localStorage.getItem(imageTarget.getAttribute("src")));
		//refreshRating(myTagsEl, item == null ? null : item.rating);
	}
}

function myTagKeypress(event) {
	if (event.key == 'Enter') {
		event.preventDefault();
		
		let currentMyTagTxt = event.target.textContent.trim();
		if (!currentMyTagTxt.length || currentMyTagTxt.length == 0) {
			event.target.innerHtml = '&nbsp;&nbsp;&nbsp;&nbsp;';
		} else {
			event.target.innerHtml = currentMyTagTxt + '&nbsp';
		}
		event.target.blur();
		addEmptyTagToEditIfRequired();
		
	}
}

function addEmptyTagToEditIfRequired() {
	let lastMyTag = $('#myTags').find('.my-tag').last();
	let lastTagAbsent = lastMyTag == null || !lastMyTag.length;
	let emptyTagRequired = lastTagAbsent || lastMyTag.text().trim().length > 0;
	
	if (emptyTagRequired) {
		if (!lastTagAbsent && !lastMyTag.text().trim().endsWith(',')) {
			lastMyTag.html(lastMyTag.text().trim() + ',&nbsp;');
		}
		var newTagEl = $('#myTags').append(myTagEmptyHtml).find('.my-tag').last();
		newTagEl.keypress(myTagKeypress);
		newTagEl.keydown(myTagKeydown);
		newTagEl.focus();
	}
}

function myTagKeydown(event) {
	if (event.key == 'Backspace') {
		if (window.getSelection) {
			var text = window.getSelection().toString();
			
			if (text.length > 0 && text.trim().length > 0 && text.trim() == event.target.textContent.trim().replace(',','')) {
				event.preventDefault();
				$(event.target).remove();
			}
		}
	} else if (event.key == 'ArrowRight' || event.key == 'ArrowLeft') {
		return false;
	}
}

var tagsHtml = '<div id="predefinedTags" class="predefined-tags"></div>';
var myTagsHtml = '<div id="myTags" class="my-tags"></div>';
var myTagsPrefix = '&nbsp;&nbsp;&nbsp;&nbsp;My Tags: ';
var myTagEmptyHtml = '<span class="my-tag" contenteditable=true>&nbsp;&nbsp;&nbsp;&nbsp</span>';


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
}
