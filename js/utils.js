function isBlank(str) {
	return (!str || /^\s*$/.test(str));
}

function isAlphanumeric(inputTxt) {
	return /^[a-z0-9]+$/.test(inputTxt);
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

function getCurrentlyViewedImg() {
	if (isViewingImage()) return Galleria.get(0).getActiveImage();
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
}

function storeCurrentImgUserData(rating, customTags) {
	let currentImg = getCurrentlyViewedImg();
	
	if (currentImg != null) {
		let key = currentImg.getAttribute("src");
		let existingData = localStorage.getItem(key);
		let item = JSON.parse(existingData);
		
		if (existingData == null || item == null) {
			item = JSON.parse('{}');
		}
		
		if (rating != null) {
			item.rating = rating;
		}
		
		if (customTags != null) {
			item.customTags = customTags;
		}
		
		localStorage.setItem(key, JSON.stringify(item));
	}
}