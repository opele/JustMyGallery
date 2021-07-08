
function openBookmarksModal() {
	loadBookmarksView();
	$(bookmarksModalEl).show();
}

function closeBookmarksModal() {
	$(bookmarksModalEl).hide();
}

function loadBookmarksView() {
	let columns = Array.from(bookmarksListEl.childNodes).filter(cn => cn.className == 'bookmarks-column');
	let bookmarksArr = getBookmarks();
	
	columns.forEach(c => c.innerHTML = "");
	
	// display the bookmarks in the popup modal for user selection
	bookmarksArr.forEach((bm, index) => {
		
		let bmIdx = imagesToLoad.findIndex(i => i.image == bm);
		let filteredOut = bmIdx < 0;
		
		if (bmIdx >= 0) {
			// the bookmarked image currently passes filter criteria
			$(columns[index % columns.length]).append('<img src="' + imagesToLoad[bmIdx].thumb + '" style="width:100%" onclick="loadBookmark(event, ' + bmIdx + ')">');
		} else {
			// the bookmarked image is filtered out
			// TODO: lower opactity, avoid click event and add overlay text: Filtered Out https://www.w3schools.com/howto/howto_css_image_text.asp
			// preview image path needs to be loaded from imgData
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

