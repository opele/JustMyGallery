function displayRating(imageSrc) {

	var rateEl = $(ratingEl);
	
	// disable arrowkey navigation to the next input which changes the selection of the next image when the rating input box is focused
	rateEl.on("keydown keyup keyleft keyright", "input", function(event) { 
			event.preventDefault();
	});
	
	var item = JSON.parse(localStorage.getItem(imageSrc));
	
	refreshRating(rateEl, item == null ? null : item.rating);
}

function rateImage(event, rating) {
	
	if (event) event.stopPropagation();

	if (!isLocalStorageAccepted()) {
		alert("Unable to remember new rating without permission to use local browser storage.");
		return;
	}

	storeCurrentImgUserData(rating, null);
	refreshRating($(event.target.parentElement), rating);
}

function refreshRating(rateEl, rating) {
	rateEl.children('span').each(function(index) {
		var isChecked = rating && index < rating;
		$(this).get(0).className = isChecked ? 'fa fa-star checked' : 'fa fa-star unchecked';
	});
}
 
 
 function processKeyEvtForRating(event) {
	
	var rateEl = $(ratingEl);
	
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
 }
