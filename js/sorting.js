function sortImages(a, b) {
	
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
