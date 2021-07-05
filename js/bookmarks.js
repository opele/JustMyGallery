
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
	
	bookmarksArr.forEach((bm, index) => {
		$(columns[index % columns.length]).append('<img src="' + bm + '" style="width:100%">');
	});
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

