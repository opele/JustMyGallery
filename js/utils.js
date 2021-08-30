function isBlank(str) {
	return (!str || /^\s*$/.test(str));
}

function isAlphanumeric(inputTxt) {
	return /^[a-z0-9]+$/.test(inputTxt);
}

function isNumber(value) {
  return typeof value === 'number' && isFinite(value);
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
	return modal.style.display == "block";
}

function isImgTopOutsideScreen() {

	if (isViewingImage()) {
		let imgTop = parseInt(modalImg[0].style.top, 10);
		let imgPanY = pan.y;
		
		return imgTop + imgPanY < 0;
	}
	
	return false;
}

function isImgBottomOutsideScreen() {
	
	if (isViewingImage()) {
		let screenHeight = document.documentElement.clientHeight;
		let imgHeight = parseInt(modalImg[0].style.height, 10);
		let imgTop = parseInt(modalImg[0].style.top, 10);
		let imgPanY = pan.y;
		
		return imgHeight + imgTop + imgPanY > screenHeight;
	}
	
	return false;
}

function isViewingBookmarks() {
	return bookmarksModalEl.style.display == "block";
}

function getCurrentlyViewedImgData() {
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

function activeElementHasClass(clsName) {
	return document.activeElement != null &&
	  document.activeElement.className != null && 
	  document.activeElement.className.includes(clsName);
}

function activeElementHasId(id) {
	return document.activeElement != null &&
	  document.activeElement.id == id;
}

function store(key, value) {
	if (isLocalStorageAccepted()) {
		localStorage.setItem(key, value);
	}
}

function storeCurrentImgUserData(rating, customTags) {
	let currentImgData = getCurrentlyViewedImgData();
	
	if (currentImgData != null && isLocalStorageAccepted()) {
		let key = currentImgData.image;
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
	let currentImgData = getCurrentlyViewedImgData();
	
	if (currentImgData != null) {
			return getImgUserData(currentImgData.image);
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


