
function openBookmarksModal() {
	$(bookmarksModalEl).show();
}

function closeBookmarksModal() {
	$(bookmarksModalEl).hide();
}

function updateBookmarkOnImageDetailView(imageSrc) {
	let bookmarksVal = getBookmarks();
	let bookmark = bookmarksVal.find(el => el == imageSrc);
	
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
	let bookmarksVal = getBookmarks();
	let bookmark = bookmarksVal.find(el => el == imgSrc);
	
	if (bookmark != null) {
		bookmarksVal = bookmarksVal.filter(item => item !== imgSrc);
	} else {
		bookmarksVal.push(imgSrc);
	}
	
	store("bookmarks", JSON.stringify(bookmarksVal));
	
	updateBookmarkOnImageDetailView(imgSrc);
}

function getBookmarks() {
	let existingData = localStorage.getItem("bookmarks");
	try { var bookmarksVal = JSON.parse(existingData); } catch(ex){}
	
	if (existingData == null || bookmarksVal == null) {
		bookmarksVal = JSON.parse('[]');
	}
	
	return bookmarksVal;
}

