

function openSettingsSidebar() {
  $('.sidebar-open-button').hide();
  $('#searchAndFilterSidebar').hide();
  $('#settingsSidebar').show();
  document.getElementById("sidebar-container").style.left = "0px";
}

function initSettingsSidebar() {
	
	if (isLocalStorageAccepted()) {
		loadSettingsFromStorage();
	}
	
	refreshSettingsUi();
}

$(function() {
	
	$('#scaleUpImgWidthButton').on('click', function(e) {
	  toggleScaleUpImageWidth();
	});
	$('#scaleUpImgWidthButton').on('keydown', function(e) {
	  if (event.key == 'Enter') {
		event.preventDefault();
		toggleScaleUpImageWidth();
	  }
	});
	$('#scaleUpImgWidthSwitch').on('click', function(e) {
		return false;
	});
	
	$('#scaleDownImgWidthButton').on('click', function(e) {
	  toggleScaleDownImageWidth();
	});
	$('#scaleDownImgWidthButton').on('keydown', function(e) {
	  if (event.key == 'Enter') {
		event.preventDefault();
		toggleScaleDownImageWidth();
	  }
	});
	$('#scaleDownImgWidthSwitch').on('click', function(e) {
		return false;
	});
	
	$('#scaleUpImgHeightButton').on('click', function(e) {
	  toggleScaleUpImageHeight();
	});
	$('#scaleUpImgHeightButton').on('keydown', function(e) {
	  if (event.key == 'Enter') {
		event.preventDefault();
		toggleScaleUpImageHeight();
	  }
	});
	$('#scaleUpImgHeightSwitch').on('click', function(e) {
		return false;
	});
	
	$('#scaleDownImgHeightButton').on('click', function(e) {
	  toggleScaleDownImageHeight();
	});
	$('#scaleDownImgHeightButton').on('keydown', function(e) {
	  if (event.key == 'Enter') {
		event.preventDefault();
		toggleScaleDownImageHeight();
	  }
	});
	$('#scaleDownImgHeightSwitch').on('click', function(e) {
		return false;
	});
});

function updateOptimalWidthRatio() {
	let inputVal = Number(document.getElementById("imgWindowWidthRatio").value);
	if (!isNumber(inputVal)) {
		console.log('Error: Invalid input for imgWindowWidthRatio: ' + inputVal);
		document.getElementById("imgWindowWidthRatio").value = 0.75;
		inputVal = 0.75;
	}
	
	optimalWidthRatio = inputVal;
	refreshSettingsUi();
	persistSettings();
}

function updateOptimalHeightRatio() {
	let inputVal = Number(document.getElementById("imgWindowHeightRatio").value);
	if (!isNumber(inputVal)) {
		console.log('Error: Invalid input for imgWindowHeightRatio: ' + inputVal);
		document.getElementById("imgWindowHeightRatio").value = 0.95;
		inputVal = 0.95;
	}
	
	optimalHeightRatio = inputVal;
	refreshSettingsUi();
	persistSettings();
}

function toggleScaleUpImageWidth() {
	scaleUpImageWidth = !scaleUpImageWidth;
	refreshSettingsUi();
	persistSettings();
}

function toggleScaleDownImageWidth() {
	scaleDownImageWidth = !scaleDownImageWidth;
	refreshSettingsUi();
	persistSettings();
}

function toggleScaleUpImageHeight() {
	scaleUpImageHeight = !scaleUpImageHeight;
	refreshSettingsUi();
	persistSettings();
}

function toggleScaleDownImageHeight() {
	scaleDownImageHeight = !scaleDownImageHeight;
	refreshSettingsUi();
	persistSettings();
}

function refreshSettingsUi() {
	document.getElementById("imgWindowWidthRatio").value = optimalWidthRatio;
	$('#scaleUpImgWidthSwitch').prop('checked', scaleUpImageWidth);
	$('#scaleDownImgWidthSwitch').prop('checked', scaleDownImageWidth);
	
	document.getElementById("imgWindowHeightRatio").value = optimalHeightRatio;
	$('#scaleUpImgHeightSwitch').prop('checked', scaleUpImageHeight);
	$('#scaleDownImgHeightSwitch').prop('checked', scaleDownImageHeight);
}

function persistSettings() {
	store('optimalWidthRatio', optimalWidthRatio);
	store('scaleUpImageWidth', scaleUpImageWidth);
	store('scaleDownImageWidth', scaleDownImageWidth);
	
	store('optimalHeightRatio', optimalHeightRatio);
	store('scaleUpImageHeight', scaleUpImageHeight);
	store('scaleDownImageHeight', scaleDownImageHeight);
}

function loadSettingsFromStorage() {
	let storedNumber = Number(localStorage.getItem('optimalWidthRatio'));
	if(isNumber(storedNumber)) {
		optimalWidthRatio = storedNumber;
	}
	scaleUpImageWidth = localStorage.getItem('scaleUpImageWidth') == 'true';
	scaleDownImageWidth = localStorage.getItem('scaleDownImageWidth') == 'true';
	
	storedNumber = Number(localStorage.getItem('optimalHeightRatio'));
	if(isNumber(storedNumber)) {
		optimalHeightRatio = storedNumber;
	}
	scaleUpImageHeight = localStorage.getItem('scaleUpImageHeight') == 'true';
	scaleDownImageHeight = localStorage.getItem('scaleDownImageHeight') == 'true';
}

