
function openBookmarksModal() {
	$('body').css('overflow', 'hidden');
	loadBookmarksView();
	$(bookmarksModalEl).show();
}

function closeBookmarksModal() {
	$('body').css('overflow', 'auto');
	$(bookmarksModalEl).hide();
}

function loadBookmarksView() {
	let columns = Array.from(bookmarksListEl.childNodes).filter(cn => cn.className == 'bookmarks-column');
	let bookmarksArr = getBookmarks();
	
	columns.forEach(c => c.innerHTML = "");
	
	// display the bookmarks in the popup modal for user selection
	let filteredOutBookmarks = [];
	let insertCount = 0;
	bookmarksArr.forEach((bm) => {
		
		let bmIdx = imagesToLoad.findIndex(i => i.image == bm);
		
		if (bmIdx >= 0) {
			// the bookmarked image currently passes filter criteria
			$(columns[insertCount++ % columns.length]).append('<img src="' + imagesToLoad[bmIdx].thumb + '" style="width:100%" onclick="loadBookmark(event, ' + bmIdx + ')">');
		} else {
			// the bookmarked image is filtered out
			filteredOutBookmarks.push(bm);
		}
	});
	
	// append filtered out bookmarks
	filteredOutBookmarks.forEach((bm) => {
		
		let bmIdx = imgData.findIndex(i => i.image == bm);
		
		if (bmIdx >= 0) {
			// the bookmarked image currently passes filter criteria
			$(columns[insertCount++ % columns.length]).append('<div class="bookmark-container-filtered-out"><img src="' + imgData[bmIdx].thumb + '" class="bookmark-filtered-out" style="width:100%"> <div class="centered-text">Filtered Out</div></div>');
		} else {
			console.log('Info: bookmarked image does not exist anymore (image name or path changed) and likely can be removed from your browsers local storage: ' + bm);
		}
	});
}

function loadBookmark(event, imgIdx) {
	event.stopPropagation();
	
	closeBookmarksModal();
	openImgDetailsView(imgIdx);
}


/* Image Fullscreen Modal */
function updateBookmarkOnImageDetailView(imageSrc) {
	let bookmarksArr = getBookmarks();
	let bookmark = bookmarksArr.find(el => el == imageSrc);
	
	if (bookmark != null) {
		$(addBookmarkEl).removeClass('fa-bookmark-o');
		$(addBookmarkEl).addClass('fa-bookmark');
	} else {
		$(addBookmarkEl).removeClass('fa-bookmark');
		$(addBookmarkEl).addClass('fa-bookmark-o');
	}
}

function toggleBookmark(event) {
	event.stopPropagation();
	
	let imgSrc = imagesToLoad[currentImageIndex].image;
	let bookmarksArr = getBookmarks();
	let bookmark = bookmarksArr.find(el => el == imgSrc);
	
	if (bookmark != null) {
		bookmarksArr = bookmarksArr.filter(item => item !== imgSrc);
	} else {
		bookmarksArr.push(imgSrc);
	}
	
	store("bookmarks", JSON.stringify(bookmarksArr));
	
	updateBookmarkOnImageDetailView(imgSrc);
}

function getBookmarks() {
	let existingData = localStorage.getItem("bookmarks");
	try { var bookmarksArr = JSON.parse(existingData); } catch(ex){}
	
	if (existingData == null || bookmarksArr == null) {
		bookmarksArr = JSON.parse('[]');
	}
	
	return bookmarksArr;
}

