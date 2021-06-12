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
	return modal.style.display != "none";
}

function getCurrentlyViewedImg() {
	if (isViewingImage()) return imagesToLoad[currentImageIndex];
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null) return b == null || !b.length;
  if (b == null) return a == null || !a.length;
  
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
	
	if (currentImg != null && isLocalStorageAccepted()) {
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

function getCurrentImgUserData() {
	let currentImg = getCurrentlyViewedImg();
	
	if (currentImg != null) {
			return getImgUserData(currentImg.getAttribute("src"));
	} else 	return JSON.parse('{}');
}

function getImgUserData(src) {
	let item = null;
	if (src != null) {
		let existingData = localStorage.getItem(src);
		item = JSON.parse(existingData);
	}
	
	if (item == null) {
		item = JSON.parse('{}');
	}
	
	return item;
}


