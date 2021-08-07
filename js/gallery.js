
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
			self.thumbnail.attr('x-gallery-column', self.column + ' ' + newColumnObj.height);
        }
    };

    self.updatePosition = function () {
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

        if (!self.loaded) {
            var startLeft = -self.data.previewSize.w;
            var startTop = -self.data.previewSize.h;

            if ((self.column / self.gallery.columnCount) >= 0.5) {
                startLeft = self.gallery.columnsContainer.width();
            }

            if (!self.isAddedToTop()) {
                startTop = self.gallery.columnsContainer.height();
            }

            self.thumbnail.css({
                left: startLeft + 'px',
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

        self.updatePosition();

        var loaded = function (error) {
            self.thumbnail.css({ 'visibility': 'visible' });

            self.loading = false;
            self.loaded = true;
            self.error = error;

            self.gallery.imagesBeingLoaded--;

            self.updatePosition();

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

        self.forEachImage(i => i.updatePosition());


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
        var fullHeight = Math.abs(self.fullMax - self.fullMin);

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
