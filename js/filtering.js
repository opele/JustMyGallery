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
				let imgTags = dataItemToFilter.tags;
				let customTags = getImgUserData(dataItemToFilter.image).customTags;
				if (customTags && customTags.length) {
					if (imgTags && imgTags.length) imgTags += ',' + customTags;
					else imgTags = customTags;
				}
				return imgTags.length && findIntersection(imgTags.split(","), currentFilterTags).length > 0;
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
}
