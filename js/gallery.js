
function GalleryColumn(gallery, index) {
    var self = this;

    self.gallery = gallery;

    self.index = index;

    self.width = 0;

    self.left = 0;

    self.updateSize = function () {
        self.width = gallery.columnWidth;
    };

    self.updatePosition = function () {
        self.left = gallery.spacing + index * gallery.columnWidth + index * gallery.spacing;
    };

    return self;
};

function GalleryRow(gallery, index, relativeIndex) {
    var self = this;

    self.gallery = gallery;

    self.index = index;
    self.relativeIndex = relativeIndex;

    self.images = [];
    self.images.length = self.gallery.columnCount;

    return self;
};

function GalleryImage(gallery, data, index, relativeIndex) {
    var self = this;

    self.gallery = gallery;

    self.data = data;

    self.index = index;
    self.relativeIndex = relativeIndex;

    self.row = 0;
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


    self.updateRowAndColumn = function () {
        var column;
        var row;

        if (self.relativeIndex < 0 && (self.relativeIndex % self.gallery.columnCount) != 0) {
            column = self.gallery.columnCount + Math.floor(self.relativeIndex % self.gallery.columnCount);
        }
        else {
            column = Math.floor(self.relativeIndex % self.gallery.columnCount);
        }

        var row = Math.floor(self.relativeIndex / self.gallery.columnCount);

        self.setRowAndColumn(row, column);
    };

    self.setRowAndColumn = function (row, column) {
        self.row = row;
        self.column = column;

        self.gallery.getRowByRelativeIndex(self.row).images[column] = self;

        self.thumbnail.attr('x-gallery-position', self.row + ' ' + self.column);
    };

    self.updatePosition = function () {
        self.left = self.gallery.columns[self.column].left + self.gallery.spacing;

        var row = self.gallery.getRowByRelativeIndex(self.row);

        self.top = 0;

        if (row.relativeIndex < 0) {
            var nextRow = self.gallery.getRowByRelativeIndex(self.row + 1);
            if (nextRow && nextRow.images[self.column]) {
                self.top = (nextRow.images[self.column].top - self.data.previewSize.h) - self.gallery.spacing;
            }
        } else {
            if (row.relativeIndex > 0) {
                var prevRow = self.gallery.getRowByRelativeIndex(self.row - 1);
                if (prevRow && prevRow.images[self.column]) {
                    self.top = prevRow.images[self.column].top + prevRow.images[self.column].data.previewSize.h + self.gallery.spacing;
                }
            }
        }

        if (!self.loaded) {
            var startLeft = -self.data.previewSize.w;
            var startTop = -self.data.previewSize.h;

            if ((self.column / self.gallery.columnCount) >= 0.5) {
                startLeft = self.gallery.columnsContainer.width();
            }

            if (self.relativeIndex > 0) {
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

    self.rows = [];
    self.columns = [];

    self.rowCount = 0;
    self.columnCount = 0;

    self.container = (typeof options.container === 'string') ? $(options.container).first() : options.container;

    self.imageDatas = options.images;
    self.baseImageIndex = options.baseImageIndex || 0;

    self.columnWidth = options.columnWidth;
    self.spacing = options.spacing;

    self.min = 0;
    self.max = 0;


    self.imagesBeingLoaded = 0;

    self.loadInProgress = function () {
        return self.imagesBeingLoaded > 0;
    };


    self.imageOnLoadCallback = options.imageOnLoadCallback;
    self.imageOnErrorCallback = options.imageOnErrorCallback;



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
        self.images[i] = new GalleryImage(self, self.imageDatas[i], i, i - self.baseImageIndex);
    }


    self.getImage = function (index) {
        return self.images[index];
    };

    self.getImageByRelativeIndex = function (index) {
        return self.getImageByRelativeIndex(self.baseImageIndex + index);
    };

    self.getRowByRelativeIndex = function (index) {
        return self.rows[self.baseRowIndex + index];
    };


    self.forEachImage = function (callback) {
        for (var i = 0; i < self.images.length; ++i) {
            callback(self.images[i], i);
        }
    };

    self.forEachColumn = function (callback) {
        for (var i = 0; i < self.columns.length; ++i) {
            callback(self.columns[i], i);
        }
    };

    self.forEachRow = function (callback) {
        for (var i = 0; i < self.rows.length; ++i) {
            callback(self.rows[i], i);
        }
    };


    self.resize = function () {
        // Get width of the container (space for our columns)
        var containerWidth = self.columnsContainer.width();

        // Calculate the actual space available for columns (it excludes the left and right padding)
        var spaceForColumns = containerWidth - self.spacing * 2;

        self.columnCount = Math.max(1, Math.floor(spaceForColumns / (self.columnWidth + self.spacing)));
        self.rowCount = Math.max(1, Math.ceil(self.images.length / self.columnCount + Math.abs(self.baseImageIndex) % self.columnCount));

        self.baseRowIndex = Math.sign(self.baseImageIndex) * Math.ceil(Math.abs(self.baseImageIndex) / self.columnCount);

        self.columns = [];
        self.rows = [];

        for (var i = 0; i < self.columnCount; ++i) {
            self.columns.push(new GalleryColumn(self, i));
        }

        for (var i = 0; i < self.rowCount; ++i) {
            self.rows.push(new GalleryRow(self, i, i - self.baseRowIndex));
        }


        self.forEachImage(i => i.updateRowAndColumn());

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

        self.forEachImage(image => {
            if (image.loaded) {
                self.min = Math.min(image.top, self.min);
                self.max = Math.max(image.top + image.data.previewSize.h, self.max);
            }
        });

        self.applyMinMax();
    };

    self.onImageLoaded = function (image) {
        self.min = Math.min(image.top, self.min);
        self.max = Math.max(image.top + image.data.previewSize.h, self.max);

        self.applyMinMax();
    };

    self.applyMinMax = function () {
        var height = Math.abs(self.max - self.min);

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
