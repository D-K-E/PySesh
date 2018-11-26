// author: Kaan Eraslan

/* assumed layout of the project

   - interface.html
     - css
       - style.css
     - js
       - widget.js
     - images
       - *.jpg, *.png, etc

     - icons
       - *.svg, etc

     - ressources
       -uml design

 */

// Utils funcs

function isOdd(nb){
    var res = nb % 2;
    return res === 1;
}

function deepcopy(obj){
    // deep copy with json.stringify and parse
    var objstr = JSON.stringify(obj);
    var objJson = JSON.parse(objstr);
    return objJson;
}

function generateUUID() { // Public Domain/MIT
    /*
      taken from stackoverflow.com
      https://stackoverflow.com/a/8809472/7330813
      author: Briguy37
     */

    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

// CanvasRelated object regrouping
// methods related to drawing and keeping track of the
// objects on the canvas
/*

  There are 3 drawing events:

  1. User is selecting a certain area:
      - Draw previously detected regions and selection (redraw + drawing)
      - Draw only currently added selections and selection (redraw + drawing)
      - Draw both and selection (redraw + redraw + drawing)
      - Draw only selection (drawing)
  2. User is looking for a region (redraw):
      - Draw bounding box of the previously detected region (redraw event)
      - Draw bounding box of the previously detected + selected region (redraw)
      - Draw bounding box of the previously detected + selected region (redraw)
  3. User is transcribing a certain line:
      - Draw bounding box on the currently transcribing area on canvas (redraw)
      - Draw the area on a small canvas on top of transcription area

  Transcriptions objects should be emphasized based not on detections
  but on a global object list that includes drawn objects and detections
  maybe they should be added directly to drawn objects
  thus requiring them to be geojson feature right from the start

 */

var Interface = function(viewer,
                         transcriber,
                         imageList,
                         eventHandlerInterface){
    var obj = Object.create(Interface.prototype);
    this.viewer = viewer;
    this.transcriber = transcriber;
    this.imageList = imageList;
    this.interfaceEventHandler = eventHandlerInterface;
    return obj;
};

var ImageListWidget = function(){
    var obj = Object.create(ImageListWidget.prototype);

    this.images = [];

    obj.image = {"src" : "",
                 "node" : "",
                 "index" : ""};
    return obj;
};

ImageListWidget.prototype.getImages = function(){
    // get images that are present in the interface
    var imlist = document.getElementById('image-list');
    var imageTags = imlist.getElementsByClassName("thumbnail-images");
    var images = [];
    for (var i=0; i<imageTags.length; i++){
        var img = imageTags[i];
        var image = {"src" : img.getAttribute("src"),
                     "node" : img.cloneNode(true),
                     "index" : img.getAttribute("id")};
        images.push(image);
    }
    this.images = images;
};

ImageListWidget.prototype.setWithPrefix = function(prefix,  // char
                                                   element,  // tag
                                                   separator, // char
                                                   attr,  // char
                                                   suffix  // char
                                                  ){
    var val = prefix.concat(separator);
    val = val.concat(suffix);
    element.setAttribute(attr, val);
    return element;
};

ImageListWidget.prototype.createImageLink = function(imageIndex){
    // image link
    var imlink = document.createElement('a');
    imlink = this.setWithPrefix("link-page",
                                imlink,
                                '-',
                                'id',
                                imageIndex);
    imlink.setAttribute('class', 'image-link');
    return imlink;
};

ImageListWidget.prototype.prepImageTag = function(image){
    // prepare the image tag
    var imageIndex = image.getAttribute('id');
    image = this.setWithPrefix("image of page",
                               image, ' ',
                               'alt',
                               imageIndex);

    image = this.setWithPrefix('image-page',
                               image,
                               '-',
                               'id',
                               imageIndex);

    image.setAttribute("class", "thumbnail-images");
    image.setAttribute("draggable", "false");

    return image;
};

ImageListWidget.prototype.createParagraph = function(imageIndex){
    // Paragraph with image information
    var parag = document.createElement("p");
    var txt = 'Page '.concat(imageIndex);
    var tnode = document.createTextNode(txt);
    parag.appendChild(tnode);
    return parag;
};

ImageListWidget.prototype.addImage2List = function(image){
    // add a given image to image list
    // 3 steps:
    // create dom elements that would hold the image
    // wire them together
    // create newimage object and add it to images
    var fncthis = this;
    var imlist = document.getElementById('image-list');
    var listel = document.createElement('li');
    listel.setAttribute("class", "image-element");
    var imIndx = image.getAttribute("id");

    var parag = fncthis.createParagraph(imIndx);
    var imlink = fncthis.createImageLink(imIndx);

    // modify image
    var imtag = fncthis.prepImageTag(image);

    listel.appendChild(imlink);
    imlink.appendChild(imtag);
    imlink.appendChild(parag);
    imlist.appendChild(listel);

    var newimage = {"src" : imtag.getAttribute("src"),
                    "node" : imtag.cloneNode(true),
                    "index" : imtag.getAttribute("id")};
    console.log(this);
    this.images.push(newimage);
};
//=> null

ImageListWidget.prototype.passImage2Viewer = function(event,
                                                      viewer){
    // Obtain the image and pass it to the viewer
    var imtag = event.target;
    console.log(imtag);
    viewer.image['data'] = imtag;
    // viewer.reset
    return imtag;
};

ImageListWidget.prototype.getImageFile = function(){
    // obtain image file from file input
    var imtag = document.createElement("img");
    var iminput = document.getElementById("image-file-input");
    var reader = new FileReader();
    var imfile = iminput.files[0];
    reader.onload = function(){
        // imtag.src = reader.result;
        var fdata = reader.result;
        imtag.setAttribute('src', fdata);
        //
    };

    //
    if (imfile){
        reader.readAsDataURL(imfile);
    }
    var imname = imfile.name;
    imname = imname.replace(' ', '-');
    imtag.setAttribute('data-id', generateUUID());
    imtag.setAttribute('id', imname);

    return imtag;
};

var CanvasRelated = function() {
    var obj = Object.create(CanvasRelated.prototype);

    // checks
    obj.inhover = false;
    obj.originalSize = false; // load the image in its original size
    obj.mousePressed = false; // mouse is pressed or not
    obj.inMouseUp = false; // inside the mouse up event
    obj.outOfBounds = false;
    obj.debug = false;

    // selector options
    obj.selectorOptions = {};
    obj.selectorOptions.type = "";
    obj.selectorOptions.strokeColor = "";
    obj.selectorOptions.fillColor = "";
    obj.selectorOptions.fillOpacity = "";

    // selector types
    obj.poly = {"pointlist" : [
        // {x:0, y:1, x_real:20, y_real:50};
    ],
                "id" : "",
                "shape" : "polygon",
                "regionType" : "",
                "hratio" : "",
                "vratio" : "",
                "fillColor" : "",
                "strokeColor" : "",
                "fillOpacity" : "",
                "imageSessionId" : ""};
    obj.rect = {"x1" : "",
                "shape" : "rectangle",
                "regionType" : "",
                "y1" : "",
                "x1_real" : "",
                "y1_real" : "",
                "width" : "",
                "width_real" : "",
                "height" : "",
                "height_real" : "",
                "imageSessionId" : "",
                "hratio" : "",
                "vratio" : "",
                "fillColor" : "",
                "strokeColor" : "",
                "fillOpacity" : "",
                "id" : ""};

    // detections
    obj.detections = {"type" : "FeatureCollection",
                      "features" : []};

    // detection options
    obj.detectionOptions = {};
    obj.detectionOptions.strokeColor = "";
    obj.detectionOptions.fillColor = "";
    obj.detectionOptions.fillOpacity = "";

    // image related
    obj.image = {};
    obj.image["id"] = "";
    obj.image["sessionId"] = "";
    obj.image["name"] = "";
    obj.image["data"] = {};

    var pageImage;
    obj.image.pageImage = pageImage;
    obj.image.xcoord = 0;
    obj.image.ycoord = 0;
    var shiftx;
    var shifty;

    obj.image.shiftx = shiftx;
    obj.image.shifty = shifty;
    obj.image.hratio = 1;
    obj.image.vratio = 1;
    obj.image.ratio = 1;

    // current selection
    // For storing hovering rectangle that represents the detected line
    obj.image.hoveringRect = {
        "y1" : "",
        "x1" : "",
        "x2" : "",
        "y2" : "",
        "width" : "",
        "height" : "",
        "hratio": "",
        "vratio" : "",
        "y1_real" : "",
        "x1_real" : "",
        "y2_real" : "",
        "x2_real" : "",
        "width_real" : "",
        "height_real" : ""
    };

    // Drawn object stacks
    obj.drawnObject = {}; // stores last drawn object
    obj.drawnObjects = {"type" : "FeatureCollection",
                        "features" : []};
    //
    return obj;
};
// --------- Canvas Related methods ----------
// hide/show spc+m+z+e
// show all spc+m+z+r
// hide all spc+m+z+F

//---------- Loading image correctly to canvas -------
CanvasRelated.prototype.getScaleFactor = function(destWidth,
                                                  destHeight,
                                                  srcWidth,
                                                  srcHeight) {
    // Get scale factor for correctly drawing rectangle
    if(debug === true){
        console.log("in get scale factor");
    }
    var hratio = destWidth / srcWidth;
    var vratio = destHeight / srcHeight;
    var ratio = Math.min(hratio, vratio);
    if(debug === true){
        console.log("hratio");
        console.log(hratio);
        console.log("vratio");
        console.log(vratio);
        console.log("ratio");
        console.log(ratio);
    }
    //
    return [hratio, vratio, ratio];
}; // DONE
CanvasRelated.prototype.clearScene = function(){
    /*
      Remove image from scene
    */
    if(debug === true){
        console.log("in clear scene");
    }
    var scene = document.getElementById("scene");
    var context = scene.getContext("2d");
    context.clearRect(0,0, scene.width, scene.height);
    // scene.setAttribute("width", "100%");
    // scene.setAttribute("height", "100%");
    return;
}; // DONE
CanvasRelated.prototype.imageLoad = function(){
    /*
      Load the page image to the canvas
      with proper scaling and store
      the scaling ratios for drawing rectangles afterwards
      Empty drawn objects

    */
    // remove existing image with all of its elements
    if(debug === true){
        console.log("in imageLoad");
    }
    this.clearScene();
    if(debug === true){
        console.log("scene cleared");
    }

    // get id from the image tag
    var imtag = this.image['data'];
    var imSessionId = imtag.getAttribute("data-id");
    var imDomId = imtag.getAttribute("id");
    // imname = imname.replace("image-","");
    this.image["id"] = imDomId;
    this.image["sessionId"] = imSessionId;
    this.image['name'] = imDomId;  // for an image uploaded by user
    if(debug === true){
        console.log("image id obtained");
        console.log("image id");
        console.log(imDomId);
    }

    // get img tag with id
    this.image.pageImage = imtag.cloneNode(true);
    if(debug === true){
        console.log("image obtained from id");
        console.log(imtag);
    }

    // set the image width and height to
    // scene, image tag, and rect element
    var imwidth = imtag.naturalWidth;
    var imheight = imtag.naturalHeight;
    if(debug === true){
        console.log("image natural height");
        console.log(imheight);
        console.log("image natural width");
        console.log(imwidth);
    }

    // get canvas and context
    var scene = document.getElementById("scene");
    console.log(scene.width);
    console.log(scene);
    var context = scene.getContext("2d");

    // set image according to parent div
    if(this.originalSize === false){
        if(debug === true){
            console.log("in canvas parent size branch");
        }
        // Set canvas width and height
        var imcol = document.getElementById("image-col");
        var parwidth = imcol.clientWidth;
        var parheight = imcol.clientHeight;
        if(debug === true){
            console.log("parent client width");
            console.log(parwidth);
            console.log("parent client height");
            console.log(parheight);
        }

        // get correct ratios for display
        var ratiolist = this.getScaleFactor(parwidth,
                                            parheight,
                                            imwidth,
                                            imheight);
        if(debug === true){
            console.log("image ratio list");
            console.log(ratiolist);
        }
        this.image.hratio = ratiolist[0];
        this.image.vratio = ratiolist[1];
        this.image.ratio = ratiolist[2];
        var ratio = ratiolist[2];
    }else{
        if(debug === true){
            console.log("in original size branch");
        }
        // get correct ratios for display
        var ratiolist = this.getScaleFactor(imwidth,
                                            imheight,
                                            imwidth,
                                            imheight);
        if(debug === true){
            console.log("image ratio list");
            console.log(ratiolist);
        }
        this.image.hratio = ratiolist[0];
        this.image.vratio = ratiolist[1];
        this.image.ratio = ratiolist[2];
        var ratio = ratiolist[2];
    }
    var scaledWidth = ratio * imwidth;
    var scaledHeight = ratio * imheight;
    scene.setAttribute("width", scaledWidth);
    scene.setAttribute("height", scaledHeight);
    if(debug === true){
        console.log("scaled image width");
        console.log(scaledWidth);
        console.log("scaled image height");
        console.log(scaledHeight);
    }
    context.drawImage(imtag, // image
                      0,0, // coordinate source
                      imwidth, // source width
                      imheight, // source height
                      // 0,0, // coordinate destination
                      // scaledWidth, // destination width
                      // scaledHeight // destination height
                     );
    if(debug === true){
        console.log("image drawn to context");
    }
    return;
}; // DONE
// ----------- General Drawing Methods -------------

// ----------- Create Identifiers for the Drawers ---
CanvasRelated.prototype.setRectId = function(){
    // Sets the id field for the current rectangle
    var rectlist = [];
    for(var i=0; i<this.drawnObjects["features"].length; i++){
        //
        var drawObj = this.drawnObjects["features"][i];
        if(drawObj["properties"]["selectorType"] === "rectangle"){
            rectlist.push(drawObj);
        }
    }
    var rectid = rectlist.length;
    rectid = "rect-".concat(rectid);
    this.rect.id = rectid;
    return;
}; // TODO: debugging code
CanvasRelated.prototype.setPolyId = function(){
    // Sets the id field for the current rectangle
    var polylist = [];
    for(var i=0; i<this.drawnObjects["features"].length; i++){
        //
        var drawObj = this.drawnObjects["features"][i];
        if(drawObj["properties"]["selectorType"] === "polygon"){
            polylist.push(drawObj);
        }
    }
    var polyid = polylist.length;
    polyid = "poly-".concat(polyid);
    this.poly.id = polyid;
    return;
}; // TODO: debugging code
CanvasRelated.prototype.setDisplayProperty = function(propertyName,
                                                      detection){
    
    var propertyValue;
    if(detection["properties"]["displayRelated"].hasOwnProperty(propertyName)){
        propertyValue = detection[propertyName];
    }else{
        propertyValue = this.detectionOptions[propertyName];
    }
    return propertyValue;
};
// => propertyValue / null

// ----------- Drawing Methods ----------------------
CanvasRelated.prototype.drawRectangle = function(mouseX2, // destination x2
                                                 mouseY2, // destination y2
                                                 hratio,  // horizontal ratio
                                                 vratio,  // vertical ratio
                                                 context, // drawing context
                                                 rectUpdate // drawer object
                                                ){
    // draw rectangle to context
    // get rectangle width
    var x1coord = rectUpdate["x1"];
    var y1coord = rectUpdate["y1"];
    var rectW = Math.abs(mouseX2 - x1coord);
    var rectH = Math.abs(mouseY2 - y1coord);

    // get real coordinate values
    var x_real = x1coord / hratio;
    var y_real = y1coord / vratio;

    // get real coordinate of mouseX2 and mouseY2
    var mouseX2Trans = mouseX2 / hratio;
    var mouseY2Trans = mouseY2 / vratio;

    // get real width
    var width_real = Math.floor(mouseX2Trans - x_real);
    var height_real = Math.floor(mouseY2Trans - y_real);

    // Update rect object with the known values
    //
    rectUpdate["y2"] = mouseY2;
    rectUpdate["x2"] = mouseX2;
    //
    rectUpdate["width"] = rectW;
    rectUpdate["height"] = rectH;
    //
    rectUpdate["hratio"] = hratio;
    rectUpdate["vratio"] = vratio;
    rectUpdate["ratio"] = Math.min(hratio, vratio);
    //
    rectUpdate["x1_real"] = Math.floor(x_real);
    rectUpdate["y1_real"] = Math.floor(y_real);
    //
    rectUpdate["x2_real"] = mouseX2Trans,
    rectUpdate["y2_real"] = mouseY2Trans;
    //
    rectUpdate["width_real"] = width_real;
    rectUpdate["height_real"] = height_real;

    // draw object
    context.beginPath();
    context.rect(x1coord,
                 y1coord,
                 rectW,
                 rectH);
    context.stroke();
    context.fill();
    context.closePath();
    return context;
}; // TODO: debugging code
// => context

CanvasRelated.prototype.drawPolygon = function(mouseX2, // destination x2
                                               mouseY2, // destination y2
                                               hratio,  // horizontal ratio
                                               vratio,  // vertical ratio
                                               context, // drawing context
                                               polyUpdate, // drawer object
                                               closeCheck // boolean for closing poly
                                              ){
    // Draw polygon on context

    // get real coordinate of mouseX2 and mouseY2
    var mouseX2Trans = mouseX2 / hratio;
    var mouseY2Trans = mouseY2 / vratio;

    // create point object
    var point = {};
    point["x"] = mouseX2;
    point["y"] = mouseY2;
    point["x_real"] = mouseX2Trans;
    point["y_real"] = mouseY2Trans;

    // add point to pointlist
    var pointlist = polyUpdate["pointlist"];
    pointlist.push(point);
    polyUpdate["hratio"] = hratio;
    polyUpdate["vratio"] = vratio;
    polyUpdate["pointlist"] = pointlist;
    context.beginPath();
    for(var p=0; p+1 < pointlist.length; p++){
        var pointA = pointlist[p];
        var pointB = pointlist[p+1];
        context.moveTo(pointA.x, pointA.y);
        context.lineTo(pointB.x, pointB.y);
    }
    if(closeCheck === true){
        var firstPoint = pointlist[0];
        context.lineTo(firstPoint.x, firstPoint.y);
    }
    context.closePath();
    context.stroke();
    context.fill();
    return context;
}; // TODO: debug code
// => context

CanvasRelated.prototype.drawPolygonFill = function(context, // drawing context
                                                   polyObj // drawer object
                                                  ){
    // Drawn polygon with color fill
    var points = polyObj["pointlist"];
    var fillColor = polyObj["fillColor"];
    var strokeColor = polyObj["strokeColor"];
    var fillOpacity = polyObj["fillOpacity"];

    // set context style
    var rgbastr = "rgba(";
    rgbastr = rgbastr.concat(fillColor); // rgb value ex: 255,0,0
    rgbastr = rgbastr.concat(",");
    rgbastr = rgbastr.concat(fillOpacity);
    rgbastr = rgbastr.concat(")");
    context.fillStyle = rgbastr;
    var rgbstr = "rgb(" + strokeColor + ")";
    context.strokeStyle = rgbstr;

    // draw polygon
    var firstPoint = points[0];
    context.beginPath();
    context.moveTo(firstPoint.x, firstPoint.y);
    for(var p=0; p < points.length; p++){
        var point = points[p];
        context.lineTo(point.x, point.y);
    }
    context.lineTo(firstPoint.x, firstPoint.y);
    context.closePath();
    context.stroke();
    context.fill();
    return context;
}; // TODO: debug code
// => context

CanvasRelated.prototype.drawSelection = function(event){
    // drawing event manager
    if(debug === true){
        console.log("in draw selection");
    }
    // get scene and context for drawing
    var scene = document.getElementById("scene");
    var context = scene.getContext("2d");

    if(this.mousePressed === false){
        return context;
    }
    if(debug === true){
        console.log("mouse is pressed");
    }
    if(debug === true){
        console.log("selection in process");
    }
    // clear scene
    this.clearScene();
    if(debug === true){
        console.log("scene clear");
    }
    // redraw the page image
    context = this.redrawImage(this.image["id"],
                               this.image.ratio,
                               context);
    if(debug === true){
        console.log("image redrawn");
    }
    // get the offset for precise calculation of coordinates
    var parentOffsetX = scene.offsetLeft;
    var parentOffsetY = scene.offsetTop;

    // compute the coordinates for the selection
    var x2coord = parseInt(event.layerX - parentOffsetX, 10);
    var y2coord = parseInt(event.layerY - parentOffsetY, 10);

    // ratio
    var hratio = this.image["hratio"];
    var vratio = this.image["vratio"];
    var ratio = this.image["ratio"];

    // set context style options
    // set context stroke color
    var strokeColor = this.selectorOptions.strokeColor;
    var fillColor = this.selectorOptions.fillColor;
    var fillOpacity = this.selectorOptions.fillOpacity;

    if(fillColor === ""){
        fillColor = "50,50,50";
        this.selectorOptions.fillColor = fillColor;
    }
    if(fillOpacity === ""){
        fillOpacity = "0.1";
        this.selectorOptions.fillOpacity = fillOpacity;
    }
    if(strokeColor === ""){
        strokeColor = "0,0,0";
        this.selectorOptions.strokeColor = strokeColor;
    }

    var rgbstr = "rgb(" + this.selectorOptions.strokeColor + ")";
    context.strokeStyle = rgbstr;

    // prepare rgba string for fill style. ex: rgba(255,0,0,0.4)
    var rgbastr = "rgba(";
    rgbastr = rgbastr.concat(this.selectorOptions.fillColor);
    // rgb value ex: 255,0,0
    rgbastr = rgbastr.concat(",");
    rgbastr = rgbastr.concat(this.selectorOptions.fillOpacity);
    rgbastr = rgbastr.concat(")");
    context.fillStyle = rgbastr;

    //
    if(debug === true){
        console.log("context set");
    }
    // draw object based on the selector type
    var seltype = this.selectorOptions.type;
    if(seltype === "polygon-selector"){
        // save context style options to drawn object
        if(debug === true){
            console.log("in polygon drawing process");
        }
        this.poly = this.setContextOptions2Object(this.poly,
                                                  this.selectorOptions.strokeColor,
                                                  this.selectorOptions.fillColor,
                                                  this.selectorOptions.fillOpacity);
        if(debug === true){
            console.log("in polygon context set");
        }
        // draw the object
        context = this.drawPolygon(x2coord, y2coord,
                                   ratio, ratio,
                                   context,
                                   this.poly,
                                   this.inMouseUp);

        if(debug === true){
            console.log("polygon drawn");
            console.log("current poly state");
            console.log(this.poly);
        }
        this.drawnObject = this.poly;
        if(debug === true){
            console.log("current drawn object state");
            console.log(this.drawnObject);
        }
    }else if(seltype === "rectangle-selector"){
        // save context style options to drawn object
        if(debug === true){
            console.log("in rect drawing process");
        }
        this.rect = this.setContextOptions2Object(this.rect,
                                                  this.selectorOptions.strokeColor,
                                                  this.selectorOptions.fillColor,
                                                  this.selectorOptions.fillOpacity);
        if(debug === true){
            console.log("in rect context set");
            console.log(this.rect);
        }
        // draw the object
        context = this.drawRectangle(x2coord,
                                     y2coord,
                                     ratio,
                                     ratio,
                                     context,
                                     this.rect);
        if(debug === true){
            console.log("rect drawn");
            console.log("current rect state");
            console.log(this.rect);
        }
        this.drawnObject = this.rect;
        if(debug === true){
            console.log("current drawn object state");
            console.log(this.drawnObject);
        }
    }
    return [context, this.drawnObject];
};
// => [context, this.drawnObject]

CanvasRelated.prototype.drawDetection = function(detection, context){
    // draw detection based on its region type

    var fillColor, fillOpacity, strokeColor;
    var functhis = this;
    fillColor = functhis.setDisplayProperty("fillColor", detection);
    fillOpacity = functhis.setDisplayProperty("fillOpacity", detection);
    strokeColor = functhis.setDisplayProperty("strokeColor", detection);

    // set context style
    if(fillColor === ""){
        fillColor = "50,50,50";
        this.detectionOptions.fillColor = fillColor;
    }
    if(fillOpacity === ""){
        fillOpacity = "0.1";
        this.detectionOptions.fillOpacity = fillOpacity;
    }
    if(strokeColor === ""){
        strokeColor = "0,0,0";
        this.detectionOptions.strokeColor = strokeColor;
    }
    context.strokeStyle = "rgb(" + strokeColor + ")";

    var rgbastr = "rgba(";
    // console.log("strokestyle");
    // console.log(this.detectionOptions.strokeColor);
    rgbastr = rgbastr.concat(fillColor); // rgb value ex: 255,0,0
    rgbastr = rgbastr.concat(",");
    rgbastr = rgbastr.concat(fillOpacity);
    rgbastr = rgbastr.concat(")");
    context.fillStyle = rgbastr;

    // set display related properties to detection object
    detection["properties"]["displayRelated"]["fillColor"] = fillColor;
    detection["properties"]["displayRelated"]["fillOpacity"] = fillOpacity;
    detection["properties"]["displayRelated"]["strokeColor"] = strokeColor;

    var ratio = detection["properties"]["displayRelated"]["drawingRatio"];
    if(detection["properties"]["regionShape"] === "rectangle"){
        var width = detection["properties"]["interfaceCoordinates"]["width_real"] * ratio;
        var height = detection["properties"]["interfaceCoordinates"]["height_real"] * ratio;
        var x1 = detection["properties"]["interfaceCoordinates"]["x1_real"] * ratio;
        var y1 = detection["properties"]["interfaceCoordinates"]["y1_real"] * ratio;
        detection["properties"]["interfaceCoordinates"]["x1"] = x1;
        detection["properties"]["interfaceCoordinates"]["y1"] = y1;
        detection["properties"]["interfaceCoordinates"]["width"] = width;
        detection["properties"]["interfaceCoordinates"]["height"] = height;
        context = this.redrawRectObj(context, detection);
    }else if(detection["properties"]["regionShape"] === "polygon"){
        context = this.redrawPolygonObj(context, detection);
    }

    return [context, detection];
};
// => [context, detection]

// Draw Line Bounding Boxes
CanvasRelated.prototype.drawDetectionBounds = function(event){
    // makes the line bounding box
    // visible if the mouse is
    // in its coordinates
    if(this.mousePressed === true){
        return context;
    }
    if(debug === true){
        console.log("mouse is pressed");
    }
    if(debug === true){
        console.log("selection in process");
    }
    this.clearScene();
    var imcanvas = document.getElementById("scene");
    var context = imcanvas.getContext('2d');

    var canvasOffsetX = imcanvas.offsetLeft;
    var canvasOffsetY = imcanvas.offsetTop;
    context = this.redrawImage(this.image["id"],
                               this.image.ratio,
                               context);
    // ratio
    var hratio = this.image["hratio"];
    var vratio = this.image["vratio"];
    var ratio  = this.image["ratio"];

    var mouseX2 = parseInt(event.layerX - canvasOffsetX);
    var mouseY2 = parseInt(event.layerY - canvasOffsetY);

    var mouseX2Trans = mouseX2 / ratio;
    var mouseY2Trans = mouseY2 / ratio;

    var funcThis = this;
    var detection =  funcThis.getDetectionBound(mouseX2Trans,
                                                mouseY2Trans);
    if(debug === true){
        console.log("in bounds");
        console.log(detection);
    }
    var contextDetectionList = funcThis.drawDetection(detection, context);
    // set context style options
    // set context stroke color
    context = contextDetectionList[0];
    detection = contextDetectionList[1];

    return [context, detection];
}; // TODO debug code
// => [context, detection]

// -------------- Redrawing Methods -------------------
CanvasRelated.prototype.redrawImage = function(imageDomId, // image identifer
                                               ratio, // ratio for canvas
                                               context // drawing context
                                              ){
    // Redraw an already loaded image to canvas
    // get img tag with id
    var imtag = document.getElementById(imageDomId);

    // set the image width and height to
    // scene, image tag, and rect element
    var imwidth = imtag.naturalWidth;
    var imheight = imtag.naturalHeight;

    // get scaled width and height
    var scaledWidth = ratio * imwidth;
    var scaledHeight = ratio * imheight;

    // draw the image to context
    context.beginPath();
    context.drawImage(imtag, // image
                      0,0, // coordinate source
                      imwidth, // source width
                      imheight, // source height
                      0,0, // coordinate destination
                      scaledWidth, // destination width
                      scaledHeight // destination height
                     );
    context.closePath();
    return context;
};
// => context

CanvasRelated.prototype.resetCanvasState = function(byeDrawnObject,
                                                    byeDrawnObjects,
                                                    byeHeldObjects,
                                                    byeDetections){
    // resets everything
    // zeros out drawn objects
    // held objects
    var scene = document.getElementById("scene");
    var context = scene.getContext("2d");
    this.clearScene();
    if(byeDrawnObject === true){
        this.drawnObject = {}; // stores last drawn object
    }
    if(byeDrawnObjects === true){
        this.drawnObjects = {"type" : "FeatureCollection",
                             "features" : []};
    }
    if(byeHeldObjects === true){
        this.heldObjects = [];
    }
    if(byeDetections === true){
        this.detections = {"type" : "FeatureCollection",
                           "features" : []};
    }
    this.redrawImage(this.image["id"],
                     this.image.ratio, context);

};
// => null

CanvasRelated.prototype.resetScene = function(){
    // redraw page image without the drawn objects
    // get canvas and context
    var fncthis = this;
    fncthis.resetCanvasState(true, // bye drawn object
                             true, // bye drawn objects
                             true, // bye held objects
                             false // keep detections
                            );
    return;
};
// => null

CanvasRelated.prototype.redrawRectObj = function(context, // drawing context
                                                 rectObj // drawer object
                                                ){
    // Draw rectangle object to context
    var x1coord = rectObj["properties"]["interfaceCoordinates"]["x1"];
    var y1coord = rectObj["properties"]["interfaceCoordinates"]["y1"];
    var nwidth = rectObj["properties"]["interfaceCoordinates"]["width"];
    var nheight = rectObj["properties"]["interfaceCoordinates"]["height"];

    // Setting context style
    var fillColor = rectObj["properties"]["displayRelated"]["fillColor"];
    var fillOpacity = rectObj["properties"]["displayRelated"]["fillOpacity"];
    var strokeColor = rectObj["properties"]["displayRelated"]["strokeColor"];
    var rgbastr = "rgba(";
    rgbastr = rgbastr.concat(fillColor); // rgb value ex: 255,0,0
    rgbastr = rgbastr.concat(",");
    rgbastr = rgbastr.concat(fillOpacity);
    rgbastr = rgbastr.concat(")");
    context.fillStyle = rgbastr;
    context.strokeStyle = strokeColor;

    context.beginPath();
    context.rect(x1coord,
                 y1coord,
                 nwidth,
                 nheight);
    context.stroke();
    context.fill();
    context.closePath();
    return context;
};
// => context

CanvasRelated.prototype.redrawPolygonObj = function(context, // drawing context
                                                    polyObj // drawer object
                                                   ){
    // Redraw polygon object
    var points = polyObj["properties"]["interfaceCoordinates"]["pointlist"];

    // Setting context style
    var fillColor = polyObj["properties"]["displayRelated"]["fillColor"];
    var fillOpacity = polyObj["properties"]["displayRelated"]["fillOpacity"];
    var strokeColor = polyObj["properties"]["displayRelated"]["strokeColor"];
    var rgbastr = "rgba(";
    rgbastr = rgbastr.concat(fillColor); // rgb value ex: 255,0,0
    rgbastr = rgbastr.concat(",");
    rgbastr = rgbastr.concat(fillOpacity);
    rgbastr = rgbastr.concat(")");
    context.fillStyle = rgbastr;
    context.strokeStyle = strokeColor;

    // Drawing first point
    var firstPoint = points[0];
    context.beginPath();
    context.moveTo(firstPoint.x, firstPoint.y);
    for(var p=0; p < points.length; p++){
        var point = points[p];
        context.lineTo(point.x, point.y);
    }
    context.lineTo(firstPoint.x, firstPoint.y);
    context.closePath();
    context.stroke();
    context.fill();
    return context;
};
// => context

CanvasRelated.prototype.redrawDetection = function(detection // geojson flavor
                                                  ){
    // Draws the given detection on scene
    this.clearScene();
    var imcanvas = document.getElementById("scene");
    var context = imcanvas.getContext('2d');

    var canvasOffsetX = imcanvas.offsetLeft;
    var canvasOffsetY = imcanvas.offsetTop;
    context = this.redrawImage(this.image["id"],
                               this.image.ratio,
                               context);
    var funcThis = this;
    // console.log("in redraw");
    // console.log(detection);
    context = funcThis.drawDetection(detection, context);
    return [context, detection];
};
// => [context, detection]

CanvasRelated.prototype.redrawDrawnObjects = function(drawnObjects, context){
    // Redraw all drawn objects
    for(var i=0; i < drawnObjects["features"].length; i++){
        var dobj = drawnObjects["features"][i];
        if(debug === true){
            console.log("drawn object");
            console.log(dobj);
        }
        if(dobj["properties"]["regionShape"] === "polygon"){
            context = this.redrawPolygonObj(context, dobj);
        }else if(dobj["properties"]["regionShape"] === "rectangle"){
            context = this.redrawRectObj(context, dobj);
        }
    }
    return context;
};
// => context

CanvasRelated.prototype.redrawAllDrawnObjects = function(){
    // redraw all the objects in the drawnObjects stack
    // get context and the scene
    var scene = document.getElementById("scene");
    var context = scene.getContext("2d");
    if(debug === true){
        console.log("in redraw all");
    }
    // redraw image
    context = this.redrawImage(this.image["id"],
                               this.image["ratio"], context);
    if(debug === true){
        console.log("in image redrawn");
    }
    var fncthis = this;
    context = fncthis.redrawDrawnObjects(this.drawnObjects, context);
    return;
};
// => null

CanvasRelated.prototype.redrawDetections = function(detections, // geojObj
                                                    context){
    // redraw detections
    var dobj;
    for(var i=0; i < detections["features"].length; i++){
        dobj = detections["features"][i];
        if(debug === true){
            console.log("drawn object");
            console.log(dobj);
        }
        if(isOdd(i) === true){
            context.strokeColor = "blue";
            context.fillStyle = "rgba(0,0,255,0.1)";
        }else{
            context.strokeColor = "yellow";
            context.fillStyle = "rgba(127,0,0,0.2)";
        }
        // console.log(dobj);
        var contextDetection;
        contextDetection = this.drawDetection(dobj, context
                                     // false // setStyle check
                                    );
        context = contextDetection[0];
        dobj = contextDetection[1];
    }
    return context;
};
// => context

CanvasRelated.prototype.redrawAllDetectedObjects = function(){
    // redraw all the objects in the detections stack
    // get context and the scene
    var scene = document.getElementById("scene");
    var context = scene.getContext("2d");
    if(debug === true){
        console.log("in redraw all");
    }
    // redraw image
    context = this.redrawImage(this.image["id"],
                               this.ratio, context);
    if(debug === true){
        console.log("in image redrawn");
    }
    var fncthis = this;
    context = fncthis.redrawDetections(this.detections, context);
    return;
};
// => null

CanvasRelated.prototype.redrawEverything = function(){
    // Combines redraw detections and selections
    var scene = document.getElementById("scene");
    var context = scene.getContext("2d");
    if(debug === true){
        console.log("in redraw all");
    }
    // redraw image
    context = this.redrawImage(this.image["id"],
                               this.image["ratio"], context);
    if(debug === true){
        console.log("in image redrawn");
    }
    var fncthis = this;
    context = fncthis.redrawDetections(this.detections, context);
    context = fncthis.redrawDrawnObjects(this.drawnObjects, context);
    return context;
};
// => context

CanvasRelated.prototype.removeFeatureById = function(features, filterId){
    // filter out the filterid from features array
    var narray = [];
    for(var i=0; i<features.length; i++){
        var feature = features[i];
        if(feature["id"] != filterId){
            narray.push(feature);
        }
    }
    return narray;
};
// => narray

CanvasRelated.prototype.removeDrawnObject = function(drawnObj){
    // remove drawn object from detection/drawnObjects
    // if it exist in detections
    // console.log("removing drawn object");
    // console.log(drawnObj);
    this.detections["features"] = this.removeFeatureById(
        this.detections["features"],
        drawnObj["id"]);
    this.drawnObjects["features"] = this.removeFeatureById(
        this.drawnObjects["features"],
        drawnObj["id"]);

    return;
};
// => null

CanvasRelated.prototype.removeDrawnObjects = function(drawnObjList){
    // remove drawn objects from canvas memory
    for(var i=0; i<drawnObjList.length; i++){
        // console.log(drawnObjList);
        var fncthis = this;
        fncthis.removeDrawnObject(drawnObjList[i]);
    }
};
// => null

//
// ------------- Methods for Managing Drawing Event -------
CanvasRelated.prototype.setSelectionCoordinates = function(event){
    // set selection coordinates based on the selector type
    // get scene and its offset
    if(debug === true){
        console.log('in set selection');
    }
    var scene = document.getElementById("scene");
    var parentOffsetX = scene.offsetLeft;
    var parentOffsetY = scene.offsetTop;

    // get coordinates of the event on the scene
    var xcoord = parseInt(event.layerX - parentOffsetX, 10);
    var ycoord = parseInt(event.layerY - parentOffsetY, 10);

    // get natural coordinates corresponding in the image
    var xreal = xcoord / this.hratio;
    var yreal = ycoord / this.vratio;

    //
    var seltype = this.selectorOptions.type;
    if(debug === true){
        console.log('in selector option');
        console.log(seltype);
    }
    if(seltype === "polygon-selector"){
        if(debug === true){
            console.log('in polygon selector branch');
        }
        this.poly["pointlist"].push({"x" : xcoord,
                                     "x_real" : xreal,
                                     "y_real" : yreal,
                                     "y" : ycoord});
        this.poly["hratio"] = this.image["hratio"];
        this.poly["vratio"] = this.image["vratio"];
        this.poly["ratio"] = this.image["ratio"];
        this.poly["imageSessionId"] = this.image["sessionId"];
        this.poly["imageId"] = this.image["id"];
        this.poly["imageName"] = this.image["name"];
        if(debug === true){
            console.log('mousedown polygon state');
            console.log(this.poly);
        }
    }else if(seltype === "rectangle-selector"){
        if(debug === true){
            console.log('in rect selector branch');
        }
        this.rect["x1"] = xcoord;
        this.rect["x1_real"] = xreal;
        this.rect["y1"] = ycoord;
        this.rect["y1_real"] = yreal;
        this.rect["hratio"] = this.image["hratio"];
        this.rect["vratio"] = this.image["vratio"];
        this.rect["ratio"] = this.image["ratio"];
        this.rect["imageSessionId"] = this.image["sessionId"];
        this.rect['imageId'] = this.image['id'];
        this.rect['imageName'] = this.image['name'];
        if(debug === true){
            console.log('mousedown rect state');
            console.log(this.rect);
        }
        // console.log(this.rect);
    }
    return;
};
// => null

CanvasRelated.prototype.setContextOptions2Object = function(dobj, // drawer object
                                                            strokeColor,
                                                            fillColor, // ex 255,0,0
                                                            fillOpacity // 0.2
                                                           ){
    // set context options to the object

    dobj["strokeColor"] = strokeColor;
    dobj["fillColor"] = fillColor;
    dobj["fillOpacity"] = fillOpacity;

    return dobj;
};
// => dobj


// ------------ Convert Drawn Objects to Geojson -----------
CanvasRelated.prototype.convertObj2Geojson = function(drawnObj){
    // convert the drawn object to its geojson equivalent
    var geoobj = {};
    geoobj["type"] = "Feature";
    geoobj["properties"] = {};
    geoobj["geometry"] = {};
    geoobj["id"] = generateUUID();
    geoobj["properties"]["id"] = drawnObj["id"];
    geoobj["properties"]["text"] = "";
    geoobj["properties"]["imageSessionId"] = drawnObj["imageSessionId"];
    geoobj["properties"]["imageName"] = drawnObj["imageName"];
    geoobj["properties"]["imageId"] = drawnObj["imageId"];
    geoobj["properties"]["regionType"] = drawnObj["regionType"];
    geoobj["properties"]["displayRelated"] = {};
    geoobj["properties"]["displayRelated"]["hratio"] = drawnObj["hratio"];
    geoobj["properties"]["displayRelated"]["vratio"] = drawnObj["vratio"];
    geoobj["properties"]["displayRelated"]["drawingRatio"] = drawnObj["ratio"];
    geoobj["properties"]["displayRelated"]["strokeColor"] = drawnObj["strokeColor"];
    geoobj["properties"]["displayRelated"]["fillColor"] = drawnObj["fillColor"];
    geoobj["properties"]["displayRelated"]["fillOpacity"] = drawnObj["fillOpacity"];
    geoobj["properties"]["interfaceCoordinates"] = {};
    if(drawnObj["shape"] === "polygon"){
        // geometries for polygon
        var pointlist = drawnObj["pointlist"];
        geoobj["properties"]["regionShape"] = drawnObj["shape"];
        geoobj["properties"]["interfaceCoordinates"]["pointlist"] = pointlist;
        geoobj["geometry"]["type"] = "Polygon";
        var coords = [];
        for(var p=0; p<pointlist.length; p++){
            var point = pointlist[p];
            var coord = [point["x_real"], point["y_real"]];
            coords.push(coord);
        }
        // add the first point to the end
        var fp = pointlist[0];
        var newfp = [fp["x_real"],fp["y_real"]];
        coords.push(newfp);
        geoobj["geometry"]["coordinates"] = [coords];
    }else if(drawnObj["shape"] === "rectangle"){
        // geometries for rectangle
        geoobj["properties"]["regionShape"] = drawnObj["shape"];
        var x1 = drawnObj["x1"];
        var y1 = drawnObj["y1"];
        var x1_real = drawnObj["x1_real"];
        var y1_real = drawnObj["y1_real"];
        var width = drawnObj["width"];
        var width_real = drawnObj["width_real"];
        var height = drawnObj["height"];
        var height_real = drawnObj["height_real"];
        var x2_real = x1_real + width_real;
        var y2_real = y1_real + height_real;
        var x2 = x1 + width;
        var y2 = y1 + height;
        var bbox = x1_real + "," + y1_real + "," + x2_real + "," + y2_real;
        geoobj["properties"]["interfaceCoordinates"]["x1"] = x1;
        geoobj["properties"]["interfaceCoordinates"]["y1"] = y1;
        geoobj["properties"]["interfaceCoordinates"]["x2"] = x2;
        geoobj["properties"]["interfaceCoordinates"]["y2"] = y2;
        //
        geoobj["properties"]["interfaceCoordinates"]["y1_real"] = y1_real;
        geoobj["properties"]["interfaceCoordinates"]["x1_real"] = x1_real;
        geoobj["properties"]["interfaceCoordinates"]["y2_real"] = y2_real;
        geoobj["properties"]["interfaceCoordinates"]["x2_real"] = x2_real;
        //
        geoobj["properties"]["interfaceCoordinates"]["width"] = width;
        geoobj["properties"]["interfaceCoordinates"]["height"] = height;
        geoobj["properties"]["interfaceCoordinates"]["width_real"] = width_real;
        geoobj["properties"]["interfaceCoordinates"]["height_real"] = height_real;
        geoobj["properties"]["interfaceCoordinates"]["bbox"] = bbox;
        //
        geoobj["geometry"]["type"] = "MultiLineString";
        var topside = [[x1_real, y1_real], [x2_real, y1_real]];
        var bottomside = [[x1_real, y2_real], [x2_real, y2_real]];
        var rightside = [[x2_real, y1_real], [x2_real, y2_real]];
        var leftside = [[x1_real, y1_real], [x1_real, y2_real]];
        geoobj["geometry"]["coordinates"] = [topside, rightside,
                                             bottomside, leftside];
    }
    return geoobj;
};
// => geojson object

CanvasRelated.prototype.addSingleDrawnObject = function(){
    // add drawn object to drawn objects stack
    // make a copy of drawn object
    if(debug === true){
        console.log("in add single drawn object");
    }
    var objstr = JSON.stringify(this.drawnObject);
    var objJson = JSON.parse(objstr);
    if(debug === true){
        console.log("object before geojson conversion");
        console.log(objJson);
    }
    var geoj = this.convertObj2Geojson(objJson);
    if(debug === true){
        console.log("object after geojson conversion");
        console.log(geoj);
    }
    this.drawnObjects["features"].push(geoj);
    if(debug === true){
        console.log("drawn objects after recent addition");
        console.log(this.drawnObjects);
    }
    // console.log(this.drawnObjects);
    return geoj;
};
// => geojson object

CanvasRelated.prototype.getDrawnById = function(index, drawStack){
    // gives the transcription (feature) using data id
    var retobj;
    for(var i=0; i<drawStack["features"].length; i++){
        var trans = drawStack["features"][i];
        if(trans["id"] === index){
            retobj = JSON.parse(JSON.stringify(trans));
            return retobj;
        }
    }
    return retobj;
};
// => geojson object

//
// Event handlers
// Checks for event locations
CanvasRelated.prototype.checkDetectionBound = function(mX, // real coordinate no scaling
                                                       mY,
                                                       x1, // real coordinate no scaling
                                                       y1,
                                                       x2, // real coordinates no scaling
                                                       y2){
    // check if the line contains the mX and mY
    if(debug === true){
        console.log("in check detection bound");
    }
    var check = false;
    if(debug === true){
        console.log("checking detection coords");
        console.log("mx");
        console.log(mX);
        console.log("my");
        console.log(mY);
        console.log("x1");
        console.log(x1);
        console.log("y1");
        console.log(y1);
        console.log("x2");
        console.log(x2);
        console.log("y2");
        console.log(y2);
    }
    //
    if(
        (y1 <= mY) && (mY <= y2) &&
            (x1 <= mX) && (mX <= x2)
    ){
        check=true;
    }
    if(debug === true){
        console.log("check val");
        console.log(check);
    }
    return check;
};
// => bool
//
CanvasRelated.prototype.checkEventRectBound = function(event,
                                                       rectName,
                                                       eventBool){
    /*
      Check if the event is in the given rectangle
      event: a mouse event
      eventName: is the boolean variable
      that would be changed with the check
      rectName: is the reference rectangle*/
    var imcanvas = document.getElementById("image-canvas");
    var context = imcanvas.getContext('2d');
    var canvasOffsetX = imcanvas.offsetLeft;
    var canvasOffsetY = imcanvas.offsetTop;
    var mouseX2 = parseInt(event.layerX - canvasOffsetX);
    var mouseY2 = parseInt(event.layerY - canvasOffsetY);
    var mouseX2Trans = (mouseX2) / this.image.hratio; // real coordinates
    var mouseY2Trans = (mouseY2) / this.image.vratio; // real coordinates
    //
    var x1 = parseInt(rectName["x1_real"], 10);
    var y1 = parseInt(rectName["y1_real"], 10);
    var x2 = parseInt(rectName["x2_real"], 10);
    var y2 = parseInt(rectName["y2_real"], 10);
    //
    if(this.checkLineBound(mouseX2Trans, mouseY2Trans,
                           x1, y1,
                           x2, y2) === true){
        eventBool=true;
    }
};
// => null
//
// Get lines based on event locations
CanvasRelated.prototype.getDetectionBound = function(mXcoord,
                                                     mYcoord){
    // get the line that is to be drawn based on the
    // coordinates provided
    // console.log("in get detection bound");
    var detection;
    // console.log(this.detections);
    //
    for(var i=0; i< this.detections["features"].length; i++){
        var aDetection = this.detections["features"][i]; // Contains geoj
        var x1 = parseInt(aDetection["properties"]["interfaceCoordinates"]["x1_real"], 10);
        var y1 = parseInt(aDetection["properties"]["interfaceCoordinates"]["y1_real"], 10);
        var x2 = x1 + parseInt(aDetection["properties"]["interfaceCoordinates"]["width_real"], 10);
        var y2 = y1 + parseInt(aDetection["properties"]["interfaceCoordinates"]["height_real"], 10);
        if(this.checkDetectionBound(mXcoord, mYcoord,
                                    x1, y1,
                                    x2, y2) === true){
            detection = JSON.parse(JSON.stringify(aDetection));
            break;
        }
    }
    //
    return detection;
};
// => detection(geojson object)

// Transcription Column Related

var TransColumn = function(){
    var obj = Object.create(TransColumn.prototype);
    var pageImage;
    obj.image = pageImage;
    obj.viewerCheck = false;
    obj.drawnObject = {};
    obj.originalSize = false;
    obj.hratio = "";
    obj.vratio = "";
    obj.ratio = "";
    obj.imageSessionId = "";
    obj.transcriptions = {"type" : "FeatureCollection",
                          "features" : []};
    obj.deletedNodes = [];
    return obj;
};
// methods
TransColumn.prototype.clearTranscription = function(){
    // clears the transcription interface
    // leaving only a skeleton of what should
    // be in a normal transcription interface
    var tlinelist = document.getElementById("text-area-list");

    // remove child elements
    while(tlinelist.firstChild){
        tlinelist.removeChild(tlinelist.firstChild);
    }
    this.transcriptions["features"] = [];
    return;
};
// => null

TransColumn.prototype.createTranscriptionField = function(index,
                                                          makeBbox,
                                                          geojObject){
    // Create Transcription field
    var igId = this.createIdWithPrefix(index, "ig");
    var listItem = this.createIGroup(igId);
    //
    var ilId = this.createIdWithPrefix(index, "il");
    var ulList = this.createItList(ilId);
    //
    var taId = this.createIdWithPrefix(index, "ta");
    var transLine = this.createTLine(taId,
                                     geojObject,
                                     makeBbox);

    // create list element that contains text area
    var aelId = this.createIdWithPrefix(index, "ac");
    var ac = this.createAreaContainer(aelId);

    //
    var awId = this.createIdWithPrefix(index, "aw");
    var areaWidget = this.createAreaWidget(awId);
    //
    var cbcId = this.createIdWithPrefix(index, "cbc");
    var cboxLabel = this.createAreaCboxLabel(cbcId);
    //
    var acboxId = this.createIdWithPrefix(index, "acbox");
    var acbox = this.createAreaCbox(acboxId);

    return [listItem, ulList, transLine, ac,
            areaWidget, cboxLabel, acbox];

};
// => [listItem, ulList, transLine, ac,
//     areaWidget, cboxLabel, acbox]

TransColumn.prototype.setBbox2Textarea = function(bbox, index){
    // set data-bbox attribute of a given textarea in the given index
    var taId = this.createIdWithPrefix(index, "ta");
    var txtarea = document.getElementById(taId);
    // console.log(bbox);
    txtarea.setAttribute("data-bbox", bbox);
    return;

};
// => null

TransColumn.prototype.addDetected2TranscriptionArea = function(detected // geojObject
                                                              ){
    // adds the detected area 2 transcription area

    // get information to add
    var text = detected["properties"]["text"];
    var index = detected["properties"]["id"];
    var bbox = detected["properties"]["interfaceCoordinates"]["bbox"];

    // create necessary elements
    var orList = document.getElementById("text-area-list");

    // create the item group
    var fncthis = this;
    var makeBbox = false;
    var fieldItem = fncthis.createTranscriptionField(index,
                                                     makeBbox,
                                                     detected);
    // put everything in its correct position
    var itemGroup = this.fillItemGroupBody(fieldItem);
    // list item goes into ol list
    orList.appendChild(itemGroup);

    // set bbox to textarea
    // console.log(detected);
    fncthis.setBbox2Textarea(bbox, index);
    // this.sortLines();
};
// => null

TransColumn.prototype.loadTranscription = function(event){
    // loads the transcription of the image associated
    // to the link
    // get id from the image link
    this.clearTranscription();
    var imtag = event.target;
    this.image = imtag;
    var pageid = imtag.getAttribute("id");
    pageid = pageid.replace("image-page-","");

    pageid = parseInt(pageid, 10);
    // console.log(pageid);

    var page;
    for(var i=0; i<pages.length; i++){
        //
        var p = pages[i];
        // console.log(p);
        if(p["index"] === pageid){
            page = p;
        }
    }

    var lines = page["lines"];
    // console.log(lines);
    var funcThis = this;
    for(var k=0; k<lines.length; k++){
        //
        var line = this.getTranscription(lines[k]);
        // console.log(line);
        var geoj = this.convert2Geojson(line);
        funcThis.addDetected2TranscriptionArea(geoj);
        // console.log(geoj);
        this.transcriptions["features"].push(geoj);
    }
    return;
}; // TODO: debug code
// => null

TransColumn.prototype.getTranscription = function(transObj){
    // get information from transcribed object
    var leftInt = parseInt(transObj["x1_real"], 10);
    leftInt = Math.floor(leftInt);
    var topInt = parseInt(transObj["y1_real"], 10);
    topInt = Math.floor(topInt);
    var widthInt = parseInt(transObj["width_real"], 10);
    widthInt = Math.floor(widthInt);
    var heightInt = parseInt(transObj["height_real"], 10);
    heightInt = Math.floor(heightInt);
    // console.log(transObj);
    //
    var transcription = {};
    transcription["x1_real"] = leftInt;
    transcription["y1_real"] = topInt;
    transcription["width_real"] = widthInt;
    transcription["height_real"] = heightInt;
    transcription["id"] = transObj["id"];
    transcription["bbox"] = transObj["bbox"];
    transcription["text"] = transObj["text"];
    transcription["type"] = transObj["type"];
    transcription["shape"] = transObj["shape"];
    return transcription;
};
// => transcription object

TransColumn.prototype.convert2Geojson = function(detection){
    // convert detection object to geojson
    var geoobj = {};

    // declaring values that would be stored
    var x1_real = detection["x1_real"];
    var y1_real = detection["y1_real"];
    var width_real = detection["width_real"];
    var height_real = detection["height_real"];
    var x2_real = x1_real + width_real;
    var y2_real = y1_real + height_real;
    var x1 = x1_real * this.hratio;
    var y1 = y1_real * this.vratio;
    var x2 = x2_real * this.hratio;
    var y2 = y2_real * this.vratio;
    var width = width_real * this.hratio;
    var height = height_real * this.vratio;

    //
    geoobj["type"] = "Feature";
    geoobj["properties"] = {};
    geoobj["geometry"] = {};
    geoobj["id"] = generateUUID();
    geoobj["properties"]["regionType"] = detection["type"];
    geoobj["properties"]["regionShape"] = detection["shape"];
    geoobj["properties"]["id"] = detection["id"];
    geoobj["properties"]["text"] = "";

    // display related
    geoobj["properties"]["displayRelated"] = {};
    geoobj["properties"]["displayRelated"]["hratio"] = this.hratio;
    geoobj["properties"]["displayRelated"]["vratio"] = this.vratio;
    geoobj["properties"]["displayRelated"]["drawingRatio"] = this.ratio;
    if(detection.hasOwnProperty("strokeColor")){
        geoobj["properties"]["displayRelated"]["strokeColor"] = detection["strokeColor"];
    }
    if(detection.hasOwnProperty("fillColor")){
        geoobj["properties"]["displayRelated"]["fillColor"] = detection["fillColor"];
    }
    if(detection.hasOwnProperty("fillOpacity")){
        geoobj["properties"]["displayRelated"]["fillOpacity"] = detection["fillOpacity"];
    }
    if(detection.hasOwnProperty("imageSessionId")){
        geoobj["properties"]["imageSessionId"] = detection["imageSessionId"];
    }
    if(detection.hasOwnProperty('imageName')){
        geoobj["properties"]["imageName"] = detection["imageName"];
    }
    if(detection.hasOwnProperty('imageId')){
        geoobj["properties"]["imageId"] = detection["imageId"];
    }

    geoobj["properties"]["interfaceCoordinates"] = {};
    geoobj["properties"]["interfaceCoordinates"]["x1"] = x1;
    geoobj["properties"]["interfaceCoordinates"]["y1"] = y1;
    geoobj["properties"]["interfaceCoordinates"]["x2"] = x2;
    geoobj["properties"]["interfaceCoordinates"]["y2"] = y2;
    //
    geoobj["properties"]["interfaceCoordinates"]["y1_real"] = y1_real;
    geoobj["properties"]["interfaceCoordinates"]["x1_real"] = x1_real;
    geoobj["properties"]["interfaceCoordinates"]["y2_real"] = y2_real;
    geoobj["properties"]["interfaceCoordinates"]["x2_real"] = x2_real;
    //
    geoobj["properties"]["interfaceCoordinates"]["width"] = width;
    geoobj["properties"]["interfaceCoordinates"]["height"] = height;
    geoobj["properties"]["interfaceCoordinates"]["width_real"] = width_real;
    geoobj["properties"]["interfaceCoordinates"]["height_real"] = height_real;

    // add bbox if it exists
    if(detection.hasOwnProperty("bbox")){
        geoobj["properties"]["interfaceCoordinates"]["bbox"] = detection["bbox"];
    }
    //
    geoobj["geometry"]["type"] = "MultiLineString";
    var topside = [[x1_real, y1_real], [x2_real, y1_real]];
    var bottomside = [[x1_real, y2_real], [x2_real, y2_real]];
    var rightside = [[x2_real, y1_real], [x2_real, y2_real]];
    var leftside = [[x1_real, y1_real], [x1_real, y2_real]];
    geoobj["geometry"]["coordinates"] = [topside, rightside,
                                         bottomside, leftside];
    return geoobj;
};
// => geojson object

TransColumn.prototype.getLineById = function(idstr){
    var index = idstr.replace(/[^0-9]/g, '');
    var result;
    for(var i=0; i < this.transcriptions["features"].length; i++){
        var trans = this.transcriptions["features"][i];
        if(trans.index === index){
            result = trans;
        }
    }
    return result;
};
// => geojson object

TransColumn.prototype.createItemId = function(){
    // creates the id of item group based on the
    // the number of elements the text-area-list has
    var orList = document.getElementById("text-area-list");
    var children = orList.childNodes;
    var childArray = [];
    for(var i=0; i < children.length; i++){
        var newchild = children[i];
        if(newchild.className === "item-group"){
            childArray.push(newchild);
        }
    }
    //
    var newId = childArray.length + 1;
    return newId;
};
// => newId

TransColumn.prototype.createIdWithPrefix = function(index, prefix){
    // creates the id with the necessary prefix
    var id = prefix.concat("-");
    var prefixId = id.concat(index);
    return prefixId;
};
// => prefixId (string)
//
TransColumn.prototype.checkRectangle = function(){
    // check if the selection rectangle is empty
    var result = false;
    if( this.drawnObject["id"] != ""){
        result = true;
    }
    //
    return result;
};
// => result(bool)
//
TransColumn.prototype.createIGroup = function(idstr){
    // create the list element that will hold the group
    var listItem = document.createElement("li");
    listItem.setAttribute("class", "item-group");
    listItem.setAttribute("id", idstr);
    //
    return listItem;
};
//
TransColumn.prototype.createItList = function(idstr){
    // Unordered list that would hold the checkbox
    // and the transcription line
    var ulList = document.createElement("ul");
    ulList.setAttribute("class", "item-list");
    ulList.setAttribute("id", idstr);
    //
    return ulList;
};
TransColumn.prototype.createTLine = function(idstr, // textarea id
                                             coordObj, // coordinate containing object
                                             makeBbox
                                            ){
    // create a transcription line
    var transLine = document.createElement("textarea");
    // set attributes
    // console.log(coordObj);
    transLine.setAttribute("id", idstr);
    transLine.setAttribute("spellcheck", "true");
    transLine.setAttribute("class", "transcription-textarea");
    //
    var index = idstr.replace(/[^0-9]/g, '');
    var placeholder = "Enter text for added ";
    placeholder = placeholder.concat(coordObj["properties"]["regionType"]);
    transLine.setAttribute("placeholder", placeholder);
    transLine.setAttribute("data-region-type", coordObj["properties"]["regionType"]);
    transLine.setAttribute("data-drawn-id", coordObj["id"]);
    var bbox = "";
    if(makeBbox === true){
        bbox = bbox.concat(coordObj["properties"]["interfaceCoordinates"]["x1_real"]);
        bbox = bbox.concat(", ");
        bbox = bbox.concat(coordObj["properties"]["interfaceCoordinates"]["y1_real"]);
        bbox = bbox.concat(", ");
        bbox = bbox.concat(coordObj["properties"]["interfaceCoordinates"]["width_real"]);
        bbox = bbox.concat(", ");
        bbox = bbox.concat(coordObj["properties"]["interfaceCoordinates"]["height_real"]);
    }
    transLine.setAttribute("data-bbox", bbox);
    transLine.addEventListener('focus', viewLine, false);
    // set textarea events
    //
    return transLine;
};
//
TransColumn.prototype.createAreaCbox = function(idstr){
    // Create the checkbox in the line widget
    var cbox = document.createElement("input");
    cbox.setAttribute("id", idstr);
    cbox.setAttribute("type","checkbox");
    cbox.setAttribute("class", "area-cbox");
    //
    return cbox;
};
//
TransColumn.prototype.createAreaCboxLabel = function(idstr){
    // Create line cbox label
    // add the span element of the cbox
    var labelContainer = document.createElement("label");
    labelContainer.setAttribute("class", "cbox-container");
    labelContainer.setAttribute("id", idstr);
    // Commenting out the span element
    // it is not really needed for anything
    // var spanElement = document.createElement("span");
    // spanElement.setAttribute("class", "checkmark");
    // labelContainer.appendChild(spanElement);
    return labelContainer;
};
TransColumn.prototype.createAreaContainer = function(idstr){
    // create area element li
    var ael = document.createElement("div");
    ael.setAttribute("id", idstr);
    ael.setAttribute("class", "area-container");
    return ael;
};
//
TransColumn.prototype.createAreaWidget = function(idstr){
    // Create the line widget that holds
    // checkboxes and other functionality
    var areaWidget = document.createElement("li");
    areaWidget.setAttribute("class", "area-widget");
    areaWidget.setAttribute("id", idstr);
    //
    return areaWidget;
};
TransColumn.prototype.fillItemGroupBody = function(fieldItems){
    // create text-area-list body
    var itemGroup, itemList, transLine, textAreaContainer;
    var areaWidget, cboxLabel, areaCbox;
    itemGroup = fieldItems[0]; // item group
    itemList = fieldItems[1];  // ulList
    transLine = fieldItems[2];  // textarea
    textAreaContainer = fieldItems[3];  // area container - ac
    areaWidget = fieldItems[4]; // area widget
    cboxLabel = fieldItems[5]; // cbox label
    areaCbox = fieldItems[6]; // cbox


    // cbox goes into cboxlabel
    cboxLabel.prepend(areaCbox);

    // cboxlabel goes into area widget
    areaWidget.appendChild(cboxLabel);

    // textarea goes into area container
    textAreaContainer.appendChild(transLine);

    // container goes into area widget
    areaWidget.appendChild(textAreaContainer);

    // transline and linewidget goes into ullist
    itemList.appendChild(areaWidget);

    // ul list goes into list item
    itemGroup.appendChild(itemList);

    return itemGroup;
};
TransColumn.prototype.addTranscription = function(){
    // adds a transcription box to item list
    /*
      First checks if a region is selected in the image
      then gets the count of the number of transcription regions
      in the transcription column
      Then creates the elements that a transcription region holds
      At the end, appends these elements to their corresponding parents

    */
    var funcThis = this;
    var check = funcThis.checkRectangle();
    if(check === false){
        alert("Please select an area before adding a transcription");
        return;
    }
    var rbuttons = document.querySelector("input[name='selected-region-rbtn']:checked");
    check = false;
    if(rbuttons != null){
        check = true;
    }
    if(check === false){
        alert("Please Select the Region Type before adding the selection");
    }
    var rbtnval = rbuttons.value;
    var orList = document.getElementById("text-area-list");
    // create the new line id
    var newListId = this.createItemId();
    this.drawnObject["properties"]["regionType"] = rbtnval;
    var makeBbox = true;
    var fncthis = this;
    //
    var fieldItems = fncthis.createTranscriptionField(newListId,
                                                      makeBbox,
                                                      this.drawnObject);
    //
    var itemGroup = this.fillItemGroupBody(fieldItems);
    // list item goes into ol list
    orList.appendChild(itemGroup);
    // add the line to the lines list as well
    var newTranscription = JSON.parse(JSON.stringify(this.drawnObject));
    this.transcriptions["features"].push(newTranscription);
    this.sortLines();
};
//
TransColumn.prototype.changeItemAttribute = function(index,
                                                     prefix,
                                                     attr,
                                                     val){
    /*
      Change Item attribute to val
      index: numeric part of id
      prefix: string part of id
      attr: attribute name
      val: value to be set
    */
    var itemid = this.createIdWithPrefix(index, prefix);
    var item = document.getElementById(itemid);
    item.setAttribute(attr, val);
    return item;
};
//
TransColumn.prototype.markRTL = function(){
    /*
      Mark Selection as Right to Left
    */
    var cboxes = document.querySelectorAll("input.area-cbox");
    var cboxlen = cboxes.length;
    var i = 0;
    for(i; i < cboxlen; i++){
        //
        var cbox = cboxes[i];
        var checkval = cbox.checked;
        if(checkval===true){
            //
            var index = cbox.id;
            index = index.replace(/[^0-9]/g, '');
            this.changeItemAttribute(index,
                                     "ta",
                                     "dir",
                                     "rtl");
        }
    }
};
//
TransColumn.prototype.markLTR = function(){
    /*
      Mark Selection as Right to Left
    */
    var cboxes = document.querySelectorAll("input.area-cbox");
    var cboxlen = cboxes.length;
    var i = 0;
    for(i; i < cboxlen; i++){
        //
        var cbox = cboxes[i];
        var checkval = cbox.checked;
        if(checkval===true){
            //
            var index = cbox.id;
            index = index.replace(/[^0-9]/g, '');
            this.changeItemAttribute(index,
                                     "ta",
                                     "dir",
                                     "ltr");
        }
    }
};
TransColumn.prototype.selectAllTranscriptions = function(){
    // Mark all line checkboxes
    var cboxlist = document.querySelectorAll("input.area-cbox");
    var listlen = cboxlist.length;
    var clist = [];
    var i = 0;
    for (i; i < listlen; i++){
        var cbox = cboxlist[i];
        if(cbox.checked === false){
            cbox.checked = true;
        }else{
            clist.push(cbox);
        }
    }
    if(clist.length === listlen){
        for(i=0; i<listlen; i++){
            var ncbox = cboxlist[i];
            ncbox.checked = false;
        }
    }
};
//
TransColumn.prototype.deleteBoxes = function(){
    /*
      Simple function for deleting lines whose checkboxes are selected
      Description:
      We query the input elements whose class is trans-cbox.
      Then we check whether they are checked or not.
      If they are checked we delete the item group containing them
    */
    var deleteCheckBoxList = document.querySelectorAll("input.area-cbox");
    var dellength = deleteCheckBoxList.length;
    var deletedboxlength = 0;
    var delArray = [];
    var i = 0;
    while(i < dellength){
        var cbox = deleteCheckBoxList[i];
        var checkval = cbox.checked;
        if(checkval===true){
            // removing the element if checkbox is checked

            // get the identifer of the item group
            var idstr = cbox.getAttribute("id");
            var index = idstr.replace(/[^0-9]/g, '');
            var itemGroupId = this.createIdWithPrefix(index, "ig");

            // get the identifer of the textarea
            var textareaId = this.createIdWithPrefix(index, "ta");
            var textArea = document.getElementById(textareaId);
            // neutralize any style changes that might be on textarea
            textArea.setAttribute("class", "transcription-textarea");
            var itemGroup = document.getElementById(itemGroupId);

            // get the identifier of the drawn object
            var drawnId = textArea.getAttribute("data-drawn-id");

            // get drawn object
            var geoobj = this.getTranscriptionByDataId(drawnId);
            // get the image line from the other column
            //
            var itemparent = itemGroup.parentNode;
            var deleted = {"feature" : geoobj,
                           "itemgroup" : itemGroup,
                           "featureParent" : this.transcriptions,
                           "itemparent" : itemparent};
            this.deletedNodes.push(deleted);
            // remove both from the page
            itemparent.removeChild(itemGroup);
            this.transcriptions["features"] = this.removeFeatureById(
                this.transcriptions["features"], drawnId);
            deletedboxlength +=1;
            delArray.push(geoobj);
        }
        i+=1;
    }
    // this.sortLines();
    if(deletedboxlength === 0){
        alert("Please select lines for deletion");
    }
    return delArray;
};
//
TransColumn.prototype.undoDeletion = function(){
    if (this.deletedNodes.length === 0){
        alert("Deleted line information is not found");
    }
    var lastObject = this.deletedNodes.pop();
    //
    var imageFeature = lastObject["feature"];
    var itemgroup = lastObject["itemgroup"];
    var imageparent = lastObject["featureParent"]; // this.transcriptions
    var itemparent = lastObject["itemparent"];
    //
    imageparent["features"].push(imageFeature);
    itemparent.appendChild(itemgroup);
    return imageFeature;
    //
};
// sorting lines
TransColumn.prototype.sortLines = function() {
    var lineList = document.querySelectorAll(".item-group");
    var itemparent = document.getElementById("text-area-list");
    var fncthis = this;
    var linearr = Array.from(lineList).sort(
        this.sortOnTopCoordinate.bind(this)
    );
    // console.log("linelist before");
    // console.log(lineList);
    // console.log("linearray sorted");
    // console.log(linearr);
    //
    //
    linearr.forEach( el => itemparent.appendChild(el) );
};
TransColumn.prototype.removeFeatureById = function(features, filterId){
    // filter out the filterid from features array
    var narray = [];
    for(var i=0; i<features.length; i++){
        var feature = features[i];
        if(feature["id"] != filterId){
            narray.push(feature);
        }
    }
    return narray;
};
TransColumn.prototype.getTranscriptionByDataId = function(index){
    // gives the transcription (feature) using data id
    var retobj;
    for(var i=0; i<this.transcriptions["features"].length; i++){
        var trans = this.transcriptions["features"][i];
        if(trans["id"] === index){
            retobj = JSON.parse(JSON.stringify(trans));
            return retobj;
        }
    }
    return retobj;
};
TransColumn.prototype.getTranscriptionTopCoord = function(geoj){
    // get transcription top point
    var tcoord;
    // console.log("get top coord");
    // console.log(geoj);
    if(geoj["properties"]["regionShape"] === "rectangle"){
        tcoord = Math.max(geoj["properties"]["interfaceCoordinates"]["y1"],
                          geoj["properties"]["interfaceCoordinates"]["y2"]);

        // console.log('top point');
        // console.log(tcoord);

        return tcoord;
    }else if(geoj["properties"]["regionShape"] === "polygon"){
        //
        var pointlist = geoj["properties"]["interfaceCoordinates"]["pointlist"];
        var tpointCoord = 0;
        for(var i=0; i < pointlist.length; i++){
            var point = pointlist[i];
            var py = parseInt(point["y"], 10);
            if(py > tpointCoord){
                tpointCoord = py;
            }
        }
        tcoord = tpointCoord;
        // console.log('top point');
        // console.log(tcoord);
        return tcoord;
    }
    return tcoord; // null object
};
TransColumn.prototype.selectXYrect = function(maxcoord,
                                              y1_real,
                                              y2_real,
                                              x1_real,
                                              x2_real,
                                              y1,y2,x1,x2,
                                              direction // x,y
                                             ){
    // get select coordinate point based on max coord
    var fncx_real, fncx, fncy, fncy_real;
    if(direction === "y"){
        if(maxcoord === y1_real){
            fncy_real = y1_real;
            fncx = x1;
            fncy = y1;
            fncx_real = x1_real;
        }else{
            fncy_real = y2_real;
            fncx = x2;
            fncy = y2;
            fncx_real = x2_real;
        }
    }else{
        if(maxcoord === x1_real){
            fncy_real = y1_real;
            fncx = x1;
            fncy = y1;
            fncx_real = x1_real;

        }else{
            fncy_real = y2_real;
            fncx = x2;
            fncy = y2;
            fncx_real = x2_real;
        }
    }
    var point = {"x_real" : fncx_real,
                 "y_real" : fncy_real,
                 "x" : fncx,
                 "y" : fncy};
};
TransColumn.prototype.selectXYpoly = function(pointlist, // {x,y,x_real,y_real}
                                              direction, // [x,y]
                                              fnctype  // [max, min]
                                             ){
    // select points from pointlist based on direction and fnctype

    var tpointCoordx, tpointCoordy, tpointCoordx_real, tpointCoordy_real;
    if((fnctype === "max") && (direction === "y")){
        tpointCoordy_real = Number.NEGATIVE_INFINITY;
        for(var i=0; i < pointlist.length; i++){
            var point = pointlist[i];
            var py = parseInt(point["y_real"], 10);
            if(py > tpointCoordy_real){
                tpointCoordy_real = py;
                tpointCoordx = parseInt(point["x"], 10);
                tpointCoordy = parseInt(point["y"], 10);
                tpointCoordx_real = parseInt(point["x_real"], 10);
            }
        }
    }else if((fnctype === "min") && (direction === "y")){
        tpointCoordy_real = Number.POSITIVE_INFINITY;
        for(var i=0; i < pointlist.length; i++){
            var point = pointlist[i];
            var py = parseInt(point["y_real"], 10);
            if(py < tpointCoordy_real){
                tpointCoordy_real = py;
                tpointCoordx = parseInt(point["x"], 10);
                tpointCoordy = parseInt(point["y"], 10);
                tpointCoordx_real = parseInt(point["x_real"], 10);
            }
        }
    }else if((fnctype === "max") && (direction === "x")){
        tpointCoordx_real = Number.NEGATIVE_INFINITY;
        for(var i=0; i < pointlist.length; i++){
            var point = pointlist[i];
            var px = parseInt(point["x_real"], 10);
            if(px > tpointCoordx_real){
                tpointCoordx_real = px;
                tpointCoordy_real = parseInt(point["y_real"], 10);
                tpointCoordx = parseInt(point["x"], 10);
                tpointCoordy = parseInt(point["y"], 10);
            }
        }
    }else if((fnctype === "min") && (direction === "x")){
        tpointCoordx_real = Number.POSITIVE_INFINITY;
        for(var i=0; i < pointlist.length; i++){
            var point = pointlist[i];
            var px = parseInt(point["x_real"], 10);
            if(px < tpointCoordx_real){
                tpointCoordx_real = px;
                tpointCoordy_real = parseInt(point["y_real"], 10);
                tpointCoordx = parseInt(point["x"], 10);
                tpointCoordy = parseInt(point["y"], 10);
            }
        }
    }
    var epoint = {"x" : tpointCoordx,
                  "y" : tpointCoordy,
                  "x_real" : tpointCoordx_real,
                  "y_real" : tpointCoordy_real};
    return epoint;
};
TransColumn.prototype.getDrawnExtremePoint = function(geoj,  // geojson object
                                                      fnctype, // min, max
                                                      direction  // [x, y]
                                                     ){
    // finds extreme points based on the given criteria
    var epoint; // extreme point

    if(geoj["properties"]["regionShape"] === "rectangle"){

        // TODO: finds top point continue refactoring for finding all extreme points
        // initialize points
        var y1_real, y2_real, y1, y2, x1, x1_real, x2, x2_real;

        y1_real = geoj["properties"]["interfaceCoordinates"]["y1_real"];
        y2_real = geoj["properties"]["interfaceCoordinates"]["y2_real"];
        y1 = geoj["properties"]["interfaceCoordinates"]["y1"];
        y2 = geoj["properties"]["interfaceCoordinates"]["y2"];

        x1_real = geoj["properties"]["interfaceCoordinates"]["x1_real"];
        x2_real = geoj["properties"]["interfaceCoordinates"]["x2_real"];
        x1 = geoj["properties"]["interfaceCoordinates"]["x1"];
        x2 = geoj["properties"]["interfaceCoordinates"]["x2"];

        var fncx_real, fncx, fncy, fncy_real;
        if((fnctype === "min") && (direction === "y")){
            var min_coord = Math.min(y1_real,
                                     y2_real);
            epoint = this.selectXYrect(min_coord,
                                       y1_real, y2_real, x1_real, x2_real,
                                       y1,y2,x1,x2,
                                       direction);
        }else if((fnctype === "max") && (direction === "y")){
            var max_coord = Math.max(y1_real,
                                     y2_real);
            epoint = this.selectXYrect(max_coord,
                                       y1_real, y2_real, x1_real, x2_real,
                                       y1,y2,x1,x2,
                                       direction);
        }else if((fnctype === "min") && (direction === "x")){
            var min_coordx = Math.min(x1_real,
                                     x2_real);
            epoint = this.selectXYrect(min_coordx,
                                       y1_real, y2_real, x1_real, x2_real,
                                       y1,y2,x1,x2,
                                       direction);
        }else if((fnctype === "min") && (direction === "x")){
            var max_coordx = Math.max(x1_real,
                                      x2_real);
            epoint = this.selectXYrect(max_coordx,
                                       y1_real, y2_real, x1_real, x2_real,
                                       y1,y2,x1,x2,
                                       direction);
        }
        // console.log('top point');
        // console.log(tcoord);

        return epoint;
    }else if(geoj["properties"]["regionShape"] === "polygon"){
        //
        var pointlist = geoj["properties"]["interfaceCoordinates"]["pointlist"];
        var tpointCoordx, tpointCoordy, tpointCoordx_real, tpointCoordy_real;

        if((fnctype === "max") && (direction === "y")){
            epoint = this.selectXYpoly(pointlist, direction, fnctype);
        }else if((fnctype === "min") && (direction === "y")){
            epoint = this.selectXYpoly(pointlist, direction, fnctype);
        }else if((fnctype === "max") && (direction === "x")){
            epoint = this.selectXYpoly(pointlist, direction, fnctype);
        }else if((fnctype === "min") && (direction === "x")){
            epoint = this.selectXYpoly(pointlist, direction, fnctype);
        }
        // console.log('top point');
        // console.log(tcoord);
        return epoint;
    }
    return epoint; // null object
};
TransColumn.prototype.getDrawnExtremePoints = function(geoj){
    // get extreme points of the geoj flavored object
    var fncthis = this;
    var topPoint = fncthis.getDrawnExtremePoint(geoj, "min", "y");
    var bottomPoint = fncthis.getDrawnExtremePoint(geoj, "max", "y");
    var rightPoint = fncthis.getDrawnExtremePoint(geoj, "max", "x");
    var leftPoint = fncthis.getDrawnExtremePoint(geoj, "min", "x");
    return {"top" : topPoint, "bottom" : bottomPoint,
            "right" : rightPoint, "left" : leftPoint};
};
TransColumn.prototype.getTranscriptionTopPoint = function(geoj){
    // get transcription top point
    var tpoint;
    // console.log("get top coord");
    // console.log(geoj);
    if(geoj["properties"]["regionShape"] === "rectangle"){
        var maxy_real = Math.max(geoj["properties"]["interfaceCoordinates"]["y1_real"],
                            geoj["properties"]["interfaceCoordinates"]["y2_real"]);
        var maxx_real, maxx, maxy;
        if(maxy_real === geoj["properties"]["interfaceCoordinates"]["y1_real"]){
            maxx_real = geoj["properties"]["interfaceCoordinates"]["x1_real"];
            maxx = geoj["properties"]["interfaceCoordinates"]["x1"];
            maxy = geoj["properties"]["interfaceCoordinates"]["y1"];
        }else{
            maxx_real = geoj["properties"]["interfaceCoordinates"]["x2_real"];
            maxx = geoj["properties"]["interfaceCoordinates"]["x2"];
            maxy = geoj["properties"]["interfaceCoordinates"]["y2"];
        }
        tpoint = {"x_real" : maxx_real,
                  "y_real" : maxy_real,
                  "x" : maxx,
                  "y" : maxy};

        // console.log('top point');
        // console.log(tcoord);

        return tpoint;
    }else if(geoj["properties"]["regionShape"] === "polygon"){
        //
        var pointlist = geoj["properties"]["interfaceCoordinates"]["pointlist"];
        var tpointCoordy_real = 0;
        var tpointCoordx, tpointCoordy, tpointCoordx_real;
        for(var i=0; i < pointlist.length; i++){
            var point = pointlist[i];
            var py = parseInt(point["y_real"], 10);
            if(py > tpointCoordy){
                tpointCoordy_real = py;
                tpointCoordx = parseInt(point["x"], 10);
                tpointCoordy = parseInt(point["y"], 10);
                tpointCoordx_real = parseInt(point["x_real"], 10);
            }
        }
        tpoint = {"x" : tpointCoordx,
                  "y" : tpointCoordy,
                  "x_real" : tpointCoordx_real,
                  "y_real" : tpointCoordy_real};
        // console.log('top point');
        // console.log(tcoord);
        return tpoint;
    }
    return tpoint; // null object
};
//
TransColumn.prototype.sortOnTopCoordinate = function(a, b){
    // Sorts the list elements according to
    // their placement on the image
    // console.log("a");
    // console.log(a);
    // console.log("b");
    // console.log(b);

    // get editable lines
    var eline1 = a.getElementsByClassName("transcription-textarea");// returns a list
    var eline2 = b.getElementsByClassName("transcription-textarea");// with single element
    eline1 = eline1[0]; //  get the single element
    eline2 = eline2[0];
    //
    // get drawn id
    var eid1 = eline1.getAttribute("data-drawn-id");
    // console.log("element id 1");
    // console.log(eid1);

    var eid2 = eline2.getAttribute("data-drawn-id");
    // console.log("element id 2");
    // console.log(eid2);
    // console.log("transcriptions");
    // console.log(this.transcriptions);

    // split the string
    var fncthis = this;
    var geoobj1 = this.getTranscriptionByDataId(eid1);
    // console.log("geo1");
    // console.log(geoobj1);

    var geoobj2 = this.getTranscriptionByDataId(eid2);
    // console.log("geo2");
    // console.log(geoobj2);

    var geoobj1y = this.getTranscriptionTopCoord(geoobj1);
    // console.log("geo1y");
    // console.log(geoobj1y);

    var geoobj2y = this.getTranscriptionTopCoord(geoobj2);
    // console.log("geo2y");
    // console.log(geoobj2y);

    // debug code

    // compare:
    // if the the top value is higher
    // that means the line is at a lower section
    // of the page image
    // so that which has a high value
    // should be placed after it is a simple ascending
    // numbers comparison
    //
    return geoobj1y - geoobj2y;
};
TransColumn.prototype.getBboxFromExtremePoints = function(extremePoints){
    // get bbox from extreme points
    var topLeft, bottomRight;
    var topP = extremePoints["top"];
    var leftP = extremePoints["left"];
    var bottomP = extremePoints["bottom"];
    var rightP = extremePoints["right"];

    var bbox = {"x1" : leftP["x_real"],
                "y1" : topP["y_real"],
                "x2" : rightP["x_real"],
                "y2" : bottomP["y_real"]};

    return bbox;
};
TransColumn.prototype.parseBbox = function(bbox){
    // Parse the bbox values
    var bboxsplit = bbox.split(",");
    var bbox_x = parseInt(bboxsplit[0], 10);
    var bbox_y = parseInt(bboxsplit[1], 10);
    var bbox_x2 = parseInt(bboxsplit[2], 10);
    var bbox_y2 = parseInt(bboxsplit[3], 10);
    var newbox  = {};
    newbox.x2 = bbox_x2;
    newbox.y2 = bbox_y2;
    newbox.x1 = bbox_x;
    newbox.y1 = bbox_y;
    //
    return newbox;

};
TransColumn.prototype.checkBbox = function(bbox, drawnObject){
    // Check if given bbox corresponds to hover rect coordinates
    var newbox = this.parseBbox(bbox);
    var hov_x = hoverRect["x1_real"];
    var hov_y = hoverRect["y1_real"];
    var check = false;
    if((newbox.x1 === hov_x) && (newbox.y1 === hov_y)){
        check = true;
    }
    return check;
};
TransColumn.prototype.resetTextareaStyle = function(){
    // resets the class of all textareas to transcription-textarea
    var areaElements = document.getElementsByClassName("area-container");
    for(var i=0; i<areaElements.length; i++){
        var tarea = areaElements[i].firstElementChild;
        var tclass = tarea.getAttribute("class");
        if(tclass === "hovering-transcription-textarea"){
            tarea.setAttribute("class","transcription-textarea");
        }
    }
    return;
};
TransColumn.prototype.emphTransRegion = function(drawnObject){
    // Highlight transcription rectangle which
    // correspond to hovering rect coordinates
    this.resetTextareaStyle();
    // console.log('inside emphTransRegion');
    // console.log(drawnObject);
    var taId = "ta-".concat(drawnObject["properties"]["id"]);
    var taType = drawnObject["properties"]["type"];
    var textarea = document.getElementById(taId);
    textarea.setAttribute("class", "hovering-transcription-textarea");
    return;
};
TransColumn.prototype.getScaleFactor = function(destWidth,
                                                destHeight,
                                                srcWidth,
                                                srcHeight) {
    // Get scale factor for correctly drawing rectangle
    var hratio = destWidth / srcWidth;
    var vratio = destHeight / srcHeight;
    var ratio = Math.min(hratio, vratio);
    //
    return [hratio, vratio, ratio];
};
TransColumn.prototype.removeInlineCanvas = function(){
    // remove the line viewer from dom
    var oldviewer = document.getElementById("area-viewer");
    if (oldviewer != null){
        document.getElementById("area-viewer").remove();
    }
    var viewerContainer = document.getElementById("area-viewer-container");
    if(viewerContainer != null){
        viewerContainer.parentNode.removeChild(viewerContainer);
    }
    var onfocusIG = document.querySelector("li.onfocus-item-group");
    if (onfocusIG != null){
        onfocusIG.setAttribute("class", "item-group");
    }
    var onfocusTA = document.querySelector("textarea.onfocus-transcription-textarea");
    if(onfocusTA != null){
        onfocusTA.setAttribute("class", "transcription-textarea");
    }
    return;
};
TransColumn.prototype.drawBbox = function(areaCanvas,
                                          image, cwidth,
                                          cheight, context,
                                          bbox){
    // Draw bbox on context
    var imnwidth = Math.abs(bbox.x2 - bbox.x1);
    var imnheight = Math.abs(bbox.y2 - bbox.y1);
    var ratiolist  = this.getScaleFactor(cwidth, //dest width
                                         cheight, // dest height
                                         imnwidth, // src width
                                         imnheight); // src height
    var ratio = ratiolist[2];
    var scaledWidth = ratio * imnwidth;
    var scaledHeight = ratio * imnheight;
    areaCanvas.setAttribute("width", scaledWidth);
    areaCanvas.setAttribute("height", scaledHeight);

    context.drawImage(image,
                      // 0,0,
                      bbox.x1, bbox.y1, // source coordinate
                      imnwidth,
                      imnheight,
                      0,0,
                      scaledWidth, scaledHeight
                     );
    return [areaCanvas, context];
};
TransColumn.prototype.drawAreaOnCanvas =  function(event){
    /*
      Draw the line on a canvas for selected transcription area
      Finds the selected transcription area
      Parses its bbox
      Creates a canvas
      Draws the associated coordinates of the image found in bbox
      on canvas
    */
    if(this.viewerCheck === false){
        this.removeInlineCanvas();
        return;
    }
    // remove old viewer
    this.removeInlineCanvas();

    // create viewer container
    var viewerContainer = document.createElement("li");
    viewerContainer.setAttribute("id", "area-viewer-container");

    // create viewer
    var areaCanvas = document.createElement("canvas");
    areaCanvas.setAttribute("id","area-viewer");

    // Get identifiers
    var textArea = event.target;
    var drawnId = textArea.getAttribute("data-drawn-id");
    var domid = textArea.getAttribute("id");
    var index = domid.replace(/[^0-9]/g, '');

    // get the corresponding area widget and area element
    // and the item group
    var idAreaEl = this.createIdWithPrefix(index,"ac");
    var areaElement = document.getElementById(idAreaEl);

    var idItemGroup = this.createIdWithPrefix(index, "ig");
    var itemGroup = document.getElementById(idItemGroup);

    var idItemList = this.createIdWithPrefix(index, "il");
    var itemList = document.getElementById(idItemList);

    // get the drawing geojson object with bbox

    // get the drawing geojson object
    var transGeojObj = this.getTranscriptionByDataId(drawnId);

    // get the bbox
    var bbox;
    var fncthis = this;
    var areaContextList;
    if(transGeojObj["properties"]["regionShape"] === "rectangle"){
        // console.log(transGeojObj);
        bbox = this.parseBbox(transGeojObj["properties"]["interfaceCoordinates"]["bbox"]);
    }else if(transGeojObj["properties"]["regionShape"] === "polygon"){
        var expoints = this.getDrawnExtremePoints(transGeojObj);
        bbox = this.getBboxFromExtremePoints(expoints);
    }

    // set width and height to viewer

    // if original size is checked viewer is sized
    // according to image else we use the parent widget
    if(this.originalSize === false){
        areaCanvas.width = areaElement.clientWidth;
        areaCanvas.height = areaElement.clientHeight;
    }else{
        areaCanvas.width = Math.abs(bbox.x2 - bbox.x1);
        areaCanvas.height = Math.abs(bbox.y2 - bbox.y1);

        // add the necessary styling attributes
        itemGroup.setAttribute("class", "onfocus-item-group");
        viewerContainer.setAttribute("class", "onfocus-viewer-container");
    }
    var ctxt = areaCanvas.getContext('2d');

    // get canvas width / height, image
    var nimage = this.image;
    var cwidth = areaCanvas.width;
    var cheight = areaCanvas.height;

    areaContextList= fncthis.drawBbox(areaCanvas,
                                      nimage,
                                      cwidth,
                                      cheight,
                                      ctxt,
                                      bbox);
    areaCanvas = areaContextList[0];
    ctxt = areaContextList[1];

    // add the area to corresponding area element
    viewerContainer.appendChild(areaCanvas);
    itemList.prepend(viewerContainer);

    return transGeojObj;
};
// => transGeojObj / null

TransColumn.prototype.saveTranscription = function(){
    // Opens up a transcription window with
    // transcription text in it.
    var translines = document.getElementsByClassName("editable-textarea");
    var texts = "";
    var textlist = [];
    //
    for(var i=0; i < translines.length; i++){
        //
        var line = translines[i];
        var text = line.innerText;
        var linetext = "".concat(i);
        linetext = linetext.concat(". ");
        linetext = linetext.concat(text);
        textlist.push(linetext);
        linetext = linetext.concat("%0d%0a");
        texts = texts.concat(linetext);
    }
    //
    var stringfied = JSON.stringify(textlist);
    window.open('data:application/json; charset=utf-8,' + stringfied);
    window.open('data:text/.txt; charset=utf-8,' + texts);
};
// => null

TransColumn.prototype.setTranscriptionText = function(){
    // gets the text in transcription column
    var areaElements = document.getElementsByClassName("area-container");
    for(var i=0; i<areaElements.length; i++){
        var tarea = areaElements[i].firstElementChild;
        var drawnid = tarea.getAttribute("data-drawn-id");
        var transObjCp = this.getTranscriptionByDataId(drawnid);
        this.transcriptions["features"] = this.removeFeatureById(
            this.transcriptions["features"], drawnid
        );
        transObjCp["properties"]["text"] = tarea.value;
        this.transcriptions["features"].push(transObjCp);
    }
    return;
};
// => null

var InterfaceEventHandler = function(){
    var obj = Object.create(InterfaceEventHandler.prototype);
    this.modeList = ['global',
                     'drawing',
                     'modifying'];
    this.mode = "";
    return obj;
};
InterfaceEventHandler.prototype.addRemoveCommonEventListeners = function(isAdd
                                                                        ){
    // Add or remove common event listeners

    // events related to image list
    if(isAdd === true){
        addListenerByIdF('upload-image-btn',
                         'click',
                         uploadImage);
    }else{
        removeListenerByIdF('upload-image-btn',
                            'click',
                            uploadImage);
    }
    if(isAdd === true){
        addListenerByIdF('image-file-input',
                         'change',
                         load2ImageList);
    }else{
        removeListenerByIdF('image-file-input',
                            'change',
                            load2ImageList);
    }
    console.log("loading event listeners");

    if(isAdd === true){
        addListenerByIdF('showtoolbox-checkbox',
                         'change',
                         showToolBox);
    }else{
        removeListenerByIdF('showtoolbox-checkbox',
                         'change',
                         showToolBox);
    }
    console.log("showToolBox loaded");

    if(isAdd === true){
        addListenerByIdF('debug-cbox',
                         'change',
                         setDebug);
    }else{
        removeListenerByIdF('debug-cbox',
                            'change',
                            setDebug);
    }
    console.log("debug loaded");

    // ------------- selector-types -------------------

    if(isAdd === true){
        addListenerByIdF('poly-selector-rbtn',
                         'change',
                         setSelectorType);
    }else{
        removeListenerByIdF('poly-selector-rbtn',
                            'change',
                            setSelectorType);
    }
    if(isAdd === true){
        addListenerByIdF('rect-selector-rbtn',
                         'change',
                         setSelectorType);
    }else{
        removeListenerByIdF('rect-selector-rbtn',
                            'change',
                            setSelectorType);
    }
    if(isAdd === true){
        addListenerByIdF('none-selector-rbtn',
                         'change',
                         setSelectorType);
    }else{
        removeListenerByIdF('none-selector-rbtn',
                            'change',
                            setSelectorType);
    }
    if(isAdd === true){
        addListenerByIdF('modify-selector-rbtn',
                         'change',
                         setSelectorType);
    }else{
        removeListenerByIdF('modify-selector-rbtn',
                            'change',
                            setSelectorType);
    }
    console.log("set selector type loaded");

    // viewer-tools

    console.log("add selection loaded");

    if(isAdd === true){
        addListenerByIdF('selector-stroke-color-list',
                         'change',
                         setSelectorStrokeColor);
    }else{
        removeListenerByIdF('selector-stroke-color-list',
                            'change',
                            setSelectorStrokeColor);
    }
    console.log("selector stroke color");

    if(isAdd === true){
        addListenerByIdF('selector-fill-color-list',
                         'change',
                         setSelectorFillColor);
    }else{
        removeListenerByIdF('selector-fill-color-list',
                            'change',
                            setSelectorFillColor);
    }
    console.log("selector fill color");

    if(isAdd === true){
        addListenerByIdF('selector-fill-opacity-range',
                         'change',
                         setSelectorFillOpacity);
    }else{
        removeListenerByIdF('selector-fill-opacity-range',
                            'change',
                            setSelectorFillOpacity);
    }
    console.log("selector fill opacity");

    if(isAdd === true){
        addListenerByIdF('detection-stroke-color-list',
                         'change',
                         setDetectionStrokeColor);
    }else{
        removeListenerByIdF('detection-stroke-color-list',
                            'change',
                            setDetectionStrokeColor);
    }
    console.log("detection stroke color");

    if(isAdd === true){
        addListenerByIdF('detection-fill-color-list',
                         'change',
                         setDetectionFillColor);
    }else{
        removeListenerByIdF('detection-fill-color-list',
                            'change',
                            setDetectionFillColor);
    }
    console.log("detection fill color");

    if(isAdd === true){
        addListenerByIdF('detection-fill-opacity-range',
                         'change',
                         setDetectionFillOpacity);
    }else{
        removeListenerByIdF('detection-fill-opacity-range',
                            'change',
                            setDetectionFillOpacity);
    }
    console.log("detection fill opacity");

    if(isAdd === true){
        addListenerByIdF('color-scheme-list',
                         'change',
                         setColorScheme);
    }else{
        removeListenerByIdF('color-scheme-list',
                            'change',
                            setColorScheme);
    }
    console.log("color scheme opacity");

    if(isAdd === true){
        addListenerByIdF('viewer-slide-btn',
                         'click',
                         slideFncViewer);
    }else{
        removeListenerByIdF('viewer-slide-btn',
                            'click',
                            slideFncViewer);
    }
    console.log("slide func viewer loaded");

    if(isAdd === true){
        addListenerByIdF('deleteButton',
                         'click',
                         deleteBoxes);
    }else{
        removeListenerByIdF('deleteButton',
                            'click',
                            deleteBoxes);
    }
    console.log("delete boxes loaded");

    if(isAdd === true){
        addListenerByIdF('undodeleteButton',
                         'click',
                         undoDeletion);
    }else{
        removeListenerByIdF('undodeleteButton',
                            'click',
                            undoDeletion);
    }
    console.log("undo delete boxes loaded");

    if(isAdd === true){
        addListenerByIdF('saveEverythingButton',
                         'click',
                         saveEverything);
    }else{
        removeListenerByIdF('saveEverythingButton',
                            'click',
                            saveEverything);
    }
    console.log("save everything loaded");

    if(isAdd === true){
        addListenerByIdF('transcriber-slide-btn',
                         'click',
                         slideFncTranscripter);
    }else{
        removeListenerByIdF('transcriber-slide-btn',
                            'click',
                            slideFncTranscripter);
    }
    console.log("slideFncTranscripter loaded");

    if(isAdd === true){
        addListenerByIdF('select-all-transcriptions-cbox',
                         'change',
                         selectAllTranscriptions);
    }else{
        removeListenerByIdF('select-all-transcriptions-cbox',
                            'change',
                            selectAllTranscriptions);
    }
    console.log("select all transcriptions loaded");

    if(isAdd === true){
        addListenerByIdF('markRTLTranscriptionButton',
                         'click',
                         markRTLTranscription);
    }else{
        removeListenerByIdF('markRTLTranscriptionButton',
                            'click',
                            markRTLTranscription);
    }
    console.log("markRTLTranscription loaded");

    if(isAdd === true){
        addListenerByIdF('markLTRTranscriptionButton',
                         'click',
                         markLTRTranscription);
    }else{
        removeListenerByIdF('markLTRTranscriptionButton',
                            'click',
                            markLTRTranscription);
    }
    console.log("markLTRTranscription loaded");

    if(isAdd === true){
        addListenerByIdF('activate-viewer-cbox',
                         'click',
                         activateViewer);
    }else{
        removeListenerByIdF('activate-viewer-cbox',
                            'click',
                            activateViewer);
    }
    console.log("activateViewer loaded");

    if(isAdd === true){
        addListenerByClassF('transcription-textarea',
                            'focus',
                            viewLine);
    }else{
        removeListenerByClassF('transcription-textarea',
                               'focus',
                               viewLine);
    }

    if(isAdd === true){
        addListenerByIdF('original-size-cbox',
                         'change',
                         loadOriginalSize);
    }else{
        removeListenerByIdF('original-size-cbox',
                            'change',
                            loadOriginalSize);
    }
    console.log("loadOriginalSize loaded");

};
InterfaceEventHandler.prototype.addCommonEventListeners = function(){
    // event listeners common for all the modes
    return this.addRemoveCommonEventListeners(true);
};
InterfaceEventHandler.prototype.removeCommonEventListeners = function(){
    // event listeners common for all the modes
    return this.addRemoveCommonEventListeners(false);
};
InterfaceEventHandler.prototype.addRemoveGlobalEventListeners = function(isAdd
                                                                        ){
    // add or remove global event listeners
    if(isAdd === true){
        addListenerByClassF("image-link",
                            'click',
                            loadImage2Viewer);
    }else{
        removeListenerByClassF("image-link",
                               'click',
                               loadImage2Viewer);
    }
    console.log("image2viewer loaded");

    if(isAdd === true){
        addListenerByIdF('resetScene',
                         'click',
                         resetScene);
    }else{
        removeListenerByIdF('resetScene',
                            'click',
                            resetScene);
    }
    console.log("reset scene loaded");

    // ------------- selector-set ---------------------

    var holdSelection = function(){};
    if(isAdd === true){
        addListenerByIdF('selector-hold-cbox',
                         'change',
                         holdSelection);
    }else{
        removeListenerByIdF('selector-hold-cbox',
                            'change',
                            holdSelection);
    }

    console.log("hold selection loaded");

    // ------------- ends selector-types -------------------

    // ------------- selector-options -------------------

    if(isAdd === true){
        addListenerByIdF('showall-detected-cbox',
                         'change',
                         showAllDetections);
    }else{
        removeListenerByIdF('showall-detected-cbox',
                            'change',
                            showAllDetections);
    }
    console.log("show all detections loaded");

    if(isAdd === true){
        addListenerByIdF('showall-selected-cbox',
                         'change',
                         showAllSelections);
    }else{
        removeListenerByIdF('showall-selected-cbox',
                            'change',
                            showAllSelections);
    }
    console.log("show all selections loaded");

    if(isAdd === true){
        addListenerByIdF('showall-cbox',
                         'change',
                         showAllEverything);
    }else{
        removeListenerByIdF('showall-cbox',
                            'change',
                            showAllEverything);
    }
    console.log("show all everything loaded");

    // ------------- ends Viewer Options --------------------------
    // ------------------ Mouse Events ----------------------------

    addListenerByIdF('scene',
                     'mouseup',
                     globalMouseUpScene
                    );
    console.log("mouse up loaded");

    addListenerByIdF('scene',
                     'mousedown',
                     globalMouseDownScene
                    );
    console.log("mouse down loaded");

    addListenerByIdF('scene',
                     'mousemove',
                     globalMouseMoveScene
                    );
    console.log("mouse move loaded");

    // ends Mouse Events -------------------------------------------------

    // Transcription Related Functions
    if(isAdd === true){
        addListenerByIdF('upload-transcription-btn',
                         'click',
                         uploadTranscription);
    }else{
        removeListenerByIdF('upload-transcription-btn',
                            'click',
                            uploadTranscription);
    }

    if(isAdd === true){
        addListenerByIdF('upload-geojson-btn',
                         'click',
                         uploadGeojson);
    }else{
        removeListenerByIdF('upload-geojson-btn',
                            'click',
                            uploadGeojson);
    }
};
InterfaceEventHandler.prototype.addGlobalEventListeners = function(){
    // event listeners for global mode
    return this.addRemoveGlobalEventListeners(true);
};
InterfaceEventHandler.prototype.removeGlobalEventListeners = function(){
    // event listeners for global mode
    return this.addRemoveGlobalEventListeners(false);
};
InterfaceEventHandler.prototype.addRemoveDrawingEventListeners = function(isAdd){
    // add or remove event listeners for drawing mode

    if(isAdd === true){
        addListenerByClassF('viewer-region-type',
                            'click',
                            changeAddTTitle);
    }else{
        removeListenerByClassF('viewer-region-type',
                               'click',
                               changeAddTTitle
                              );
    }

    console.log("changeAddTTitle loaded");

    if(isAdd === true){
        addListenerByIdF('addTranscriptionButton',
                         'click',
                         addTranscription);
    }else{
        removeListenerByIdF('addTranscriptionButton',
                            'click',
                            addTranscription);
    }

    console.log("add Transcription loaded");

    if(isAdd === true){
        addListenerByIdF('scene',
                         'mouseup',
                         drawingMouseUp);
    }else{
        removeListenerByIdF('scene',
                            'mouseup',
                            drawingMouseUp);
    }
    console.log("drawing mouse up loaded");

    if(isAdd === true){
        addListenerByIdF('scene',
                         'mousedown',
                         drawingMouseDown);
    }else{
        removeListenerByIdF('scene',
                            'mousedown',
                            drawingMouseDown);
    }
    console.log("drawing mouse down loaded");

    if(isAdd === true){
        addListenerByIdF('scene',
                         'mousemove',
                         drawingMouseMove);
    }else{
        removeListenerByIdF('scene',
                            'mousemove',
                            drawingMouseMove);
    }
    console.log("drawing mouse move loaded");

}
InterfaceEventHandler.prototype.addDrawingEventListeners = function(){
    // set events for drawing mode
    return this.addRemoveDrawingEventListeners(true);
};
InterfaceEventHandler.prototype.removeDrawingEventListeners = function(){
    // set events for drawing mode
    return this.addRemoveDrawingEventListeners(false);
};
InterfaceEventHandler.prototype.addRemoveModifyingEventListeners = function(isAdd){
    // add or remove event listeners to modifying mode
    if(isAdd === true){
        addListenerByClassF('viewer-region-type',
                            'click',
                            changeAddTTitle
                           );
    }else{
        removeListenerByClassF('viewer-region-type',
                               'click',
                               changeAddTTitle
                              );
    }
    console.log("changeAddTTitle loaded");
    if(isAdd === true){
        addListenerByIdF('addTranscriptionButton',
                         'click',
                         addTranscription);
    }else{
        removeListenerByIdF('addTranscriptionButton',
                            'click',
                            addTranscription
                           );
    }
    console.log("add Transcription loaded");
};
InterfaceEventHandler.prototype.addModifyingEventListeners = function(){
    // set event listeners tailored for modifying mode
    return this.addRemoveModifyingEventListeners(true);
};
InterfaceEventHandler.prototype.removeModifyingEventListeners = function(){
    // set event listeners tailored for modifying mode
    return this.addRemoveModifyingEventListeners(false);
};
InterfaceEventHandler.prototype.addTranscribingEventListeners = function(){
    // set event listeners tailored for transcribing mode
};
InterfaceEventHandler.prototype.addEventListenersWithMode = function(modeName){
    // add event listeners with respect to given mode
    this.addCommonEventListeners();
        //
    switch(modeName){
    case "global":
        this.addGlobalEventListeners();
        break;
    case "drawing":
        this.addDrawingEventListeners();
        break;
    case "modifying":
        this.addModifyingEventListeners();
        break;
    case "transcribing":
        this.addTranscribingEventListeners();
        break;
    default:
        this.addGlobalEventListeners();
        break;
    }
};
InterfaceEventHandler.prototype.removeEventListenersWithMode = function(modeName){
    // add event listeners with respect to given mode
    switch(modeName){
    case "global":
        this.removeGlobalEventListeners();
        break;
    case "drawing":
        this.removeDrawingEventListeners();
        break;
    case "modifying":
        this.removeModifyingEventListeners();
        break;
    case "transcribing":
        this.removeTranscribingEventListeners();
        break;
    }
};
InterfaceEventHandler.prototype.activateGlobalEvents = function(){
    // activate global mode events
    var fncthis = this;
    console.log(fncthis);
    this.removeEventListenersWithMode("modifying");
    this.removeEventListenersWithMode("drawing");
    this.addEventListenersWithMode('global');
    this.mode = "global";
};
InterfaceEventHandler.prototype.activateDrawingEvents = function(){
    // activate drawing mode events
    var fncthis = this;
    this.removeEventListenersWithMode("global");
    this.removeEventListenersWithMode("modifying");
    this.addEventListenersWithMode('drawing');
    this.mode = "drawing";
};
InterfaceEventHandler.prototype.activateModifyingEvents = function(){
    // activate modifying mode events
    var fncthis = this;
    this.removeEventListenersWithMode("global");
    this.removeEventListenersWithMode("drawing");
    fncthis.addEventListenersWithMode('modifying');
    this.mode = "modifying";
};
InterfaceEventHandler.prototype.activateTranscribingEvents = function(){
    // activate transcribing mode events
    var fncthis = this;
    fncthis.addEventListenersWithMode('transcribing');
    this.mode = "transcribing";
};

// Done Classes

// Instances
let canvasDraw = new CanvasRelated();

let transcription = new TransColumn();

let ImList = new ImageListWidget();

let InterfaceEvents = new InterfaceEventHandler();

let InterfaceInstance = new Interface(
    canvasDraw,
    transcription,
    ImList,
    InterfaceEvents
);

// load image to canvas


// keyboard events triggering functions in classes

// ------------- Events -------------------------


function viewLine(event){
    var transGeoj = transcription.drawAreaOnCanvas(event);
    // console.log(transGeoj);
    canvasDraw.redrawDetection(transGeoj);
};

// ------------ Utility functions -------------

function addRemoveListenerById(isAdd,
                               id,
                               eventType,
                               fn,
                               isBubble){
    // add or remove event listener by using element id
    var el = document.getElementById(id);
    if(isAdd === true){
        el.addEventListener(eventType, fn, isBubble);
    }else{
        el.removeEventListener(eventType, fn, isBubble);
    }
}

function addListenerById(id, // id of the dom object
                         eventType,  // event type to associate
                         fn,  // function to add as event
                         boolvar // for bubbling etc
                        ){
    return addRemoveListenerById(true,
                                 id,
                                 eventType,
                                 fn,
                                 boolvar);
}
function addListenerByIdF(id, // id of the dom object
                         eventType,  // event type to associate
                         fn,  // function to add as event
                         boolvar // for bubbling etc
                        ){
    return addListenerById(id, eventType, fn, false);
}
function addListenerByIdT(id, // id of the dom object
                          eventType,  // event type to associate
                          fn,  // function to add as event
                          boolvar // for bubbling etc
                         ){
    return addListenerById(id, eventType, fn, true);
}

function removeListenerById(id, // id of the dom object
                            eventType,  // event type to associate
                            fn,  // function to add as event
                            boolvar // for bubbling etc
                           ){
    return addRemoveListenerById(false,
                                 id,
                                 eventType,
                                 fn,
                                 boolvar);
}
function removeListenerByIdF(id, // id of the dom object
                         eventType,  // event type to associate
                         fn,  // function to add as event
                         boolvar // for bubbling etc
                        ){
    return removeListenerById(id, eventType, fn, false);
}

function removeListenerByIdT(id, // id of the dom object
                          eventType,  // event type to associate
                          fn,  // function to add as event
                          boolvar // for bubbling etc
                         ){
    return removeListenerById(id, eventType, fn, true);
}

function addRemoveListenerByClass(isAdd,
                                  classname,
                                  eventType, fn,
                                  isBubble){
    // add or remove event listener by class
    var elements = document.getElementsByClassName(classname);
    var listlen = elements.length;
    for(var i=0; i<listlen; i++){
        var el = elements[i];
        if(isAdd === true){
            el.addEventListener(eventType, fn, isBubble);
        }else{
            el.removeEventListener(eventType, fn, isBubble);
        }
    }
}

function addListenerByClass(classname,
                            eventType,
                            fn,
                            boolvar
                           ){
    return addRemoveListenerByClass(true, classname,
                                    eventType, fn,
                                    boolvar);
}
function addListenerByClassF(classname, eventType,
                             fn){
    return addListenerByClass(classname, eventType,
                              fn, false);
}

function addListenerByClassT(classname, eventType,
                             fn){
    return addListenerByClass(classname, eventType,
                              fn, true);
}


function removeListenerByClass(classname,
                               eventType,
                               fn,
                               boolvar
                              ){
    return addRemoveListenerByClass(false, classname,
                                    eventType, fn,
                                    boolvar);
}

function removeListenerByClassF(classname, eventType,
                                fn){
    return removeListenerByClass(classname,
                                 eventType,
                                 fn,
                                 false);
}

function removeListenerByClassT(classname, eventType,
                                fn){
    return removeListenerByClass(classname, eventType,
                                 fn, true);
}


// ------------ Common Events ------------------


function load2ImageList(){
    // load the image to image list
    var img = ImList.getImageFile();
    ImList.addImage2List(img);
};

// image-list Section

function hideDisplayContainer(container){
    // hide or display container using css
    var contClass = container.getAttribute("class");
    if(contClass === "visible"){
        container.setAttribute("class", "invisible");
    }else if(contClass === "invisible"){
        container.setAttribute("class", "visible");
    }
}

function showToolBox(){
    var container = document.getElementById("hide-tools-transcriber");
    hideDisplayContainer(container);
    container = document.getElementById("hide-tools-viewer");
    hideDisplayContainer(container);
};

function slideFncViewer(){
    var container = document.getElementById("hide-tools-viewer");
    hideDisplayContainer(container);
};

function slideFncTranscripter(){
    var container = document.getElementById("hide-tools-transcriber");
    hideDisplayContainer(container);
};



function getRgbCode(className, listName){
    // extract rgb code from selected option
    var selectedValue = document.getElementById(listName).value;
    var colorOptions = document.getElementsByClassName(className);
    var rgbval;
    for(var i=0; i<colorOptions.length; i++){
        var colorOption = colorOptions[i];
        var optionValue = colorOption.getAttribute("value");
        if(optionValue === selectedValue){
            rgbval = colorOption.getAttribute("data-rgb");
        };
    };
    return rgbval;
};

function setSelectorStrokeColor(){
    // set selector stroke color to viewer
    var rgbcode = getRgbCode("selector-stroke-color",
                             "selector-stroke-color-list");
    canvasDraw.selectorOptions.strokeColor = rgbcode;
    return;
};

function setSelectorFillColor(){
    // set selector fill color to viewer
    var rgbcode = getRgbCode("selector-fill-color",
                             "selector-fill-color-list");
    canvasDraw.selectorOptions.fillColor = rgbcode;
    return;
};

function setSelectorFillOpacity(){
    // set selector fill opacity to viewer
    var selectedValue = document.getElementById("selector-fill-opacity-range").value;
    canvasDraw.selectorOptions.fillOpacity = parseFloat(selectedValue, 10);
    return;
};

function setDetectionStrokeColor(){
    // set detection stroke color to viewer
    var rgbcode = getRgbCode("detection-stroke-color",
                             "detection-stroke-color-list");
    canvasDraw.detectionOptions.strokeColor = rgbcode;
    return;
};

function setDetectionFillColor(){
    // set detection fill color to viewer
    var rgbcode = getRgbCode("detection-fill-color",
                             "detection-fill-color-list");
    canvasDraw.detectionOptions.fillColor = rgbcode;
    return;
};

function setDetectionFillOpacity(){
    // set detection fill opacity to viewer
    var selectedValue = document.getElementById("detection-fill-opacity-range").value;
    canvasDraw.detectionOptions.fillOpacity = parseFloat(selectedValue, 10);
    return;
};

function setColorScheme(){
        // set color schemes for drawing
    var selectedVal = document.getElementById("color-scheme-list").value;
    switch(selectedVal){
        //
    case "red":
        // red borders orange yellow fill
        canvasDraw.detectionOptions.strokeColor = "255,153,0"; // orange borders
        canvasDraw.selectorOptions.strokeColor = "255,0,0"; // red borders
        canvasDraw.detectionOptions.fillColor = "255,255,102"; // light orange fill
        canvasDraw.selectorOptions.fillColor = "255,204,0"; // orange fill
        canvasDraw.detectionOptions.fillOpacity = "0.1";
        canvasDraw.selectorOptions.fillOpacity = "0.2";
        break;
    case "yellow":
        canvasDraw.detectionOptions.strokeColor = "255,255,0"; // bright yellow borders
        canvasDraw.selectorOptions.strokeColor = "255,216,0"; // yellow borders
        canvasDraw.detectionOptions.fillColor = "88,112,88"; // finlandia green fill
        canvasDraw.selectorOptions.fillColor = "88,116,152"; // waikawa gray fill
        canvasDraw.detectionOptions.fillOpacity = "0.1";
        canvasDraw.selectorOptions.fillOpacity = "0.2";
        break;
    case "green":
        canvasDraw.detectionOptions.strokeColor = "0,100,4"; // light dark green borders
        canvasDraw.selectorOptions.strokeColor = "0,85,2"; // dark green borders
        canvasDraw.detectionOptions.fillColor = "204,255,187"; // light green fill
        canvasDraw.selectorOptions.fillColor = "58,127,11"; // darker light green fill
        canvasDraw.detectionOptions.fillOpacity = "0.1";
        canvasDraw.selectorOptions.fillOpacity = "0.2";
        break;
    case "blue":
        canvasDraw.detectionOptions.strokeColor = "0,153,204"; // blue borders
        canvasDraw.selectorOptions.strokeColor = "0,51,153"; // dark blue borders
        canvasDraw.detectionOptions.fillColor = "204,255,204"; // blue green fill
        canvasDraw.selectorOptions.fillColor = "102,204,255"; // blue fill
        canvasDraw.detectionOptions.fillOpacity = "0.1";
        canvasDraw.selectorOptions.fillOpacity = "0.2";
        break;
    case "purple":
        canvasDraw.detectionOptions.strokeColor = "140,72,159"; // dark purple borders
        canvasDraw.selectorOptions.strokeColor = "68,50,102"; // darker purple borders
        canvasDraw.detectionOptions.fillColor = "241,240,255"; // light purple fill
        canvasDraw.selectorOptions.fillColor = "195,195,229"; // orange fill
        canvasDraw.detectionOptions.fillOpacity = "0.1";
        canvasDraw.selectorOptions.fillOpacity = "0.2";
        break;
    case "pink":
        canvasDraw.detectionOptions.strokeColor = "181,138,165"; // deep pink borders
        canvasDraw.selectorOptions.strokeColor = "132,89,107"; // crimson borders
        canvasDraw.detectionOptions.fillColor = "206,207,206"; // gray fill
        canvasDraw.selectorOptions.fillColor = "102,127,127"; // darker gray fill
        canvasDraw.detectionOptions.fillOpacity = "0.1";
        canvasDraw.selectorOptions.fillOpacity = "0.2";
        break;
    default:
        canvasDraw.detectionOptions.strokeColor = "120,120,120"; // gray borders
        canvasDraw.selectorOptions.strokeColor = "0,0,0"; // black borders
        canvasDraw.detectionOptions.fillColor = "120,120,120"; // gray fill
        canvasDraw.selectorOptions.fillColor = "0,0,0"; // black fill
        canvasDraw.detectionOptions.fillOpacity = "0.1";
        canvasDraw.selectorOptions.fillOpacity = "0.2";
        // break;
    };
    return;
};

function deleteBoxes(){
    var delArray = transcription.deleteBoxes();
    // console.log("del array");
    // console.log(delArray);
    canvasDraw.removeDrawnObjects(delArray);
    transcription.sortLines();
};

function undoDeletion(){
    console.log("in undo event");
    var drawnFeature = transcription.undoDeletion();
    canvasDraw.drawnObjects["features"].push(drawnFeature);
    transcription.sortLines();
};


function saveEverything(){
    // Saves the lines for transcribed coordinates
    // var textlines = transcription.getTranscriptions();
    // var coordinates = canvasDraw.getCoordinates();
    // var savelines = [];
    // // TODO change coordinates.length to textlines.length
    // // since we have less coordinates than transcriptions
    // // for now, we need to deal with undefined objects this way
    // for(var i=0; i < coordinates.length; i++){
    //     var tline = textlines[i];
    //     var cline = coordinates[i];
    //     var newcline = Object.assign(cline);
    //     newcline.index = tline.index;
    //     newcline.text = tline.lineText;
    //     savelines.push(newcline);
    // };
    transcription.setTranscriptionText();
    var stringfied = JSON.stringify(transcription.transcriptions, null, 4);

    // Download stringified json
    var dlink = document.createElement("a");
    dlink.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(stringfied));
    dlink.setAttribute("download", "coordinatesAndText.json");
    dlink.setAttribute("style", "display: none;");
    document.body.appendChild(dlink);
    dlink.click();
    document.body.removeChild(dlink);

    var w = window.innerWidth.toString();
    var h = window.innerHeight.toString();
    w = "width=".concat(w);
    h = "height=".concat(h);
    var spec = w.concat(",");
    spec = spec.concat(h);
    var saveWindow = window.open("", "Save Window", spec);
    saveWindow.document.write("<pre>");
    saveWindow.document.write(stringfied);
    saveWindow.document.write("</pre>");
};


function selectAllTranscriptions(){
    //
    transcription.selectAllTranscriptions();
};


// ------------ Global Events ------------------

function loadImage2Viewer(event){
    // load image to viewer
    ImList.passImage2Viewer(event, canvasDraw);
    canvasDraw.imageLoad();
    transcription.image = canvasDraw.image.pageImage;
    transcription.hratio = canvasDraw.image.hratio;
    transcription.vratio = canvasDraw.image.vratio;
    transcription.ratio = canvasDraw.image.ratio;
    transcription.loadTranscription(event);
    // console.log(transcription.transcriptions);
    var objcopy = JSON.parse(JSON.stringify(transcription.transcriptions));
    for(var i=0; i< objcopy["features"].length; i++){
        var transFeature = objcopy["features"][i];
        canvasDraw.drawnObjects["features"].push(transFeature);
    }
    canvasDraw.detections = objcopy;
    return;
}
// viewer Section

function resetScene(){
    // reset scene
    canvasDraw.resetScene();
    return;
};

var debug = false;

function setDebug(){
    // set debug mode
    var cbox = document.getElementById("debug-cbox");
    debug = cbox.checked;
    return;
};

function setSelectorType(){
    // set selector type to viewer
    var rbuttons = document.querySelector("input[name='selector-rbtn']:checked");
    var rbtnval = rbuttons.value;
    canvasDraw.selectorOptions.type = rbtnval;
    switch(rbtnval){
    case "none-selector":  // activates global mode
        break;
    case "modify-selector": // activates modify mode
        canvasDraw.redrawEverything();
        break;
    default:
        // if the selection is ongoing
        // detections that are already drawn should be
        // removed unless hold check is enabled
        // also we should reset the textarea style
        transcription.resetTextareaStyle();
        canvasDraw.resetScene();
    }
};

function showAllDetections(){
    // show all previously added selections
    var selectval = document.getElementById("showall-detected-cbox");
    if(selectval.checked === true){
        console.log("in showall detections");
        canvasDraw.redrawAllDetectedObjects();
    };
    return;
};

function showAllSelections(){
    // show all previously added selections
    var selectval = document.getElementById("showall-selected-cbox");
    if(selectval.checked === true){
        console.log("in showall selections");
        canvasDraw.redrawAllDrawnObjects();
    };
    return;
};

function showAllEverything(){
    // show everything detected and drawn
    var selectval = document.getElementById("showall-cbox");
    if(selectval.checked === true){
        console.log("in showall everything");
        canvasDraw.redrawEverything();
    };
    return;
};

function setRegionType2Selector(){
    // sets the region type to selector
    var rbtn = document.querySelector("input[name='selected-region-rbtn']:checked");
    var val = rbtn.value;

    // check for the selector
    var rbuttons = document.querySelector("input[name='selector-rbtn']:checked");
    var rbtnval = rbuttons.value;
    if(rbtnval === "polygon-selector"){
        //
        canvasDraw.poly["regionType"] = val;
    }else if(rbtnval === "rectangle-selector"){
        //
        canvasDraw.rect["regionType"] = val;
    };
    return;
};


function globalMouseUpScene(event){
    // mouse up event in global mode
    return;
}
// => null


function globalMouseDownScene(event){
    // mouse down event for global mode
    return;
}
// => null

function globalMouseMoveScene(event){
    // mouse move event for global mode
    var showallDetectedCheck = document.getElementById("showall-detected-cbox");
    var showallSelectedCheck = document.getElementById("showall-selected-cbox");
    var showallCheck = document.getElementById("showall-cbox");
    if(
       (showallCheck.checked === true) ||
           (showallDetectedCheck.checked === true) ||
           (showallSelectedCheck.checked === true)
    ){
        return;
    }else{
        var contextObjectList = canvasDraw.drawDetectionBounds(event);
        transcription.emphTransRegion(contextObjectList[1]);
    // passing drawn object to transcription column
    }
    return;
}
// => null

function uploadTranscription(){
    // synchronise click event with file upload
    var inputTrans = document.getElementById("transcription-file-input");
    inputTrans.click();
};

function uploadGeojson(){
    var inputGeo = document.getElementById("geojson-file-input");
    inputGeo.click();
};

function uploadImage(){
    var inputIm = document.getElementById("image-file-input");
    inputIm.click();
};


// ------------ Drawing&Modifying Mode Events --

function addTranscription(){
    var objnorm = deepcopy(canvasDraw.drawnObject);
    var geojObj = canvasDraw.convertObj2Geojson(objnorm);
    transcription.drawnObject = geojObj;
    transcription.addTranscription();
    var selectval = InterfaceEvents.mode;
    if(
       (selectval === "drawing") || (selectval === "modifying")
    ){
        //
        canvasDraw.addSingleDrawnObject();
    };
};

function changeAddTTitle(){

    var rbtn = document.querySelector("input[name='selected-region-rbtn']:checked");
    var val = rbtn.value;

    var addTbtn = document.getElementById("addTranscriptionButton");
    var addstr = "Add ";
    addTbtn.title = addstr.concat(val);

    // calling region type setter
    setRegionType2Selector();
    return;
};

// ------------ Drawing Mode Events ------------

function drawingMouseDown(event){
    // drawing mode mouse down event
    // set boolean checks
    canvasDraw.inMouseUp = false; // necessary for closing polygon
    canvasDraw.mousePressed = true; // necessary for events with mouse press

    // get the type of the region that is being selected
    var rbuttons = document.querySelector("input[name='selected-region-rbtn']:checked");
    var rbtnval;
    if(rbuttons != null){
        rbtnval = rbuttons.value;
    }else{
        alert("Please Select the Region Type before adding the selection");
    };

    // get the selector type that is going to be used for selection
    var selectorType = canvasDraw.selectorOptions.type;
    if(selectorType === ""){
        alert("Please select a selector type");
    }else if(selectorType === "rectangle-selector"){
        // reset the rectangle if the selector is a rectangle
        canvasDraw.rect = {"x1" : "",
                           "shape" : "rectangle",
                           "regionType" : "",
                           "y1" : "",
                           "x1_real" : "",
                           "y1_real" : "",
                           "width" : "",
                           "width_real" : "",
                           "height" : "",
                           "height_real" : "",
                           "imageSessionId" : "",
                           "hratio" : "",
                           "ratio" : "",
                           "vratio" : "",
                           "fillColor" : "",
                           "strokeColor" : "",
                           "fillOpacity" : "",
                           "id" : ""};
        canvasDraw.setRectId();
    }else if(selectorType === "polygon-selector"){
        // reset the polygon if the selector is a polygon
        canvasDraw.poly = {"pointlist" : [],
                           "id" : "",
                           "shape" : "polygon",
                           "regionType" : "",
                           "hratio" : "",
                           "ratio" : "",
                           "vratio" : "",
                           "fillColor" : "",
                           "strokeColor" : "",
                           "fillOpacity" : "",
                           "imageSessionId" : ""};
        canvasDraw.setPolyId();
    };

    // set event coordinates as the selection coordinates
    canvasDraw.setSelectionCoordinates(event);
    // test code
    return;
}

function drawingMouseUp(event){

    // drawin mode mouse up event
    canvasDraw.inMouseUp = true;
        //
    if(canvasDraw.selectorOptions.type === "polygon-selector"){
        var contextObjectList = canvasDraw.drawSelection(event);
        var lastDrawingContext = contextObjectList[0];
        canvasDraw.drawPolygonFill(lastDrawingContext,
                                   canvasDraw.poly);
    }else{
        canvasDraw.drawSelection(event);
    }
    canvasDraw.mousePressed = false;
    return;
}

function drawingMouseMove(event){
    // set values related to mouse movement to scene
    // console.log("in scene mouse move");
    canvasDraw.drawSelection();
    return;
}

// ------------ Modifying Mode Events ----------

function modifyingMouseMove(event){
    if(canvasDraw.image["id"] === ""){
        // return if the image is not loaded yet
        return;
    };
    // else show detection bounds
    var contextObjectList = canvasDraw.drawDetectionBounds(event);
    transcription.emphTransRegion(contextObjectList[1]);
    // passing drawn object to transcription column
}

/*
  Modifying drawn objects

  Choosing a single drawn object:
  I hover above the scene to see the drawn object
  that I want to modify

  I click on the drawn object.
  Drawn object freezes on the scene
  When I get closer to a side or a corner the cursor
  changes to its form.
  When cursor changes its form, I can move the
  the side that triggered the cursor change
  with mouse movements

  Bulk deleting drawn objects:
  I make a rectangle selection on the canvas,
  drawn objects that fall under it are selected:

  I can delete them.
  I can change their stroke color
  I can change their fill color
  I can change their fill opacity

 */

// ------------ Transcription Mode Events ------

function markRTLTranscription(){
    transcription.markRTL();
};

function markLTRTranscription(){
    transcription.markLTR();
};

function activateViewer(){
    var cbox = document.getElementById("activate-viewer-cbox");
    transcription.removeInlineCanvas();
    transcription.viewerCheck = cbox.checked;
    if(cbox.checked === true){
        transcription.resetTextareaStyle();
    }
};

function loadOriginalSize(){
    // change the value of the original size check
    var selectval = document.getElementById("original-size-cbox");
    // canvasDraw.originalSize = selectval.checked;
    transcription.originalSize = selectval.checked;
    return;
};

function sortLines(){
    transcription.sortLines();
};

// ------------ Event Handlers ------------------
/*
  Here is how modes interract with each other

  Global mode is available when not transcribing
  and modifying and drawing

  Drawing is not available when modifying

  Modifying is not available when drawing

 */

// ------------ Mode Setters --------------------

function setInterfaceMode(){
    // set the mode to interface
    // assert given mode name
    console.log('in set interface mode');
    var rbuttons = document.querySelector("input[name='selector-rbtn']:checked");
    var rbtnval = rbuttons.value;
    canvasDraw.selectorOptions.type = rbtnval;
    switch(rbtnval){
    case "none-selector":  // activates global mode
        InterfaceEvents.activateGlobalEvents();
        InterfaceEvents.mode = "global";
        break;
    case "modify-selector": // activates modify mode
        break;
    default:
    }
    return;
}

function setInterfaceMode2Global(){
    // set the interface mode to global
    console.log("in set interface to global mode");
    InterfaceEvents.activateGlobalEvents();
    InterfaceEvents.mode = "global";
}

function setInterfaceMode2Drawing(){
    // set the interface mode to global
    console.log("in set interface to drawing mode");
    InterfaceEvents.activateDrawingEvents();
    InterfaceEvents.mode = "drawing";
    // if the selection is ongoing
    // detections that are already drawn should be
    // removed unless hold check is enabled
    // also we should reset the textarea style
    transcription.resetTextareaStyle();
    // canvasDraw.resetScene();
}

function setInterfaceMode2Modifying(){
    //
    console.log("in set interface to modifying mode");
    InterfaceEvents.activateModifyingEvents();
    InterfaceEvents.mode = "modifying";
    canvasDraw.redrawEverything();
}


function runInterface(){
    // activates the listeners for all modes
    console.log("in run interface");
    addListenerByIdF('poly-selector-rbtn',
                     'change', setInterfaceMode2Drawing);
    console.log("after poly");
    addListenerByIdF('rect-selector-rbtn',
                     'change', setInterfaceMode2Drawing);
    console.log("after rect");
    addListenerByIdF('none-selector-rbtn',
                     'change', setInterfaceMode2Global);
    console.log("after none");
    addListenerByIdF('modify-selector-rbtn',
                     'change', setInterfaceMode2Modifying);
    console.log("after modify");
}

function setSceneMouseDown(event){
    // set scene values for the mouse up event
    var selectval = canvasDraw.selectInProcess;
    var showallDetectedCheck = document.getElementById("showall-detected-cbox");
    var showallSelectedCheck = document.getElementById("showall-selected-cbox");
    var showallCheck = document.getElementById("showall-cbox");
    if(
        (showallCheck.checked === true) ||
            (showallDetectedCheck.checked === true) ||
            (showallSelectedCheck.checked === true)
    ){
        if(selectval === true){
            alert("uncheck show all boxes before selecting a region");
        };
        return;
    };
    if(selectval === true){
        // set boolean checks
        canvasDraw.inMouseUp = false; // necessary for closing polygon
        canvasDraw.mousePressed = true; // necessary for events with mouse press

        // get the type of the region that is being selected
        var rbuttons = document.querySelector("input[name='selected-region-rbtn']:checked");
        var rbtnval;
        if(rbuttons != null){
            rbtnval = rbuttons.value;
        }else{
            alert("Please Select the Region Type before adding the selection");
        };

        // get the selector type that is going to be used for selection
        var selectorType = canvasDraw.selectorOptions.type;
        if(selectorType === ""){
            alert("Please select a selector type");
        }else if(selectorType === "rectangle-selector"){
            // reset the rectangle if the selector is a rectangle
            canvasDraw.rect = {"x1" : "",
                               "shape" : "rectangle",
                               "regionType" : "",
                               "y1" : "",
                               "x1_real" : "",
                               "y1_real" : "",
                               "width" : "",
                               "width_real" : "",
                               "height" : "",
                               "height_real" : "",
                               "imageSessionId" : "",
                               "hratio" : "",
                               "ratio" : "",
                               "vratio" : "",
                               "fillColor" : "",
                               "strokeColor" : "",
                               "fillOpacity" : "",
                               "id" : ""};
            canvasDraw.setRectId();
        }else if(selectorType === "polygon-selector"){
            // reset the polygon if the selector is a polygon
            canvasDraw.poly = {"pointlist" : [],
                               "id" : "",
                               "shape" : "polygon",
                               "regionType" : "",
                               "hratio" : "",
                               "ratio" : "",
                               "vratio" : "",
                               "fillColor" : "",
                               "strokeColor" : "",
                               "fillOpacity" : "",
                               "imageSessionId" : ""};
            canvasDraw.setPolyId();
        };

        // set event coordinates as the selection coordinates
        canvasDraw.setSelectionCoordinates(event);
    };
    // test code
    return;
};
// => null

function setSceneMouseMove(event){
    // set values related to mouse movement to scene
    // console.log("in scene mouse move");
    var showallDetectedCheck = document.getElementById("showall-detected-cbox");
    var showallSelectedCheck = document.getElementById("showall-selected-cbox");
    var showallCheck = document.getElementById("showall-cbox");
    if(
        (showallCheck.checked === true) ||
            (showallDetectedCheck.checked === true) ||
            (showallSelectedCheck.checked === true)
    ){
        return;
    };
    var selectval = canvasDraw.selectInProcess;
    if(selectval === true){
        //
        canvasDraw.drawSelection();
    }else{
        if(canvasDraw.image["id"] === ""){
            // return if the image is not loaded yet
            return;
        };
        // else show detection bounds
        var contextObjectList = canvasDraw.drawDetectionBounds(event);
        transcription.emphTransRegion(contextObjectList[1]);
        // passing drawn object to transcription column
    };
    return;
}
// => null

function setSceneMouseUp(event){
    // set scene values for the mouse up event
    var showallCheck = document.getElementById("showall-cbox");
    if(showallCheck.checked === true){
        return;
    };
    var selectval = canvasDraw.selectInProcess;
    if(selectval === true){
        canvasDraw.inMouseUp = true;
        //
        if(canvasDraw.selectorOptions.type === "polygon-selector"){
            var contextObjectList = canvasDraw.drawSelection(event);
            var lastDrawingContext = contextObjectList[0];
            canvasDraw.drawPolygonFill(lastDrawingContext,
                                       canvasDraw.poly);
        }else{
            canvasDraw.drawSelection(event);
        };
    };
    canvasDraw.mousePressed = false;
    return;
};


/*

function globalEventListeners(){
    // global event listeners added to dom elements

    console.log("loading event listeners");
    addListenerByClass("image-link",
                       'click',
                       function(e){
                           return loadImage2Viewer(e);
                       }
                       );

    console.log("image2viewer loaded");

    addListenerByIdF('showtoolbox-checkbox',
                    'change', showToolBox);
    console.log("showToolBox loaded");
    addListenerByIdF('debug-cbox',
                    'change', setDebug);
    console.log("debug loaded");

    // viewer-tools

    var addSelection = function(){
        // add selection event
        var selectval = canvasDraw.selectInProcess;
        if(selectval === true){
            //
            canvasDraw.addSingleDrawnObject();
        };
        return;
    };
    console.log("add selection loaded");

    addListenerByIdF('resetScene',
                    'click', resetScene);
    console.log("reset scene loaded");


    // ------------- selector-set ---------------------

    // ------------- selector-types -------------------
    

    addListenerByIdF('poly-selector-rbtn',
                    'change', setSelectorType);
    addListenerByIdF('rect-selector-rbtn',
                    'change', setSelectorType);
    addListenerByIdF('none-selector-rbtn',
                    'change', setSelectorType);
    addListenerByIdF('modify-selector-rbtn',
                    'change', setSelectorType);

    console.log("set selector type loaded");

    var holdSelection = function(){};
    addListenerByIdF('selector-hold-cbox',
                    'change', holdSelection);

    console.log("hold selection loaded");

    // ------------- ends selector-types -------------------

    // ------------- selector-options -------------------
    addListenerByIdF('selector-stroke-color-list',
                    'change',
                    setSelectorStrokeColor);
    console.log("selector stroke color");

    addListenerByIdF('selector-fill-color-list',
                    'change',
                    setSelectorFillColor);
    console.log("selector fill color");

    addListenerByIdF('selector-fill-opacity-range',
                    'change',
                    setSelectorFillOpacity);
    console.log("selector fill opacity");

    addListenerByIdF('detection-stroke-color-list',
                    'change',
                    setDetectionStrokeColor);
    console.log("detection stroke color");

    addListenerByIdF('detection-fill-color-list',
                    'change',
                    setDetectionFillColor);
    console.log("detection fill color");

    addListenerByIdF('detection-fill-opacity-range',
                    'change',
                    setDetectionFillOpacity);
    console.log("detection fill opacity");

    addListenerByIdF('color-scheme-list',
                    'change',
                    setColorScheme);
    console.log("color scheme opacity");

    addListenerByIdF('showall-detected-cbox',
                    'change',
                    showAllDetections);
    console.log("show all detections loaded");

    addListenerByIdF('showall-selected-cbox',
                    'change',
                    showAllSelections);
    console.log("show all selections loaded");

    addListenerByIdF('showall-cbox',
                    'change',
                    showAllEverything);
    console.log("show all everything loaded");

    addListenerByClassF('viewer-region-type',
                       'click',
                       function(e){
                           return changeAddTTitle(e);
                       }
                      );

    console.log("changeAddTTitle loaded");
    // ------------- ends selector-options ------------------------
    // ------------- ends selector-set ----------------------------
    // ------------- ends Viewer Options --------------------------

    // ------------------ Mouse Events ----------------------------

    addListenerByIdF('scene',
                    'mouseup',
                    function(e){
                        return setSceneMouseUp(e);
                    }
                    );
    console.log("mouse up loaded");

    addListenerByIdF('scene',
                    'mousedown',
                    function(e){
                        return setSceneMouseDown(e);
                    });
    console.log("mouse down loaded");

    addListenerByIdF('scene',
                    'mousemove',
                    function(e){
                        return setSceneMouseMove(e);
                    });
    console.log("mouse move loaded");

    // ends Mouse Events -------------------------------------------------

    addListenerByIdF('viewer-slide-btn',
                    'click',
                    slideFncViewer);
    console.log("slide func viewer loaded");

    // Transcription Related Functions

    addListenerByIdF('deleteButton',
                    'click',
                    deleteBoxes);
    console.log("delete boxes loaded");

    addListenerByIdF('undodeleteButton',
                    'click',
                    undoDeletion);
    console.log("undo delete boxes loaded");

    addListenerByIdF('addTranscriptionButton',
                    'click',
                    addTranscription);

    console.log("add Transcription loaded");

    addListenerByIdF('saveEverythingButton',
                    'click',
                    saveEverything);
    console.log("save everything loaded");

    addListenerByIdF('upload-transcription-btn',
                    'click',
                    uploadTranscription);

    addListenerByIdF('upload-geojson-btn',
                    'click',
                    uploadGeojson);

    addListenerByIdF('upload-image-btn',
                    'click',
                    uploadImage);
    addListenerByIdF('image-file-input',
                    'change',
                    load2ImageList);


    addListenerByIdF('markRTLTranscriptionButton',
                    'click',
                    markRTLTranscription);
    console.log("markRTLTranscription loaded");

    addListenerByIdF('markLTRTranscriptionButton',
                    'click',
                    markLTRTranscription);
    console.log("markLTRTranscription loaded");

    addListenerByIdF('transcriber-slide-btn',
                    'click',
                    slideFncTranscripter);
    console.log("slideFncTranscripter loaded");

    addListenerByIdF('activate-viewer-cbox',
                    'click',
                    activateViewer);
    console.log("activateViewer loaded");


    addListenerByIdF('original-size-cbox',
                    'change',
                    loadOriginalSize);
    console.log("loadOriginalSize loaded");

    addListenerByIdF('select-all-transcriptions-cbox',
                    'change',
                    selectAllTranscriptions);
    console.log("select all transcriptions loaded");
}

globalEventListeners();

*/

function globalKeyFuncs(event){
    // Functions that are triggered with
    // keystrocks within global window
    // NOTE: Add a condition on event position
    // if you want to make it specific to a widget
    if(event.defaultPrevented){
        return;
    }
    switch(event.key){
    case "Escape": // Trigger reset rect with escape
        canvasDraw.resetRect();
        break;
        // Add other keystrockes if they become necessary
    default:
        return;
    }
    event.preventDefault();
}

// Interfacing with html
window.addEventListener('keyup',
                        globalKeyFuncs,
                        false
                       );
window.addEventListener('load',
                        ImList.getImages,
                        false
                       );
// window.addEventListener('load', setInterfaceMode2Global(), false);

console.log("before run interface");
// setInterfaceMode2Global();
runInterface();

// InterfaceEvents.activateGlobalEvents();
// InterfaceEvents.mode = "global";


//
// Upload json file
// toolbox goes to top section above the image viewer and the transcription column
//
// Telecharger image
// telecharger geojson
// traduire 19 colonnes à geojson
// manipuler hovering rectangle pour corriger directement la detection
// - Mouse hold - mouse move
// click on hovering rectangle and align the transcription to it in the window
// Distribute showEverything to show lines
// icon for uploading geojson as well
// resetScene -> deleteAllRegion with are you sure ?

