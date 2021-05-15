function openSidebar() {
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
 }