
function openBookmarksModal() {
	$(bookmarksModalEl).show();
}

function closeBookmarksModal() {
	$(bookmarksModalEl).hide();
}

function addBookmark(event) {
	event.stopPropagation();
}

