


function Gallery(options) {
    var self = this;

    self.options = options = { ...options };

    if (typeof options.container === 'string') {
        options.container = $(options.container).first();
    }

    self.images = [];

	self.options.container.empty();
    self.columnsContainer = $('<div>');
    self.columnsContainer.hide();
    self.columnsContainer.addClass('gallery-columns');

    options.container.append(self.columnsContainer);

    self.remove = function (index, count) {
        var removed = self.images.splice(index, count);

        for (var image of removed) {
            image.removed = true;
            image.thumbnail.remove();
        }

        self.resize();
    };
	
	self.bind = function (evtName, callback) {
		options.container.bind(evtName, callback);
	}
	
	self.getDataLength = function () {
		return self.images.length;
	}

    self.lastLoaded = function () {
        for (var i = self.images.length - 1; i >= 0; --i) {
            if (self.images[i].loaded)
                return self.images[i];
        }

        return null;
    };
	
	self.pushAll = function (images) {
		for (var image of images) {
			self.push(image, true);
		}
	}

    self.push = function (image, init) {
        image = {
            ...image,
            index: self.images.length,
            thumbnail: $('<div>'),
            loaded: false
        };

        var lastLoaded = self.lastLoaded();

        if (lastLoaded) {
            image.thumbnail.css({
                left: lastLoaded.left + 'px',
                top: lastLoaded.top + 'px'
            });
        }

        if (!init)
            image.column = image.index % self.columns;

        image.thumbnail.addClass('gallery-thumb');
        image.thumbnail.css({ 'visibility': 'hidden' });

        self.images.push(image);

        var img = document.createElement('img');

        $(img).addClass('gallery-thumb-img');

        img.onload = function () {
            if (image.removed)
                return;

            image.thumbnail.css({ 'visibility': 'visible' });

            image.loaded = true;

            self.position(image);
			
			options.container.trigger('previewImgLoaded', [image, img]);
        };

        img.src = image.thumb;

        image.thumbnail.append(img);

        self.columnsContainer.append(image.thumbnail);
    };

    self.position = function (image) {
        var l = self.getColumnLeft(image.column);
        var t = 0;

        if (image.index >= self.columns) {
            var prevImageInColumn = self.images[image.index - self.columns];

            t = prevImageInColumn.top + prevImageInColumn.thumbnail.height() + options.spacing;
        }

        if (l !== image.left || t !== image.top) {
            image.left = l;
            image.top = t;

            image.thumbnail.css({
                left: l + 'px',
                top: t + 'px'
            });
        }

        var nextImage = self.images[image.index + 1];

        if (nextImage && nextImage.loaded) {
            setTimeout(() => {
                self.position(nextImage);
            });
        }
    };

    self.resize = function () {
        var containerWidth = self.columnsContainer.width();

        var spaceForColumn = containerWidth - options.spacing * 2;

        var columns = Math.floor(spaceForColumn / options.columnWidth);

        self.columns = columns;

        for (var i = 0; i < self.images.length; ++i) {
            var image = self.images[i];

            image.index = i;
            image.column = image.index % columns;
        }

        if (self.images.length > 0 && self.images[0].loaded)
            self.position(self.images[0]);
    };

    self.getColumnLeft = function (column) {
        return options.spacing + column * options.columnWidth + column * options.spacing;
    };

	self.pushAll(options.images);

    self.columnsContainer.show();

    setTimeout(() => {
        self.resize();
    }, 1);

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