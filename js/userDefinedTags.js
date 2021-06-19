

var myTagsPrefix = '&nbsp;&nbsp;&nbsp;&nbsp;My Tags:&nbsp;';
var myTagEmptyHtml = '<span class="my-tag" contenteditable=true>&nbsp;&nbsp;&nbsp;&nbsp</span>';

function displayTags(currentImgData) {

	var tagsEl = $(predefinedTagsEl);
	tagsEl.html("");
	
	if (currentImgData && currentImgData.tags) {
		// padding does not work because it inlines the tags with the previous div
		tagsEl.html("&nbsp;&nbsp;&nbsp;&nbsp;Tags: " + currentImgData.tags.replaceAll(',', ', '));
	}
	
	if (isLocalStorageAccepted()) {
		// option to add custom tags
		
		var myTagsEl = $(userDefinedTagsEl);
		
		myTagsEl.html(myTagsPrefix);
		let imgUserData = getCurrentImgUserData();
		
		if (imgUserData.customTags && imgUserData.customTags.length > 0) {
			imgUserData.customTags.split(',').forEach((tag) => {
				let newMyTag = appendNewCustomTag(myTagEmptyHtml);
				newMyTag.html(tag + ',&nbsp;');
			});
			
		}
		
		let emptyMyTag = appendNewCustomTag(myTagEmptyHtml);
	}
}

function myTagKeypress(event) {
	if (event.key == 'Enter') {
		event.preventDefault();
		confirmedMyTag(event);
	} else {
		return isAlphanumeric(event.key) || '-' == event.key || '_' == event.key;
	}
}

function confirmedMyTag(event) {
	let currentMyTagTxt = event.target.textContent.trim();
	if (!currentMyTagTxt.length || currentMyTagTxt.length == 0) {
		event.target.innerHtml = '&nbsp;&nbsp;&nbsp;&nbsp;';
	} else {
		event.target.innerHtml = currentMyTagTxt.replace(/&nbsp;|\s/g,'') + '&nbsp';
	}
	event.target.blur();
	addEmptyTagToEditIfRequired();
	persistCustomTags($(event.target.parentElement));
}

function persistCustomTags(myTagsEl) {
	if (myTagsEl != null) {
		let myTags = null;
		myTagsEl.children('.my-tag').each(function(i) {
			let txt = $(this).html();
			if (txt != null && txt.length) {
				if (myTags == null) myTags = txt;
				else myTags += txt;
			}
		});
		myTags = myTags.replace(/&nbsp;|\s/g,'');
		
		if (myTags.endsWith(',')) {
			myTags = myTags.slice(0,-1);
		}
		
		storeCurrentImgUserData(null, myTags);
		customTagsDirty = true;
	}
}

function addEmptyTagToEditIfRequired() {
	let lastMyTag = $(userDefinedTagsEl).find('.my-tag').last();
	let lastTagAbsent = lastMyTag == null || !lastMyTag.length;
	let emptyTagRequired = lastTagAbsent || lastMyTag.text().trim().length > 0;
	
	if (emptyTagRequired) {
		if (!lastTagAbsent && !lastMyTag.text().trim().endsWith(',')) {
			lastMyTag.html(lastMyTag.text().trim().replace(/&nbsp;|\s/g,'') + ',&nbsp;');
		}
		var newTagEl = appendNewCustomTag(myTagEmptyHtml);
		newTagEl.focus();
	}
}

function appendNewCustomTag(myTagEl) {
	let newTagEl = $(userDefinedTagsEl).append(myTagEl).find('.my-tag').last();
	newTagEl.keypress(myTagKeypress);
	newTagEl.keydown(myTagKeydown);
	newTagEl.blur(confirmedMyTag);
	return newTagEl
}

function myTagKeydown(event) {
	if (event.key == 'Backspace') {
		if (window.getSelection) {
			var text = window.getSelection().toString();
			
			if (text.length > 0 && text.trim().length > 0 && text.trim() == event.target.textContent.trim().replace(',','')) {
				event.preventDefault();
				let parentEl = event.target.parentElement;
				$(event.target).remove();
				persistCustomTags($(parentEl));
			}
		}
	} else if (event.key == 'ArrowRight' || event.key == 'ArrowLeft') {
		event.stopPropagation();
	}
}

function isEditingTags() {
	return document.activeElement != null &&
	  document.activeElement.className != null && 
	  document.activeElement.className.includes('my-tag');
}
