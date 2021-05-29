function displayRating(imageTarget) {

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

	storeCurrentImgUserData(rating, null);
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
 }