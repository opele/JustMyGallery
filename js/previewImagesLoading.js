
var customTagsDirty = false; // when true, tags need to be refreshed

var sortByRating = false;
var sortByDateAsc = false;
var sortByDateDesc = false;
var sortByName = false;

var filterByNameEnabled = false;
var filterByDateEnabled = false;
var currentFromFilterDate;
var currentToFilterDate;
var filterByTagsEnabled = false;
var currentFilterTags;
var filterByCategoryEnabled = false;
var currentFilterCategory;
var categoriesAndTags = true;

var nameFilterFunc = function (dataItemToFilter) { return true; };
var tagsFilterFunc = function (dataItemToFilter) { return true; };
var categoryFilterFunc = function (dataItemToFilter) { return true; };
var dateRangeFilterFunc = function (dataItemToFilter) { return true; };
var filterFunction = function (arr) {
    return arr.filter(function (dataItemToFilter) {
        return nameFilterFunc(dataItemToFilter) &&

            // if tag AND category filters are on, only then consider categoriesAndTags
            // otherwise the OR condition is true and we don't even evaluate the filters
            ((!filterByTagsEnabled || !filterByCategoryEnabled) ||
                ((categoriesAndTags && tagsFilterFunc(dataItemToFilter) && categoryFilterFunc(dataItemToFilter)) ||
                    (!categoriesAndTags && (tagsFilterFunc(dataItemToFilter) || categoryFilterFunc(dataItemToFilter))))
            ) &&

            // if one of them is off, then just apply it regardless of categoriesAndTags
            // this avoids showing all results when categoriesAndTags = false (i.e. OR filtering) and one of the filters is not active (i.e. allows all)
            ((filterByTagsEnabled && filterByCategoryEnabled) ||
                (tagsFilterFunc(dataItemToFilter) && categoryFilterFunc(dataItemToFilter))
            ) &&

            dateRangeFilterFunc(dataItemToFilter);
    });
};

// gallery object which manages the preview images
var gallery;
// imagesToLoad contains all the images available for display according to currently selected filter criteria
var imagesToLoad;
// index of the first loaded preview image, all previous images are not displayed in the gallery
// i.e. equal to the number of unloaded previous images
var imgIdxOffset = 0;
// number of next images to load when scrolled to the bottom or when loading previous images
var chunkSize = 15;
var scrolledToEnd = false;
var lastChunkLoaded = true;
var minDelayLoadingNextChunkSec = 1;
var minDelayLoadingNextChunkPassed = true;

/** detail image view element variables for caching **/
var currentImageIndex = 0; // index of the currently or last opened image
var modal;
var next;
var previous;
var captionText;
var ratingEl;
var predefinedTagsEl;
var userDefinedTagsEl;
var modalNavCurrentEl;
var modalNavMaxEl;
var addBookmarkEl;

/** bookmarks modal **/
var bookmarksModalEl;
var bookmarksListEl;

/** scaling options for the image details view, most of which can be user configured **/
var scaleUpImageHeight = true;
var scaleUpImageWidth = true;
var scaleDownImageWidth = true;
var scaleDownImageHeight = true;
// the image width is scaled to 70% of the screen width
var optimalWidthRatio = 0.7;
// the image height is scaled to 95% of the screen height
var optimalHeightRatio = 0.95;
// when image width is scaled down to fit the screen, the image must be more than 3x as tall than the screen to NOT scale height
var scaleHeightRatioThreshold = 3;
// when image height is scaled down to fit the screen, the image must be more than 3x as wide than the screen to NOT scale width
var scaleWidthRatioThreshold = 3;
// only allow to scale up to twice the original size (original size = slider in the middle)
var maxScale = 2;

// preloading options of full sized images in relation the the currently opened image
var preloadedImages = [];
var numberOfPrevImgsToPreload = 1;
var numberOfNextImgsToPreload = 2;

$(function () {
    refreshSelectableTags();
    refreshSelectableCategories();
});

$(function () {

    modal = document.getElementById("imageModal");
    captionText = document.getElementById("caption");
    ratingEl = document.getElementById("rating");
    predefinedTagsEl = document.getElementById("predefinedTags");
    userDefinedTagsEl = document.getElementById("myTags");
    modalNavCurrentEl = document.getElementById("modalNavCurrent");
    modalNavMaxEl = document.getElementById("modalNavMax");
    addBookmarkEl = document.getElementById("addBookmark");

    bookmarksModalEl = document.getElementById("bookmarksModal");
    bookmarksListEl = document.getElementById("bookmarksList");

    initSearchSidebar();
    initSettingsSidebar();

    loadImages();
});

function loadImages(offset) {
	
	if (offset)
		imgIdxOffset = offset;
	else 
		imgIdxOffset = 0;
	
    scrolledToEnd = false;

    imagesToLoad = imgData;
    if (typeof filterFunction === 'function') {
        imagesToLoad = filterFunction(imagesToLoad);
    }

    updateImgCountDisplay();

    imagesToLoad.sort(sortImages);

    topImageId = 0;
    bottomImageId = 0;

    var firstLoaded = true;
	// we are not loading any images when creating a new gallery, all controlled by the sentinel which is triggered again by clearing all previous images
	lastChunkLoaded = true;

    gallery = new Gallery({
        container: '#gallery-images-container',
        images: imagesToLoad,
        baseImageIndex: imgIdxOffset,
        columnWidth: 230,
        spacing: 10,
        imageOnLoadCallback: function (e) {
            if (firstLoaded) {
                if (imgIdxOffset != 0) {
                    $('#loadPreviousBtn').show();
                }

                firstLoaded = false;
            }

            e.image.thumbnail.get(0).onclick = function () {
                openImgDetailsView(e.image.index);
            };
            
            if (!gallery.loadInProgress()) {
            	if (topImageId + imgIdxOffset > 0) {
            		$('#loadPreviousBtn').show();
            	}
				lastChunkLoaded = true;
            	tryLoadNextChunk();
            }
        },
        heightCalculatedCallback: function (e) {
            $(document.body).height(e.h);
        }
    });

    registerIntersectionCallback();

    if (imgIdxOffset === 0) {
        // navigate to top
        if ('scrollRestoration' in history) {
		  history.scrollRestoration = 'manual';
		}
        window.scrollTo(0, 0);
        $('#loadPreviousBtn').hide();
    } else {
    	
    	let top = gallery.columnsContainer.offset().top;
        window.scrollTo(0, top);
    }
    
	// gallery may has updated the provided base index
	imgIdxOffset = gallery.baseImageIndex;
}

// detect scrolling down
var observer;
function registerIntersectionCallback() {
    let intersectionCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                scrolledToEnd = true;
                tryLoadNextChunk();
            } else {
                scrolledToEnd = false;
            }
        });
    };

    observer = new IntersectionObserver(intersectionCallback);
    observer.observe($('#sentinel').get(0));
}

var topImageId = 0;
var bottomImageId = 0;

// load new images and append to the end of the gallery
function tryLoadNextChunk() {
	if (scrolledToEnd && lastChunkLoaded && minDelayLoadingNextChunkPassed) {
		lastChunkLoaded = false;
		gallery.load(bottomImageId, chunkSize, true);
		bottomImageId += chunkSize;
		
		minDelayLoadingNextChunkPassed = false;
		setTimeout(tryLoadNextChunkFromTimer, minDelayLoadingNextChunkSec * 1000);
    }
}

function tryLoadNextChunkFromTimer() {
	minDelayLoadingNextChunkPassed = true;
	tryLoadNextChunk();
}

// load new images and stack on top of the gallery
function tryLoadPreviousChunk() {
	$('#loadPreviousBtn').hide();
    gallery.load(topImageId, -chunkSize, true);
    topImageId -= chunkSize;
}

function updateImgCountDisplay() {
    $('#filteredImgNumberInfo').html(imagesToLoad.length + ' images to show.');
}
