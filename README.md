# Gallery

Free gallery template website: TODO

This repository contains the website code as well as a small app to create a file which tells the website about the images to display.

The gallery is a simple single page app made with javascript and html. The preview images are displayed with fixed width and scaled height. 
The gallery features lazy loading of new preview images while scrolling down, image rating, bookmarking, adding custom tags, sorting and filtering of images. Data is persisted into the local storage of the browser.

Feel free to copy and modify as needed.

## Load Images
The images are defined in a JSON file imageData.js loaded by index.html as a script.
Start by replacing the images referenced in imageData.js with your own images. In addition to the image path there are several other fields used by the gallery website to display the image:

```json
 {
    "thumb":"images/fred-moon-2DnRQ5IZFZo-unsplashPreview230px.jpg",
    "image":"images/fred-moon-2DnRQ5IZFZo-unsplash.jpg",
    "size":{  
       "w":4000,  
       "h":6000  
    },  
    "previewSize":{
       "w":230,
       "h":345
    },
    "title":"fred-moon-2DnRQ5IZFZo-unsplash.jpg", 
    "timestamp":1626545342528,
    "createdDate":"17/07/2021 19:09:02",
    "tags":"snow,cold night,trees",
    "categories":"nature"  
 }
```

Explanation of the fields:  
>   thumb: path to the smaller preview image displayed in the gallery  
>   image: path to the full image displayed in the details view after selecting an image from the gallery  
>   size: width and height of the full image in pixels  
>   previewSize: width and height of the preview image in pixels  
>   title: image title  
>   timestamp: createdDate as an UNIX timestamp used for sorting and filtering  
>   createdDate: timestamp in a human readable format  
>   tags: the comma separated image tags (value can be blank)  
>   categories: image category (value can be blank)  

All fields are mandatory but the value can be left blank in case of tags and categories.

## C# Console App
The imageData.js file can be created by a C# app which parses all sub-directories for images from the directory the executable was placed in.
The supported image formats are jpeg/jpg, png and gif.
Detailed instructions appear when starting the console app.
In essence, it creates preview images by downscaling the originals and stores the image paths in imageData.js. 
In addition, it adds metadata like tags, categories, dates to the output file, which the website allows to filter and sort by.
When new pictures are added, the app generates the missing preview images only and adds them to the file which then needs to be uploaded to the webserver to replace the old file.

## Use of Local Storage
The gallery template persists image rating, filter / search settings and user defined tags in the local storage of the browser after the user has given consent.

## Tags and Categories
Each image allows to be grouped by multiple tags and categories which can be filtered by.
Even though multiple categories can be added to a single image in imageData.js, the sidebar only allows to select a single category for filtering.
This reflects the nature of categories, which are often hierarchically organised with sub categories being included in parent categories. So it makes sense to select either the parent or the child category.
The console app uses the directory hierarchy to categorise the images.

Tags on the other hand, are defined for each image individually. For jpeg files the 'tags' image property is parsed by the C# app. 
In addition, each directory containing images may contain a file called tags.txt in the format:
imageName1.jpeg:myTag1,myTag2
imageName2.png:myTag1,myTag2,myTag3
This is to support tagging image file types like png which do not support the tags property.
Tags can be used to narrow down a selection of images which otherwise fall into multiple sub-categories while the parent category is being too broad.

The category and tag filter can be combined in two ways:
1. The image must match all selected tags AND the selected category
2. The image must match all selected tags OR the selected category
imageName1.jpeg:tag1,tag2
imageName2.png:tag1,tag2,tag3

## Resources Used
- Bootstrap: https://getbootstrap.com/
- jQuery: https://jquery.com/
- Images used from: https://unsplash.com/, https://nasa.gov and https://giphy.com
- Bootstrap theme: https://github.com/thomaspark/bootswatch (demos: https://bootswatch.com/superhero/)
- Multiselect: https://developer.snapappointments.com/bootstrap-select/
- Sidebar: https://www.codeply.com/go/3e0RAjccRO/bootstrap-4-collapsing-sidebar-menu
- Local Storage consent banner: https://github.com/Wruczek/Bootstrap-Cookie-Alert

## Release Process
This is the procedure to create a new release after changing javascript files.

1. any new JS scripts need to be added to the combine scripts in the 'js' directory
2. combine all custom JS scripts into a single file by executing the combine.bat script
3. minify the result 'combined.js' to 'combined.min.js' using e.g. https://javascript-minifier.com/
4. change the scripts import in index.html to import combined.min.js
