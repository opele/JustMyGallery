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



var imgStartPositionYOffset = 500;

function GalleryColumn(gallery, index) {
    var self = this;

    self.gallery = gallery;

    self.index = index;

    self.width = 0;
    
    self.height = 0;
	
	self.topHeight = 0;

    self.left = 0;

    self.updateSize = function () {
        self.width = gallery.columnWidth;
    };

    self.updatePosition = function () {
        self.left = gallery.spacing + index * gallery.columnWidth + index * gallery.spacing;
    };
	
	self.getFirstImageBelow = function(imgIdx) {
		let imgBelow = null;
		self.gallery.forEachImage(i => {
			if (i.column == self.index && i.index > imgIdx && (imgBelow == null || imgBelow.index > i.index)) {
				imgBelow = i;
			}
		});
		return imgBelow;
	}
	
	self.getFirstImageAbove = function(imgIdx) {
		let imgAbove = null;
		self.gallery.forEachImage(i => {
			if (i.column == self.index && i.index < imgIdx && (imgAbove == null || imgAbove.index < i.index)) {
				imgAbove = i;
			}
		});
		return imgAbove;
	}

    return self;
};

function GalleryImage(gallery, data, index) {
    var self = this;

    self.gallery = gallery;

    self.data = data;

    self.index = index;

    self.column = 0;

    self.left = 0;
    self.top = 0;

    self.loading = false;
    self.loaded = false;
    self.error = false;

    self.thumbnail = $('<div>');

    self.thumbnail.css({
        left: '0px',
        top: '0px'
    });


    self.updateColumn = function () {
        var column;
		
        if (self.isAddedToTop()) {
			let newColumnObj = self.gallery.getSmallestColumnTop();
            self.column = newColumnObj.index;
			newColumnObj.topHeight += self.data.previewSize.h + self.gallery.spacing;
			self.thumbnail.attr('x-gallery-column', self.column + ' ' + newColumnObj.topHeight);
        }
        else { // image appended to bottom or center
            let newColumnObj = self.gallery.getSmallestColumnBottom();
			self.column = newColumnObj.index;
			newColumnObj.height += self.data.previewSize.h + self.gallery.spacing;
			self.thumbnail.attr('x-gallery-position', self.index + ' ' +  self.column + ' ' + newColumnObj.height);
        }
    };

    self.updatePosition = function (setAnimationStartPosition) {
		var ourColumn = self.gallery.columns[self.column];
        self.left = ourColumn.left + self.gallery.spacing;

        self.top = 0;

        if (self.isAddedToTop()) {
			// put image on top, so get the position of the image below in the same column
			let imgBelow = ourColumn.getFirstImageBelow(self.index);
            if (imgBelow) {
                self.top = (imgBelow.top - self.data.previewSize.h) - self.gallery.spacing;
            }
        } else {
			// put image at the end, so get the position of the image above in the same column
            if (self.isAddedToBottom()) {
                let imgAbove = ourColumn.getFirstImageAbove(self.index);
                if (imgAbove) {
                    self.top = imgAbove.top + imgAbove.data.previewSize.h + self.gallery.spacing;
                }
            }
			// else just just place at the top if we are loading the first row, no need to update the top
        }


        if (setAnimationStartPosition) {
            var startTop = self.top;

            if (self.isAddedToTop()) {
            	// disabled sliding down animation because it requires to be timed with an animation for pushing existing images down
            	//startTop = self.top - 2000;
            }
            else {
                startTop = self.top + imgStartPositionYOffset;
            }

            self.thumbnail.css({
                left: self.left + 'px',
                top: startTop + 'px'
            });
        }
        else {
            self.thumbnail.css({
                left: self.left + 'px',
                top: self.top + 'px'
            });
        }
    };
	
	self.isAddedToTop = function() {
		return self.gallery.baseImageIndex > self.index;
	}
	
	self.isAddedToBottom = function() {
		return self.gallery.baseImageIndex < self.index;
	}

    self.load = function () {
        if (self.loading || self.loaded)
            return;

        self.loading = true;

        self.gallery.imagesBeingLoaded++;

        self.thumbnail.addClass('gallery-thumb');
        self.thumbnail.css({ 'visibility': 'hidden' });

        var img = document.createElement('img');

        $(img).addClass('gallery-thumb-img');

        self.updatePosition(true);

        var loaded = function (error) {
            self.thumbnail.css({ 'visibility': 'visible' });

            self.loading = false;
            self.loaded = true;
            self.error = error;

            self.gallery.imagesBeingLoaded--;

            // this needs to have a delay for the animation to play, otherwise the image randomly just pops up
            setTimeout(self.updatePosition, 100)

            self.gallery.onImageLoaded(self);

            if (error) {
                if (self.gallery.imageOnErrorCallback)
                    self.gallery.imageOnErrorCallback({ image: self, img: img });
            }
            else {
                if (self.gallery.imageOnLoadCallback)
                    self.gallery.imageOnLoadCallback({ image: self, img: img });
            }
        }

        img.onload = function () {
            loaded(false);
        };

        img.onerror = function () {
            loaded(true);
        };

        img.src = self.data.thumb;

        self.thumbnail.append(img);

        self.gallery.columnsContainer.append(self.thumbnail);
    };

    self.remove = function () {
        self.thumbnail.remove();
    };

    return self;
};

function Gallery(options) {
    var self = this;

    self.columns = [];

    self.columnCount = 0;

    self.container = (typeof options.container === 'string') ? $(options.container).first() : options.container;

    self.imageDatas = options.images;
    self.baseImageIndex = options.baseImageIndex || 0;

    self.columnWidth = options.columnWidth;
    self.spacing = options.spacing;

    self.min = 0;
    self.max = 0;

    self.fullMin = 0;
    self.fullMax = 0;


    self.imagesBeingLoaded = 0;

    self.loadInProgress = function () {
        return self.imagesBeingLoaded > 0;
    };


    self.imageOnLoadCallback = options.imageOnLoadCallback;
    self.imageOnErrorCallback = options.imageOnErrorCallback;
    self.heightCalculatedCallback = options.heightCalculatedCallback;



    // Create column container
    // If it already exists, it will be emptied
    self.columnsContainer = $('.gallery-columns');

    if (!self.columnsContainer.length) {
        self.columnsContainer = $('<div>');
        self.columnsContainer.addClass('gallery-columns');
        self.container.append(self.columnsContainer);
    } else {
        self.columnsContainer.empty();
    }


    self.images = [];

    for (var i = 0; i < self.imageDatas.length; ++i) {
        self.images[i] = new GalleryImage(self, self.imageDatas[i], i);
    }


    self.getImage = function (index) {
        return self.images[index];
    };


    self.forEachImage = function (callback) {
        for (var i = 0; i < self.images.length; ++i) {
            callback(self.images[i], i);
        }
    };
	
	// iterates over the images in the order they are added to the gallery: appended images first then previous images
	self.forEachImageInsertionOrder = function (callback) {
        for (var i = 0; i < self.images.length; ++i) {
			if (self.images[i].index >= self.baseImageIndex)
				callback(self.images[i], i);
        }
		for (var i = self.images.length - 1; i >= 0; --i) {
			if (self.images[i].index < self.baseImageIndex)
				callback(self.images[i], i);
        }
    };

    self.forEachColumn = function (callback) {
        for (var i = 0; i < self.columns.length; ++i) {
            callback(self.columns[i], i);
        }
    };


    self.resize = function () {
        // Get width of the container (space for our columns)
        var containerWidth = self.columnsContainer.width();

        // Calculate the actual space available for columns (it excludes the left and right padding)
        var spaceForColumns = containerWidth - self.spacing * 2;

        self.columnCount = Math.max(1, Math.floor(spaceForColumns / (self.columnWidth + self.spacing)));

        self.columns = [];

        for (var i = 0; i < self.columnCount; ++i) {
            self.columns.push(new GalleryColumn(self, i));
        }

		// if there are previous images, always load at least a full row
		if (self.baseImageIndex > 0 && (self.images.length - self.baseImageIndex) < self.columnCount) {
			self.baseImageIndex = Math.max(0, self.images.length - self.columnCount);
		}

        self.forEachImageInsertionOrder(i => i.updateColumn());

        self.forEachColumn(c => c.updateSize());
        self.forEachColumn(c => c.updatePosition());

        self.forEachImage(i => i.updatePosition(false));


        self.updateMinMax();
    };

    self.load = function (baseIndex, count, indexIsRelative) {
        if (count === undefined)
            count = 1;

        var start = baseIndex;
        var end = baseIndex + count;

        if (count < 0) {
            for (var i = start; i > end; --i) {
                var index = i;

                if (indexIsRelative) {
                    index = self.baseImageIndex + index;
                }

                if (index < 0 || index >= self.images.length)
                    continue;

                self.images[index].load();
            }
        }
        else {
            for (var i = start; i < end; ++i) {
                var index = i;

                if (indexIsRelative) {
                    index = self.baseImageIndex + index;
                }

                if (index < 0 || index >= self.images.length)
                    continue;

                self.images[index].load();
            }
        }
    };

    self.remove = function (baseIndex, count, indexIsRelative) {
        if (count === undefined)
            count = 1;

        for (var i = 0; i < count; ++i) {
            var index = baseIndex + i;

            if (indexIsRelative) {
                index = self.baseImageIndex + index;
            }

            self.images[index].remove();
        }

        self.resize();
    };


    self.updateMinMax = function () {
        self.min = 0;
        self.max = 0;

        self.fullMin = 0;
        self.fullMax = 0;

        self.forEachImage(image => {
            if (image.loaded) {
                self.min = Math.min(image.top, self.min);
                self.max = Math.max(image.top + image.data.previewSize.h, self.max);
            }

            self.fullMin = Math.min(image.top, self.fullMin);
            self.fullMax = Math.max(image.top + image.data.previewSize.h, self.fullMax);
        });

        self.applyMinMax();
    };
	
	self.getSmallestColumnBottom = function() {
		var smallestColumn = self.columns[0];
		
		self.forEachColumn(c => { 
			if (c.height < smallestColumn.height)
				smallestColumn = c;
		});
		
		return smallestColumn;
	};
	
	self.getSmallestColumnTop = function() {
		var smallestColumn = self.columns[0];
		
		self.forEachColumn(c => {
			if (c.topHeight < smallestColumn.topHeight)
				smallestColumn = c;
		});
		
		return smallestColumn;
	};

    self.onImageLoaded = function (image) {
        self.min = Math.min(image.top, self.min);
        self.max = Math.max(image.top + image.data.previewSize.h, self.max);

        self.fullMin = Math.min(image.top, self.fullMin);
        self.fullMax = Math.max(image.top + image.data.previewSize.h, self.fullMax);

        self.applyMinMax();
    };

    self.applyMinMax = function () {
        var height = Math.abs(self.max - self.min);
        var fullHeight = Math.abs(self.fullMax - self.fullMin) + imgStartPositionYOffset;

        self.columnsContainer.css({
            height: height + 'px'
        });

        if (self.min < 0) {
            self.columnsContainer.css({
                transform: 'translateY(' + (-self.min) + 'px)'
            });
        }
        else {
            self.columnsContainer.css({
                transform: 'translateY(0px)'
            });
        }

        if (self.heightCalculatedCallback)
            self.heightCalculatedCallback({ h: fullHeight, min: self.fullMin, max: self.fullMax });
    };

    self.resize();

    var windowResizing = null;

    window.addEventListener('resize', () => {
        if (windowResizing)
            clearTimeout(windowResizing);

        windowResizing = setTimeout(() => {
            windowResizing = null;
            self.resize();
        }, 400);
    });

    return self;
}

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
// window keyboard event listener
 $(function() {
		 
		 // use keydown instead of keypress which also catches non-printing keys such as Shift, Esc...
		$(window).keydown(function( event ) {
		
			if (isViewingImage() && !isEditingModalComponent()) { // single image mode
				// enable rating with number keys 1 to 5
				processKeyEvtForRating(event);
				
				if (event.key == "ArrowLeft") {
				  navigateToPrevious(null);
				  
				} else if (event.key == "ArrowRight") {
				  navigateToNext(null);
				  
				} else if (event.key == "Escape") {
					closeImageView(event, true);
				  
				} else if (event.key == "ArrowUp") {
					modal.scrollTop -= 20;
					
				} else if (event.key == "ArrowDown") {
					modal.scrollTop += 20;
				}
				
			} else if (!isViewingImage()) { // displaying gallery with preview images
			
				if (event.key == 'Escape') {
					if (isViewingBookmarks()) {
						closeBookmarksModal();
					} else {
						closeSidebar();
					}
				
				} else if (event.key == '1' && !isSidebarVisible()) {
					// when the sidebar is already visible, this prevents switching between the different sidebars
					// this is a problem when typing numbers into an input field
					openSearchSidebar();
				} else if (event.key == '2' && !isSidebarVisible()) {
					openBookmarksModal();
				} else if (event.key == '3' && !isSidebarVisible()) {
					openSettingsSidebar();
				}
			}
				
		});

		$(window).on("mousewheel DOMMouseScroll", function(event) {
			if (isViewingImage() && !isEditingModalComponent()) {
				if (event.shiftKey) {
					resizeImage(event);
				} else {
					moveImageY(event);
				}
			}
		});
 });function sortImages(a, b) {
	
	var ratingSortResult = 0;
	if (sortByRating) {
		ratingSortResult = sortImagesByRating(a, b);
	}
	
	if (ratingSortResult == 0) {
	
		if (sortByDateAsc) {
			if(a.timestamp && b.timestamp) return a.timestamp - b.timestamp;
			
		} else if (sortByDateDesc) {
			if(a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
			
		} else if (sortByName) {
			if(a.title && b.title) {
				var x = a.title.toLowerCase();
				var y = b.title.toLowerCase();
				if (x < y) return -1;
				if (x > y) return 1;
			}
		}
	}
	
	return ratingSortResult;
}

function sortImagesByRating(a, b) {
	var localItemObjA = JSON.parse(localStorage.getItem(a.image));
	var aHasRating = localItemObjA && localItemObjA.rating;
	
	var localItemObjB = JSON.parse(localStorage.getItem(b.image));
	var bHasRating = localItemObjB && localItemObjB.rating;
	
	if (!aHasRating && !bHasRating) return 0;
	if (!aHasRating && bHasRating) return 1;
	if (aHasRating && !bHasRating) return -1;
	if (localItemObjA.rating > localItemObjB.rating) return -1;
	if (localItemObjA.rating < localItemObjB.rating) return 1;
	return 0;
}

$(function() {
	// when the list item is highlighted toggle the switch regardless if the checkbox was actually clicked
	$('#sortByDateAscButton').on('click', function(e) {
	  toggleSortByDateAsc();
	});
	// when the checkbox is focused on, enter key toggles it
	$('#sortByDateAscButton').on('keydown', function(e) {
	  if (event.key == 'Enter') {
		event.preventDefault();
		toggleSortByDateAsc();
	  }
	});
	// ignore clicks directly on the checkbox, which also trigger the parent
	$('#sortByDateAscSwitch').on('click', function(e) {
		return false;
	});
	
	$('#sortByDateDescButton').on('click', function(e) {
	  toggleSortByDateDesc();
	});
	$('#sortByDateDescButton').on('keydown', function(e) {
	  if (event.key == 'Enter') {
		event.preventDefault();
		toggleSortByDateDesc();
	  }
	});
	$('#sortByDateDescSwitch').on('click', function(e) {
		return false;
	});
	
	$('#sortByNameButton').on('click', function(e) {
	  toggleSortByName();
	});
	$('#sortByNameButton').on('keydown', function(e) {
	  if (event.key == 'Enter') {
		event.preventDefault();
		toggleSortByName();
	  }
	});
	$('#sortByNameSwitch').on('click', function(e) {
		return false;
	});
	
	$('#sortByRatingButton').on('click', function(e) {
	  toggleSortByRating();
	});
	$('#sortByRatingButton').on('keydown', function(e) {
	  if (event.key == 'Enter') {
		event.preventDefault();
		toggleSortByRating();
	  }
	});
	$('#sortByRatingSwitch').on('click', function(e) {
		return false;
	});
});

function toggleSortByDateAsc() {
	sortByDateAsc = !sortByDateAsc;
	sortByDateDesc = false;
	sortByName = false;
	refreshSortingUi();
	persistSorting();
	loadImages();
}

function toggleSortByDateDesc() {
	sortByDateDesc = !sortByDateDesc;
	sortByDateAsc = false;
	sortByName = false;
	refreshSortingUi();
	persistSorting();
	loadImages();
}

function toggleSortByName() {
	sortByName = !sortByName;
	sortByDateDesc = false;
	sortByDateAsc = false;
	refreshSortingUi();
	persistSorting();
	loadImages();
}

function toggleSortByRating() {
	sortByRating = !sortByRating;
	$('#sortByRatingSwitch').prop('checked', sortByRating);
	persistSorting();
	loadImages();
}

function refreshSortingUi() {
	$('#sortByDateAscSwitch').prop('checked', sortByDateAsc);
	$('#sortByDateDescSwitch').prop('checked', sortByDateDesc);
	$('#sortByNameSwitch').prop('checked', sortByName);
	$('#sortByRatingSwitch').prop('checked', sortByRating);
}

function persistSorting() {
	store('sortByRating', sortByRating);
	store('sortByDateAsc', sortByDateAsc);
	store('sortByDateDesc', sortByDateDesc);
	store('sortByName', sortByName);
}


var myTagsPrefix = '&nbsp;&nbsp;&nbsp;&nbsp;My Tags:&nbsp;';
var myTagEmptyHtml = '<span class="my-tag" contenteditable=true>&nbsp;&nbsp;&nbsp;&nbsp</span>';

function displayTags(tags) {

	var tagsEl = $(predefinedTagsEl);
	tagsEl.html("");
	
	if (tags) {
		// padding does not work because it inlines the tags with the previous div
		tagsEl.html("&nbsp;&nbsp;&nbsp;&nbsp;Tags: " + tags.replaceAll(',', ', '));
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
	return activeElementHasClass('my-tag');
}
// image title filter
(function() {
		$('#inputNameFilter').keypress(function(event) {
			
			if (event.key == 'Enter') { // return key
				event.preventDefault();
				filterByName();
				$('[data-toggle="tooltip"]').tooltip('hide');
			}
		});
}());

function filterByName() {
	
	var filter = $("#inputNameFilter").val();
	
	filterByNameEnabled = !isBlank(filter);
	applyFilterByName(filter);
	
	store('filterByNameEnabled', filterByNameEnabled);
	store('currentFilterByName', filter);

	loadImages();
}

function applyFilterByName(filter) {
	
	if (filterByNameEnabled) {
		nameFilterFunc = function(dataItemToFilter) {
				return dataItemToFilter.title && dataItemToFilter.title.toLowerCase().includes(filter.toLowerCase());
			}
	} else {
		nameFilterFunc = function(dataItemToFilter) {return true;};
	}
	
	displayAsActive(filterByNameEnabled, $('#nameFilterContainer').get(0));
}

// date filter
function filterByDateRange() {
	
	// the number of milliseconds from midnight UTC the morning of 1970-01-01 to the time represented by the Date object
	filterFrom = document.getElementById("inputDateFromFilter").valueAsNumber;
	filterTo = document.getElementById("inputDateToFilter").valueAsNumber;
	
	// check if dates changed
	if ( (filterFrom !== currentFromFilterDate && !(isNaN(filterFrom) && isNaN(currentFromFilterDate))) || 
		 (filterTo !== currentToFilterDate && !(isNaN(filterTo) && isNaN(currentToFilterDate)))) {
		currentFromFilterDate = filterFrom;
		currentToFilterDate = filterTo;
	} else {
		return;
	}
	
	filterByDateEnabled = !((isBlank(filterFrom) || isNaN(filterFrom)) && (isBlank(filterTo) || isNaN(filterTo)));
	
	applyFilterByDateRange();
	
	store('filterByDateEnabled', filterByDateEnabled);
	store('currentFromFilterDate', currentFromFilterDate);
	store('currentToFilterDate', currentToFilterDate);
	
	loadImages();
}

function applyFilterByDateRange() {
	
	var filterFrom = currentFromFilterDate;
	var filterTo = currentToFilterDate;
	
	if (filterByDateEnabled) {
		if (isBlank(filterFrom) || isNaN(filterFrom)) {
			filterFrom = -1;
		}
		
		if (isBlank(filterTo) || isNaN(filterTo)) {
			filterTo = Number.MAX_VALUE;
		}
	
		dateRangeFilterFunc = function(dataItemToFilter) {
				return dataItemToFilter.timestamp && dataItemToFilter.timestamp >= filterFrom && dataItemToFilter.timestamp <= filterTo;
			}
		
	} else { 
		dateRangeFilterFunc = function(dataItemToFilter) {return true;};
	}
	
	displayAsActive(filterByDateEnabled, $('#dateFilterContainer').get(0));
}

function filterFromDateChanged() {
	var filterFrom = document.getElementById("inputDateFromFilter").valueAsNumber;
	if (isBlank(filterFrom) || isNaN(filterFrom)) filterByDateRange(); // onblur does not fire in FF when clearing the date
}

function filterToDateChanged() {
	var filterTo = document.getElementById("inputDateToFilter").valueAsNumber;
	if (isBlank(filterTo) || isNaN(filterTo)) filterByDateRange(); // onblur does not fire in FF when clearing the date
}


// tags filter
function filterByTags() {

	var filterTags = $('#tagsFilter').val();
	
	if (arraysEqual(filterTags, currentFilterTags)) return;
	
	currentFilterTags = filterTags;
	filterByTagsEnabled = filterTags && filterTags.length > 0;
	
	applyFilterByTags();
	
	store('filterByTagsEnabled', filterByTagsEnabled);
	store('currentFilterTags', currentFilterTags);
	
	loadImages();
}

function applyFilterByTags() {
	
	if (filterByTagsEnabled) {
		tagsFilterFunc = function(dataItemToFilter) {
				let imgTags = dataItemToFilter.tags;
				let customTags = getImgUserData(dataItemToFilter.image).customTags;
				if (customTags && customTags.length) {
					if (imgTags && imgTags.length) imgTags += ',' + customTags;
					else imgTags = customTags;
				}
				return imgTags.length && findIntersection(imgTags.split(","), currentFilterTags).length > 0;
			}
	} else {
		tagsFilterFunc = function(dataItemToFilter) {return true;};
	}
	
	displayAsActive(filterByTagsEnabled, $('#tagsFilterContainer').get(0));
}

// category filter
$(function() {
		// this event triggers when clearing the selected value on a single select dropdown
		// TODO: this will not work with multiple clearable dropdowns
		$('.bs-select-clear-selected').click(function() {
			
			currentFilterCategory = null;
			filterByCategoryEnabled = false;
			categoryFilterFunc = function(dataItemToFilter) {return true;};
			
			displayAsActive(filterByCategoryEnabled, $('#categoryFilterContainer').get(0));
			
			store('filterByCategoryEnabled', filterByCategoryEnabled);
			store('currentFilterCategory', currentFilterCategory);
			
			loadImages();
		});
});

function filterByCategory() {

	var filterCategory = $('#categoryFilter').val();
	
	if (filterCategory === currentFilterCategory) return;
	currentFilterCategory = filterCategory;
	filterByCategoryEnabled = !isBlank(filterCategory);
	
	applyFilterByCategory();
	
	store('filterByCategoryEnabled', filterByCategoryEnabled);
	store('currentFilterCategory', currentFilterCategory);
	
	loadImages();
}

function applyFilterByCategory() {
	
	if (filterByCategoryEnabled) {
		categoryFilterFunc = function(dataItemToFilter) {
				return dataItemToFilter.categories && dataItemToFilter.categories.split(",").includes(currentFilterCategory);
			}
	} else {
		categoryFilterFunc = function(dataItemToFilter) {return true;};
	}
	
	displayAsActive(filterByCategoryEnabled, $('#categoryFilterContainer').get(0));
}

// combine tags and category filter
function toggleTagsAndCategoryFilter() {

	categoriesAndTags = !categoriesAndTags;
	
	applyTagsAndCategoryFilter();
	
	store('categoriesAndTags', categoriesAndTags);
	
	if (filterByCategoryEnabled && filterByTagsEnabled) {
		loadImages();
	}
}

function applyTagsAndCategoryFilter() {
	
	if (categoriesAndTags) {
		$('#toggleTagsAndCategoryFilterBtn').html("Tags AND Category");
	} else {
		$('#toggleTagsAndCategoryFilterBtn').html("Tags OR Category");
	}
}

function openSearchSidebar() {
  $('.sidebar-open-button').hide();
  $('#settingsSidebar').hide();
  $('#searchAndFilterSidebar').show();
  document.getElementById("sidebar-container").style.left = "0px";
}

function closeSidebar() {
  document.getElementById("sidebar-container").style.left = "-250px";
  $('.sidebar-open-button').show(500);
}

function isSidebarVisible() {
	return $("#sidebar-container").position().left >= 0;
}

$(function() {
		
	$('.close-sidebar-btn').keydown(function(event) {
			if (event.key == 'Enter') closeSidebar();
		});
	
});

function displayAsActive(isActive, element) {
	if (isActive) {
		element.classList.remove("bg-dark");
		element.classList.add("active");
	} else {
		element.classList.remove("active");
		element.classList.add("bg-dark");
	}
}

function initSearchSidebar() {
	
	var currentFilterByName = null;
	
	if (isLocalStorageAccepted()) {
		// sorting
		sortByRating = localStorage.getItem('sortByRating') == 'true';
		sortByDateAsc = localStorage.getItem('sortByDateAsc') == 'true';
		sortByDateDesc = localStorage.getItem('sortByDateDesc') == 'true';
		sortByName = localStorage.getItem('sortByName') == 'true';
	
		// filters
		filterByNameEnabled = localStorage.getItem('filterByNameEnabled') == 'true';
		currentFilterByName = localStorage.getItem('currentFilterByName');
		filterByDateEnabled = localStorage.getItem('filterByDateEnabled') == 'true';
		currentFromFilterDate = parseInt(localStorage.getItem('currentFromFilterDate'));
		currentToFilterDate = parseInt(localStorage.getItem('currentToFilterDate'));
		filterByTagsEnabled = localStorage.getItem('filterByTagsEnabled') == 'true';
		if (localStorage.getItem('currentFilterTags'))
			currentFilterTags = localStorage.getItem('currentFilterTags').split(',');
		filterByCategoryEnabled = localStorage.getItem('filterByCategoryEnabled') == 'true';
		currentFilterCategory = localStorage.getItem('currentFilterCategory');
		categoriesAndTags = localStorage.getItem('categoriesAndTags') == 'true';
	}
	
	refreshSortingUi();
	
	$('#inputNameFilter').val(currentFilterByName);
	applyFilterByName(currentFilterByName);
	
	document.getElementById("inputDateFromFilter").valueAsNumber = currentFromFilterDate;
	document.getElementById("inputDateToFilter").valueAsNumber = currentToFilterDate;
	applyFilterByDateRange();
	
	if (currentFilterTags != null && currentFilterTags.length > 0) {
		$('#tagsFilter').selectpicker('val', currentFilterTags);
	}
	applyFilterByTags();
	
	if (!isBlank(currentFilterCategory)) {
		$('#categoryFilter').selectpicker('val', currentFilterCategory);
	}
	applyFilterByCategory();
	
	applyTagsAndCategoryFilter();
}

// toggle z-index on show and hide dropdown events, so the select options do not display behind other controls
$(function() {
		$('#tagsFilter').on('show.bs.select', function (e) {
			toggleDisplaySidebarElementInForeground($('#tagsFilterContainer'), true);
		});

		$('#tagsFilter').on('hide.bs.select', function (e) {
			toggleDisplaySidebarElementInForeground($('#tagsFilterContainer'), false);
			filterByTags();
		});
		
		// close the select menue when pressing left key
		// enter key (de)selects the focused element
		$('#tagsFilter + button.btn.dropdown-toggle').keydown(function( event ) {
			var selectWidget = $('#tagsFilter');
			if (selectWidget.parent().hasClass('show')) {
				if (event.key == 'ArrowLeft')
					selectWidget.selectpicker('toggle');
			} else {
				if (event.key == 'Backspace') {
					selectWidget.selectpicker('deselectAll');
					filterByTags();
				}
			}
		});
		
});

// toggle z-index on show and hide dropdown events, so the select options do not display behind other controls
$(function() {
		$('#categoryFilter').on('show.bs.select', function (e) {
			toggleDisplaySidebarElementInForeground($('#categoryFilterContainer'), true);
		});

		$('#categoryFilter').on('hide.bs.select', function (e) {
			toggleDisplaySidebarElementInForeground($('#categoryFilterContainer'), false);
			filterByCategory();
		});
		
		// close the select menue when pressing left key
		$('#categoryFilter + button.btn.dropdown-toggle').keydown(function( event ) {
			var selectWidget = $('#categoryFilter');
			if (selectWidget.parent().hasClass('show')) {
				if (event.key == 'ArrowLeft')
					selectWidget.selectpicker('toggle');
			} else {
				if (event.key == 'Backspace' && selectWidget.val().length > 0) {
					$('.bs-select-clear-selected').click();
				}
			}
		});
});

function toggleDisplaySidebarElementInForeground(element, showInForeground) {
	$('#sidebar-container > ul > div').each(function(index) {
		if (showInForeground) {
			if (!element.is($(this))) {
				$(this).css('z-index', 0);
			}
		} else {
			$(this).css('z-index', 2)
		}
	});
}

 // initialising selections
 // tags
 function refreshSelectableTags() {
	customTagsDirty = false;
	var allTagsSet = new Set();
	imgData.forEach(function(imgDataItem) {
		
		if (imgDataItem.tags) {
			imgDataItem.tags.split(',').forEach(t => allTagsSet.add(t));
		}
		
		// add user defined tags
		item = JSON.parse(localStorage.getItem(imgDataItem.image));
		if (item != null && item.customTags && item.customTags.length) {
			item.customTags.split(',').forEach(t => allTagsSet.add(t));
		}
	});
	
	$('#tagsFilter').empty();
	allTagsSet.forEach(function(tag) {
		$('#tagsFilter').append('<option value="' + tag + '">' + tag + '</option>');
	});
	
	$('#tagsFilter').selectpicker('refresh');
	
	if (filterByTagsEnabled && currentFilterTags != null && currentFilterTags.length > 0) {
		// remove currently selected tag if it was only set on the single image
		currentFilterTags = findIntersection(currentFilterTags, Array.from(allTagsSet));
		
		// if we still have tags then just set to the tag widget
		if (currentFilterTags != null && currentFilterTags.length > 0) {
			$('#tagsFilter').selectpicker('val', currentFilterTags);
		} else {
			$('#tagsFilter').selectpicker('val', null);
			filterByTagsEnabled = false;
			store('filterByTagsEnabled', filterByTagsEnabled);
			// show tag filter as inactive
			applyFilterByTags();
		}
		store('currentFilterTags', currentFilterTags);
		
		// if the gallery displays a single image ...
		if (imagesToLoad.length == 1 || gallery.images.length == 1) {
			// ...and we removed the tag filter
			if (!filterByTagsEnabled) {
				// ...then this image was the last image with that tag, and we should re-apply the remaining filters (if any)
				// it should not be possible to remove the tag filter when there is more than one image to display
				loadImages();
			}
		}
	}
	
	$('#tagsFilter').selectpicker('refresh');
 }
 
 
 // categories
 function refreshSelectableCategories() {
	var allCategoriesSet = new Set();
	imgData.forEach(function(imgDataItem) {
		if (imgDataItem.categories) {
			imgDataItem.categories.split(',').forEach(t => allCategoriesSet.add(t));
		}
	});
	
	$('#categoryFilter').empty();
	allCategoriesSet.forEach(function(category) {
		$('#categoryFilter').append('<option value="' + category + '">' + capitalise(category) + '</option>');
	});
	
	$('#categoryFilter').selectpicker('refresh');
 }


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
	persistSettings();
}

function updateWidthRatioThreshold() {
	
	let inputVal = Number(document.getElementById("imgWidthRatioThreshold").value);
	 if (!isNumber(inputVal)) {
		console.log('Error: Invalid input for imgWidthRatioThreshold: ' + inputVal);
		document.getElementById("imgWidthRatioThreshold").value = 3;
		inputVal = 3;
	}
	
	scaleWidthRatioThreshold = inputVal;
	persistSettings();
}

function updateHeightRatioThreshold() {
	
	let inputVal = Number(document.getElementById("imgHeightRatioThreshold").value);
	 if (!isNumber(inputVal)) {
		console.log('Error: Invalid input for imgHeightRatioThreshold: ' + inputVal);
		document.getElementById("imgHeightRatioThreshold").value = 3;
		inputVal = 3;
	}
	
	scaleHeightRatioThreshold = inputVal;
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
	document.getElementById("imgWidthRatioThreshold").value = scaleWidthRatioThreshold;
	$('#scaleUpImgWidthSwitch').prop('checked', scaleUpImageWidth);
	$('#scaleDownImgWidthSwitch').prop('checked', scaleDownImageWidth);
	
	document.getElementById("imgWindowHeightRatio").value = optimalHeightRatio;
	document.getElementById("imgHeightRatioThreshold").value = scaleHeightRatioThreshold;
	$('#scaleUpImgHeightSwitch').prop('checked', scaleUpImageHeight);
	$('#scaleDownImgHeightSwitch').prop('checked', scaleDownImageHeight);
}

function persistSettings() {
	store('optimalWidthRatio', optimalWidthRatio);
	store('scaleWidthRatioThreshold', scaleWidthRatioThreshold);
	store('scaleUpImageWidth', scaleUpImageWidth);
	store('scaleDownImageWidth', scaleDownImageWidth);
	
	store('optimalHeightRatio', optimalHeightRatio);
	store('scaleHeightRatioThreshold', scaleHeightRatioThreshold);
	store('scaleUpImageHeight', scaleUpImageHeight);
	store('scaleDownImageHeight', scaleDownImageHeight);
}

function loadSettingsFromStorage() {
	let storedNumber = Number(localStorage.getItem('optimalWidthRatio'));
	if (isNumber(storedNumber) && storedNumber > 0) {
		optimalWidthRatio = storedNumber;
	}
	storedNumber = Number(localStorage.getItem('scaleWidthRatioThreshold'));
	if (isNumber(storedNumber) && storedNumber > 0) {
		scaleWidthRatioThreshold = storedNumber;
	}
	if (localStorage.getItem('scaleUpImageWidth') !== null) {
		scaleUpImageWidth = localStorage.getItem('scaleUpImageWidth') == 'true';
	}
	if (localStorage.getItem('scaleDownImageWidth') !== null) {
		scaleDownImageWidth = localStorage.getItem('scaleDownImageWidth') == 'true';
	}
	
	storedNumber = Number(localStorage.getItem('optimalHeightRatio'));
	if (isNumber(storedNumber) && storedNumber > 0) {
		optimalHeightRatio = storedNumber;
	}
	storedNumber = Number(localStorage.getItem('scaleHeightRatioThreshold'));
	if (isNumber(storedNumber) && storedNumber > 0) {
		scaleHeightRatioThreshold = storedNumber;
	}
	if (localStorage.getItem('scaleUpImageHeight') !== null) {
		scaleUpImageHeight = localStorage.getItem('scaleUpImageHeight') == 'true';
	}
	if (localStorage.getItem('scaleDownImageHeight') !== null) {
		scaleDownImageHeight = localStorage.getItem('scaleDownImageHeight') == 'true';
	}
}


function displayRating(imageSrc) {

	var rateEl = $(ratingEl);
	
	// disable arrowkey navigation to the next input which changes the selection of the next image when the rating input box is focused
	rateEl.on("keydown keyup keyleft keyright", "input", function(event) { 
			event.preventDefault();
	});
	
	var item = JSON.parse(localStorage.getItem(imageSrc));
	
	refreshRating(rateEl, item == null ? null : item.rating);
}

function rateImage(event, rating) {
	
	if (event) event.stopPropagation();

	if (!isLocalStorageAccepted()) {
		alert("Unable to remember new rating without permission to use local browser storage.");
		return;
	}

	storeCurrentImgUserData(rating, null);
	refreshRating($(event.target.parentElement), rating);
}

function refreshRating(rateEl, rating) {
	rateEl.children('span').each(function(index) {
		var isChecked = rating && index < rating;
		$(this).get(0).className = isChecked ? 'fa fa-star checked' : 'fa fa-star unchecked';
	});
}
 
 
 function processKeyEvtForRating(event) {
	
	var rateEl = $(ratingEl);
	
	// enable rating with number keys
	// 1 to 5, works with both: numpad or number keys under F-keys
	if (event.key == '1') {
		rateEl.children('span').get(0).click();
	} else if (event.key == '2') {
		rateEl.children('span').get(1).click();
	} else if (event.key == '3') {
		rateEl.children('span').get(2).click();
	} else if (event.key == '4') {
		rateEl.children('span').get(3).click();
	} else if (event.key == '5') {
		rateEl.children('span').get(4).click();
	}
 }

/* SHOW IMAGE IN ORIGINAL SIZE */

let currSelectedImg;

$(function () {
	var range = $("#imageSizeRange");
	range.on("input change", function () {
		applyScaleToImg(range.val(), modalImg[0], currSelectedImg.size);
	});
});

let isPanning = false;
let modalImg;

function openImgDetailsView(imgIndex) {
	modalImg = $('#modalImg');
	
	isPanning = false;
	resetPan();

	let isValid = isNumber(imgIndex) && Number.isInteger(imgIndex) && imgIndex >= 0 && imgIndex <= imagesToLoad.length;
	
	if (!isValid) {
		console.log("Warning: ignoring invalid image index: " + imgIndex);
		return;
	}

	let modalPanner = $('#modalPanner');
	$('#imageSizeRangeContainer').show();
	$('.loader').show();
	$('.sidebar-open-button').hide();
	$('body').css('overflow', 'hidden');
	
	let imageData = currSelectedImg = imagesToLoad[imgIndex];
	currentImageIndex = imgIndex;
	
	if (canNavigateToNext()) {
		$('.next').show();
	} else {
		$('.next').hide();
	}
	
	if (canNavigateToPrevious()) {
		$('.previous').show();
	} else {
		$('.previous').hide();
	}

	// Create a new image element to avoid showing a previous image
	modalImg[0].remove();
	modalPanner.append('<img class="modal-content" id="modalImg" draggable="false"></img>');
	modalImg = $('#modalImg');

	applyImageSizeRange(modalImg[0], imageData.size);
	
	installPanning();
	
	var imgLoaded = function (e) {
		$('.loader').hide();
		preloadImages();
	};
	
	modalImg.on('load', imgLoaded);
	modalImg.attr('src', imageData.image);
	
	if (modalImg[0].complete){
		imgLoaded();
	}
	
	captionText.innerHTML = imageData.title;
	displayRating(imageData.image);
	updateModalNav();
	updateBookmarkOnImageDetailView(imageData.image);
	
	modal.style.display = "block";
	displayTags(imageData.tags);
}

var panStart = { x: 0, y: 0 };
var pan = { x: 0, y: 0 };

function resetPan() {
	panStart = { x: 0, y: 0 };
	pan = { x: 0, y: 0 };
	modalImg.css({'transform' : ''});
}

function installPanning() {
	
	modalImg.on('mousemove', e => {
		if (!isPanning)
			return;

		let dx = e.pageX - panStart.x;
		let dy = e.pageY - panStart.y;

		pan.x += dx;
		pan.y += dy;

		panStart.x = e.pageX;
		panStart.y = e.pageY;
		
		applyPanning();
		
	});

	modalImg.on('mousedown', e => {
		event.preventDefault();
		isPanning = true;
		$('.modal-content').css({'cursor': 'grabbing'});

		panStart.x = e.pageX;
		panStart.y = e.pageY;
	});

	modalImg.on('mouseup', e => {
		isPanning = false;
		$('.modal-content').css({'cursor': 'grab'});
	});
}

function applyPanning() {
	modalImg.css({
			'transform': 'translate(' + pan.x + 'px,' + pan.y + 'px)'
		});
}

function canNavigateToPrevious() {
	return currentImageIndex > 0;
}

function navigateToPrevious(event) {
    if (event) event.stopPropagation();
    
    if (canNavigateToPrevious()) {
		openImgDetailsView(currentImageIndex - 1);
    }
}

function canNavigateToNext() {
	return currentImageIndex < imagesToLoad.length - 1;
}

function navigateToNext(event) {
    if (event) event.stopPropagation();
    
    if (canNavigateToNext()) {
		openImgDetailsView(currentImageIndex + 1);
    }
}

function updateModalNav() {
	modalNavCurrentEl.value = currentImageIndex + 1;
	modalNavMaxEl.textContent = imagesToLoad.length;
}

/**
* Updates the size range slider and sets the optimal initial scale.
* Optimal means to size the image so it covers most of the screen but is not cut off.
* Small images are scaled up whereas images exceeding the screen resolution are scaled down.
* Always scale all sides uniformly by a single scalar so proprtions are maintained.
*
* However, very tall or wide images should not be sqeezed (e.g. single image webcomics).
*/
function applyImageSizeRange(img, size) {

	let currentImg = img;

	if (!size) {
		size = { w: currentImg.naturalWidth, h: currentImg.naturalHeight };
	};
	
	let screenWidth = document.documentElement.clientWidth;
	let optimalWidth = optimalWidthRatio * screenWidth;
	let optimalScaleWidth = optimalWidth / size.w;
	let imgWidthExceedsOptimal = optimalScaleWidth < 1;
	let attemptScaleUpWidth = scaleUpImageWidth && !imgWidthExceedsOptimal;
	let attemptScaleDownWidth = scaleDownImageWidth && imgWidthExceedsOptimal;
	let attemptScaleWidth = attemptScaleUpWidth || attemptScaleDownWidth;
	
	let screenHeight = document.documentElement.clientHeight;
	let optimalHeight = optimalHeightRatio * screenHeight;
	let optimalScaleHeight = optimalHeight / size.h;
	let imgHeightExceedsOptimal = optimalScaleHeight < 1;
	let attemptScaleUpHeight = scaleUpImageHeight && !imgHeightExceedsOptimal;
	let attemptScaleDownHeight = scaleDownImageHeight && imgHeightExceedsOptimal;
	let attemptScaleHeight = attemptScaleUpHeight || attemptScaleDownHeight;
	
	// either scale up or down where scaling down has precedence
	let attemptToScaleDown = attemptScaleDownHeight || attemptScaleDownWidth;
	
	// evaluate which side of the image to scale according to the side which required greater scaling (optimal) unless suppressed by config
	let scaleHeight = false;
	let scaleWidth = false;
	// true if height needs to be scaled for optimal image fit, otherwise it's the width
	let scaleHeightForOptimalFit = false;
	if (attemptToScaleDown) {
		// attempt to scale the image according to the side which requires a smaller scaling factor
		if (optimalScaleHeight < optimalScaleWidth) { // check if for the optimal scale we need to adjust the height
			// Now compare the height scale to the configured height scale threshold.
			// As a reference use the image how it would look without the height scale but potentially width scale.
			let heightToCompare = size.h;
			if (attemptScaleDownWidth) {
				heightToCompare *= optimalScaleWidth;
			}
			// get the ratio between this image height to the screen height
			let heightWindowRatio = heightToCompare / screenHeight;
			// only scale height if we don't exceed our threshold
			scaleHeight = scaleHeightRatioThreshold > heightWindowRatio;
			scaleHeightForOptimalFit = true;
		} else {
			// The width needs more or equal scaling than the image height.
			// Now compare the width scale to the configured width scale threshold.
			// As a reference use the image how it would look without the width scale but potentially height scale.
			let widthToCompare = size.w;
			if (attemptScaleDownHeight) {
				widthToCompare *= optimalScaleHeight;
			}
			// get the ratio between this image width to the screen width
			let widthWindowRatio = widthToCompare / screenWidth;
			// only scale width if we don't exceed our threshold
			scaleWidth = scaleWidthRatioThreshold > widthWindowRatio;
			optimalScalingApplies = scaleWidth;
		}
	} else {
		// attempt to scale the image according to the side which requires a larger scaling factor
		if (optimalScaleHeight > optimalScaleWidth) { // check if for the optimal scale we need to adjust the height
			scaleHeight = attemptScaleUpHeight;
			scaleHeightForOptimalFit = true;
		} else {
			scaleWidth = attemptScaleUpWidth;
		}
	}
	
	if (!(scaleHeight || scaleHeight)) { // check if optimal scaling is suppressed
		// fallback: attempt to scale the other side
		if (scaleHeightForOptimalFit) {
			// attempt to scale width
			if (attemptScaleWidth) {
				let widthToCompare = size.w;
				// get the ratio between this image width to the screen width
				let widthWindowRatio = widthToCompare / screenWidth;
				// only scale width if we don't exceed our threshold
				scaleWidth = scaleWidthRatioThreshold > widthWindowRatio;
			}
			
		} else {
			// attempt to scale height
			if (attemptScaleHeight) {
				let heightToCompare = size.h;
				// get the ratio between this image height to the screen height
				let heightWindowRatio = heightToCompare / screenHeight;
				// only scale height if we don't exceed our threshold
				scaleHeight = scaleHeightRatioThreshold > heightWindowRatio;
			}
		}
	}
	
	let optimalScale = 1.0;
	if (scaleHeight) {
		optimalScale = optimalScaleHeight;
	} else if (scaleWidth) {
		optimalScale = optimalScaleWidth;
	}
	 
	if (optimalScale > maxScale) {
		optimalScale = maxScale;
	}
	
	var range = $("#imageSizeRange");
	range.attr('max', maxScale);
	range.css("display", "block");
	range.val(optimalScale);
	applyScaleToImg(range.val(), currentImg, size);
}

function applyScaleToImg(scale, currentImg, size) {
	let newImgWidth = size.w * scale;
	let newImgHeight = size.h * scale;
	let currentImgWidth = parseInt(currentImg.style.width, 10);
	let currentImgHeight = parseInt(currentImg.style.height, 10);
	let scaleDeltaHeight = newImgHeight / currentImgHeight;
	
	currentImg.style.width = newImgWidth + 'px';
	currentImg.style.height = newImgHeight + 'px';
	
	// center image
	let screenHeight = document.documentElement.clientHeight;
	if (newImgHeight < screenHeight) {
		let imgTopPos = (screenHeight / 2) - (newImgHeight / 2);
		currentImg.style.top = imgTopPos + 'px';
	} else {
		currentImg.style.top = 0 + 'px';
	}
	
	// adjust panning translation so the image remains visible when scaled down and was dragged down or up
	if (scaleDeltaHeight < 1) {
		pan.y *= scaleDeltaHeight;
		applyPanning();
	}
}

function resizeImage(event) {
	// change image size based on scroll event
	var range = $("#imageSizeRange");
	if (range.length) {
		var delta = event.originalEvent.wheelDelta/120 || -event.originalEvent.detail/3;
		range.val(range.val() - delta*0.04);
		range.change();
	}
}

function moveImageY(event) {
	// change image Y based on scroll event
	// move the image vertically if there is more to see in the scrolling direction
	let delta = event.originalEvent.wheelDelta/120 || -event.originalEvent.detail/3;
	let isScrollingUp = delta > 0;
	if ((isScrollingUp && isImgTopOutsideScreen()) || (!isScrollingUp && isImgBottomOutsideScreen())) {
		pan.y += delta * 50;
		applyPanning();
	}
}

function preloadImages() {
	preloadNextImages();
	preloadPreviousImages();
}

function preloadNextImages() {
	for (let i = 0; i < numberOfNextImgsToPreload; i++) {
		
		let nextImgInx = currentImageIndex + 1 + i;
		if (nextImgInx >= imagesToLoad.length) break;
		
        preloadedImages[i] = new Image();
        preloadedImages[i].src = imagesToLoad[nextImgInx].image;
    }
}

function preloadPreviousImages() {

	if (preloadedImages.length > 30) preloadedImages = [];
	let start = preloadedImages.length;
	
	for (let i = 0; i < numberOfPrevImgsToPreload; i++) {
		
		let prevImgInx = currentImageIndex - 1 - i;
		if (prevImgInx < 0) break;
		
        preloadedImages[start + i] = new Image();
        preloadedImages[start + i].src = imagesToLoad[prevImgInx].image;
    }
}

$(function() {
	$(modalNavCurrentEl).on('keydown', function(e) {
	  if (event.key == 'Enter') {
		event.preventDefault();
		let newImgInx = Number(modalNavCurrentEl.value);
		if (isNumber(newImgInx) && Number.isInteger(newImgInx) && newImgInx > 0 && newImgInx <= imagesToLoad.length && (newImgInx - 1) != currentImageIndex) {
			openImgDetailsView(--newImgInx);
		}
		e.target.blur();
	  }
	});
})


function closeImageView(event, forceClose) {

	if (event.target.id === 'modalImg') {
		return;
	}

	if (!forceClose && isEditingModalComponent()) return;

	$('#imageSizeRangeContainer').hide();
    modal.style.display = "none";
	
	hideImageSizeRange();
	if (customTagsDirty) {
		refreshSelectableTags();
		maybeRemovePreviewImg();
	}
	
	if (!isSidebarVisible())
		$('.sidebar-open-button').show();
	
	$('body').css('overflow', 'auto');
}

function isEditingModalComponent() {
	return isEditingNav() || isEditingTags();
}

function isEditingNav() {
	return activeElementHasId('modalNavCurrent');
}

// if a tag was removed, the image may not pass the currently selected filter criteria anymore
function maybeRemovePreviewImg() {
	// this is a nice to have self contained functionality, so an error should not impact other features
	try {
		let currImgData = imagesToLoad[currentImageIndex];
		// double check we got the right image
		if (currImgData && gallery.images[currentImageIndex] && currImgData.image === gallery.images[currentImageIndex].data.image) {
			if (!filterFunction([currImgData]).length) {
				gallery.remove(currentImageIndex);
				imagesToLoad.splice(currentImageIndex, 1);
				updateImgCountDisplay();
			}
		}
	} catch (e) {
		console.error('Failed to remove preview image after deleting a tag:');
		console.error(e, e.stack);
	}
}

function hideImageSizeRange() {
	var range = $("#imageSizeRange");
	if (range.length) {
		range.css('display','none');
	}
}

function syncGalleryWithImg(event) {
	event.stopPropagation();
	
	loadImages(currentImageIndex);
}


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

