// author: Kaan Eraslan
// license: see LICENSE
var ViewerRelated = function(){
    var obj = Object.create(ViewerRelated.prototype);
    obj.imfiles = [];
    obj.imageId = "";

    // checks
    obj.inhover = false;
    obj.originalSize = false; // load the image in its original size
    obj.selectInProcess = false; // selection is in process
    obj.mousePressed = false; // mouse is pressed or not
    obj.inMouseUp = false; // inside the mouse up event
    obj.outOfBounds = false;
    obj.debug = false;
    obj.detections = {};

    // selector options
    obj.selectorOptions = {};
    obj.selectorOptions.type = "";
    obj.selectorOptions.strokeColor = "";
    obj.selectorOptions.fillColor = "";
    obj.selectorOptions.fillOpacity = "";

    // Drawn object stacks
    obj.drawnObject = {}; // stores last drawn object
    obj.drawnObjects = {"type" : "FeatureCollection", "features" : []};
    obj.heldObjects = []; // stores drawn objects and the last drawn object

    // drawn object templates
    obj.poly = {"pointlist" : [
        // {x:0, y:1, x_real:20, y_real:50};
    ],
                "id" : "",
                "type" : "polygon",
                "regionType" : "",
                "hratio" : "",
                "vratio" : "",
                "fillColor" : "",
                "strokeColor" : "",
                "fillOpacity" : "",
                "imageId" : ""};
    obj.rect = {"x1" : "",
                "type" : "rectangle",
                "regionType" : "",
                "y1" : "",
                "x1_real" : "",
                "y1_real" : "",
                "width" : "",
                "width_real" : "",
                "height" : "",
                "height_real" : "",
                "imageId" : "",
                "hratio" : "",
                "vratio" : "",
                "fillColor" : "",
                "strokeColor" : "",
                "fillOpacity" : "",
                "id" : ""};
    obj.hratio = 1;
    obj.vratio = 1;
    obj.ratio = 1;
    return obj;
};
// Viewer Related methods
// methods
ViewerRelated.prototype.getScaleFactor = function(destWidth,
                                                  destHeight,
                                                  srcWidth,
                                                  srcHeight) {
    // Get scale factor for correctly drawing rectangle
    var hratio = destWidth / srcWidth;
    this.hratio = hratio;
    var vratio = destHeight / srcHeight;
    this.vratio = vratio;
    var ratio = Math.min(hratio, vratio);
    this.ratio = ratio;
    //
    return [hratio, vratio, ratio];
};
ViewerRelated.prototype.clearScene = function(){
    /*
      Remove image from scene
    */
    var scene = document.getElementById("scene");
    var context = scene.getContext("2d");
    context.clearRect(0,0, scene.width, scene.height);
    return;
};
// general drawing methods
ViewerRelated.prototype.imageLoad = function(event){
    /*
      Load the page image to the viewer

      The logic is the following:
      Remove already existing image with all of its elements
      Load the image to the image scene which is defined as a pattern
      Refer to the pattern in a rectangle to set it as a background
    */
    // remove existing image with all of its elements
    this.clearScene();

    // get id from the image link
    var imagelink = event.target;
    var imname = imagelink.getAttribute("id");
    imname = imname.replace("link-","image-");
    this.imageId = imname;

    // get img tag with id
    var imtag = document.getElementById(imname);

    // set the image width and height to
    // scene, image tag, and rect element
    var imwidth = imtag.naturalWidth;
    var imheight = imtag.naturalHeight;

    // get canvas and context
    var scene = document.getElementById("scene");
    var context = scene.getContext("2d");

    // set image according to parent div
    if(this.originalSize === false){

        // Set canvas width and height
        var imcol = document.getElementById("image-col");
        var parwidth = imcol.clientWidth;
        var parheight = imcol.clientHeight;
        scene.setAttribute("width", parwidth);
        scene.setAttribute("height", parheight);

        // get correct ratios for display
        var ratiolist = this.getScaleFactor(parwidth,
                                            parheight,
                                            imwidth,
                                            imheight);
        var ratio = ratiolist[2];
    }else{
        scene.setAttribute("width", imwidth);
        scene.setAttribute("height", imheight);
        // get correct ratios for display
        var ratiolist = this.getScaleFactor(imwidth,
                                            imheight,
                                            imwidth,
                                            imheight);
        var ratio = ratiolist[2];
    }
    var scaledWidth = ratio * imwidth;
    var scaledHeight = ratio * imheight;
    context.drawImage(imtag, // image
                      0,0, // coordinate source
                      imwidth, // source width
                      imheight, // source height
                      0,0, // coordinate destination
                      scaledWidth, // destination width
                      scaledHeight // destination height
                     );
    return;
};
ViewerRelated.prototype.setRectId = function(){
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
};
ViewerRelated.prototype.setPolyId = function(){
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
};
ViewerRelated.prototype.drawRectangle = function(mouseX2, // destination x2
                                                 mouseY2, // destination y2
                                                 hratio,
                                                 vratio,
                                                 context,
                                                 rectUpdate){
    // draw rectangle to context
    // get rectangle width
    var x1coord = rectUpdate["x1"];
    var y1coord = rectUpdate["y1"];
    var rectW = mouseX2 - x1coord;
    var rectH = mouseY2 - y1coord;

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
};
ViewerRelated.prototype.drawPolygon = function(mouseX2,
                                               mouseY2,
                                               hratio,
                                               vratio,
                                               context,
                                               polyUpdate,
                                               closeCheck){
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
};
ViewerRelated.prototype.drawPolygonFill = function(context,
                                                   polyObj){
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
    context.strokeStyle = strokeColor;

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
};
ViewerRelated.prototype.redrawImage = function(imageId,
                                               ratio,
                                               context){
    // Redraw an already loaded image to canvas
    // get img tag with id
    var imtag = document.getElementById(imageId);

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
ViewerRelated.prototype.resetScene = function(){
    // redraw page image without the drawn objects
    // get canvas and context
    var scene = document.getElementById("scene");
    var context = scene.getContext("2d");
    this.clearScene();
    this.drawnObjects = [];
    this.heldObjects = [];
    this.redrawImage(this.imageId,
                     this.ratio, context);
};
ViewerRelated.prototype.redrawRectObj = function(context, rectObj){
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
ViewerRelated.prototype.redrawPolygonObj = function(context, polyObj){
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
ViewerRelated.prototype.redrawAllDrawnObjects = function(){
    // redraw all the objects in the drawnObjects stack
    // get context and the scene
    var scene = document.getElementById("scene");
    var context = scene.getContext("2d");
    if(this.debug === true){
        console.log("in redraw all");
    }
    // redraw image
    context = this.redrawImage(this.imageId,
                               this.ratio, context);
    if(this.debug === true){
        console.log("in image redrawn");
    }
    for(var i=0; i < this.drawnObjects["features"].length; i++){
        var dobj = this.drawnObjects["features"][i];
        if(this.debug === true){
            console.log("drawn object");
            console.log(dobj);
        }
        if(dobj["properties"]["selectorType"] === "polygon"){
            context = this.redrawPolygonObj(context, dobj);
        }else if(dobj["properties"]["selectorType"] === "rectangle"){
            context = this.redrawRectObj(context, dobj);
        }
    }
    return;
};
ViewerRelated.prototype.setSelectionCoordinates = function(event){
    // set selection coordinates based on the selector type
    // get scene and its offset
    if(this.debug === true){
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
    if(this.debug === true){
        console.log('in selector option');
        console.log(seltype);
    }
    if(seltype === "polygon-selector"){
        if(this.debug === true){
            console.log('in polygon selector branch');
        }
        this.poly.pointlist.push({"x" : xcoord,
                                  "x_real" : xreal,
                                  "y_real" : yreal,
                                  "y" : ycoord});
        this.poly.hratio = this.hratio;
        this.poly.vratio = this.vratio;
        this.poly.imageId = this.imageId;
        if(this.debug === true){
            console.log('mousedown polygon state');
            console.log(this.poly);
        }
    }else if(seltype === "rectangle-selector"){
        if(this.debug === true){
            console.log('in rect selector branch');
        }
        this.rect["x1"] = xcoord;
        this.rect["x1_real"] = xreal;
        this.rect["y1"] = ycoord;
        this.rect["y1_real"] = yreal;
        this.rect.hratio = this.hratio;
        this.rect.vratio = this.vratio;
        this.rect.imageId = this.imageId;
        if(this.debug === true){
            console.log('mousedown rect state');
            console.log(this.rect);
        }
        // console.log(this.rect);
    }
};
ViewerRelated.prototype.setContextOptions2Object = function(dobj,
                                                            strokeColor,
                                                            fillColor,
                                                            fillOpacity){
    // set context options to the object
    dobj["stroke"] = strokeColor;
    dobj["fillColor"] = fillColor;
    dobj["fillOpacity"] = fillOpacity;
    return dobj;
};
ViewerRelated.prototype.drawSelection = function(event){
    // add selection coordinates based on selector type
    if(this.debug === true){
    console.log("in draw selection");
    }
    // get scene and context for drawing
    var scene = document.getElementById("scene");
    var context = scene.getContext("2d");

    if(this.mousePressed === false){
        return context;
    }
    if(this.debug === true){
        console.log("mouse is pressed");
    }
    if(this.selectInProcess === false){
        return context;
    }
    if(this.debug === true){
        console.log("selection in process");
    }
    // get region type

    // clear scene
    this.clearScene();
    if(this.debug === true){
        console.log("scene clear");
    }
    // redraw the page image
    context = this.redrawImage(this.imageId,
                               this.ratio,
                               context);
    if(this.debug === true){
        console.log("image redrawn");
    }
    // get the offset for precise calculation of coordinates
    var parentOffsetX = scene.offsetLeft;
    var parentOffsetY = scene.offsetTop;

    // compute the coordinates for the selection
    var x2coord = parseInt(event.layerX - parentOffsetX, 10);
    var y2coord = parseInt(event.layerY - parentOffsetY, 10);

    // ratio
    var hratio = this.hratio;
    var vratio = this.vratio;

    // set context style options
    // set context stroke color
    context.strokeStyle = this.selectorOptions.strokeColor;

    // prepare rgba string for fill style. ex: rgba(255,0,0,0.4)
    var rgbastr = "rgba(";
    rgbastr = rgbastr.concat(this.selectorOptions.fillColor); // rgb value ex: 255,0,0
    rgbastr = rgbastr.concat(",");
    rgbastr = rgbastr.concat(this.selectorOptions.fillOpacity);
    rgbastr = rgbastr.concat(")");
    context.fillStyle = rgbastr;
    if(this.debug === true){
        console.log("context set");
    }
    // draw object based on the selector type
    var seltype = this.selectorOptions.type;
    if(seltype === "polygon-selector"){
        // save context style options to drawn object
        if(this.debug === true){
            console.log("in polygon drawing process");
        }
        this.poly = this.setContextOptions2Object(this.poly,
                                                  this.selectorOptions.strokeColor,
                                                  this.selectorOptions.fillColor,
                                                  this.selectorOptions.fillOpacity);
        if(this.debug === true){
            console.log("in polygon context set");
        }
        // draw the object
        context = this.drawPolygon(x2coord, y2coord,
                                   hratio, vratio,
                                   context,
                                   this.poly,
                                   this.inMouseUp);

        if(this.debug === true){
            console.log("polygon drawn");
            console.log("current poly state");
            console.log(this.poly);
        }
        this.drawnObject = this.poly;
        if(this.debug === true){
            console.log("current drawn object state");
            console.log(this.drawnObject);
        }
    }else if(seltype === "rectangle-selector"){
        // save context style options to drawn object
        if(this.debug === true){
            console.log("in rect drawing process");
        }
        this.rect = this.setContextOptions2Object(this.rect,
                                                  this.selectorOptions.strokeColor,
                                                  this.selectorOptions.fillColor,
                                                  this.selectorOptions.fillOpacity);
        if(this.debug === true){
            console.log("in rect context set");
            console.log(this.rect);
        }
        // draw the object
        context = this.drawRectangle(x2coord,
                                     y2coord,
                                     hratio,
                                     vratio,
                                     context,
                                     this.rect);
        if(this.debug === true){
            console.log("rect drawn");
            console.log("current rect state");
            console.log(this.rect);
        }
        this.drawnObject = this.rect;
        if(this.debug === true){
            console.log("current drawn object state");
            console.log(this.drawnObject);
        }
    }
    return context;
};
ViewerRelated.prototype.convertObj2Geojson = function(drawnObj){
    // convert the drawn object to its geojson equivalent
    /*
      geojson feature collection

      {
      "type": "FeatureCollection",
      "features": [
      {
      "type": "Feature",
      "id": "id0",
      "geometry": {
      "type": "LineString",
      "coordinates": [
      [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
      ]
      },
      "properties": {
      "prop0": "value0",
      "prop1": "value1"
      }
      },
      {
      "type": "Feature",
      "id": "id1",
      "geometry": {
      "type": "Polygon",
      "coordinates": [
      [
      [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]
      ]
      ]
      },
      "properties": {
      "prop0": "value0",
      "prop1": "value1"
      }
      }
      ]
      }

      Geojson feature:
      {
      "type": "Feature",
      "geometry": {
      "type": "LineString",
      "coordinates": [
      [100.0, 0.0], [101.0, 1.0]
      ]
      },
      "properties": {
      "prop0": "value0",
      "prop1": "value1"
      }
      }

      geojson multiline string
      {
      "type": "MultiLineString",
      "coordinates": [
      [ [100.0, 0.0], [101.0, 1.0] ],
      [ [102.0, 2.0], [103.0, 3.0] ]
      ]
      }

      Geojson polygon
      no holes
      {
      "type": "Polygon",
      "coordinates": [
      [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ]
      ]
      }
      with holes
      {
      "type": "Polygon",
      "coordinates": [
      [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ],
      [ [100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2] ]
      ]
      }
    */
    var geoobj = {};
    geoobj["type"] = "Feature";
    geoobj["properties"] = {};
    geoobj["geometry"] = {};
    geoobj["id"] = drawnObj["id"];
    geoobj["properties"]["id"] = drawnObj["id"];
    geoobj["properties"]["imageId"] = drawnObj["imageId"];
    geoobj["properties"]["regionType"] = drawnObj["regionType"];
    geoobj["properties"]["displayRelated"] = {};
    geoobj["properties"]["displayRelated"]["hratio"] = drawnObj["hratio"];
    geoobj["properties"]["displayRelated"]["vratio"] = drawnObj["vratio"];
    geoobj["properties"]["displayRelated"]["strokeColor"] = drawnObj["strokeColor"];
    geoobj["properties"]["displayRelated"]["fillColor"] = drawnObj["fillColor"];
    geoobj["properties"]["displayRelated"]["fillOpacity"] = drawnObj["fillOpacity"];
    geoobj["properties"]["interfaceCoordinates"] = {};
    if(drawnObj["type"] === "polygon"){
        // geometries for polygon
        var pointlist = drawnObj["pointlist"];
        geoobj["properties"]["selectorType"] = drawnObj["type"];
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
    }else if(drawnObj["type"] === "rectangle"){
        // geometries for rectangle
        geoobj["properties"]["selectorType"] = drawnObj["type"];
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
ViewerRelated.prototype.addSingleDrawnObject = function(){
    // add drawn object to drawn objects stack
    // make a copy of drawn object
    if(this.debug === true){
        console.log("in add single drawn object");
    }
    var objstr = JSON.stringify(this.drawnObject);
    var objJson = JSON.parse(objstr);
    if(this.debug === true){
        console.log("object before geojson conversion");
        console.log(objJson);
    }
    var geoj = this.convertObj2Geojson(objJson);
    if(this.debug === true){
        console.log("object after geojson conversion");
        console.log(geoj);
    }
    this.drawnObjects["features"].push(geoj);
    if(this.debug === true){
        console.log("drawn objects after recent addition");
        console.log(this.drawnObjects);
    }
    return geoj;
};
//     var context = canvas.getContext('2d');
//     // set canvas width and height
//     var image = document.getElementById("image-page");
//     // console.log(image);
//     var imcwidth = image.clientWidth;
//     var imcheight = image.clientHeight;
//     // set client width of the canvas to image
//     canvas.width = imcwidth;
//     canvas.height = imcheight;
//     this.getScaleFactor(cwidth, //dest width
//                         cheight, // dest height
//                         imnwidth, // src width
//                         imnheight); // src height
//     this.image.shiftx = ( cwidth - imcwidth * this.image.ratio ) / 2;
//     this.image.shifty = ( cheight - imcheight * this.image.ratio ) / 2;
//     context.drawImage(image,
//                       0,0,// coordinate source
//                       imnwidth, // source rectangle width
//                       imnheight, // source rectangle height
//                       // centerShift_x, centerShift_y, // destination coordinate
//                       0,0,
//                       imnwidth*this.image.ratio, // destination width
//                       imnwidth*this.image.ratio // destination height
//                      );
//     // redrawPageImage(image, context, canvas);
//     this.image.pageImage = image.cloneNode(true);
//     this.image.pageImage.width = canvas.width;
//     this.image.pageImage.height = canvas.height;
//     document.getElementById("image-page").remove();
// };
// //

// //
// CanvasRelated.prototype.getLine = function(lineObj){
//     // get line coordinates from line object
//     var leftInt = parseInt(lineObj.x1, 10);
//     leftInt = Math.floor(leftInt);
//     var topInt = parseInt(lineObj.y1, 10);
//     topInt = Math.floor(topInt);
//     var widthInt = parseInt(lineObj.width, 10);
//     widthInt = Math.floor(widthInt);
//     var heightInt = parseInt(lineObj.height, 10);
//     heightInt = Math.floor(heightInt);
//     //
//     var line = {};
//     line.x1 = leftInt;
//     line.y1 = topInt;
//     line.width = widthInt;
//     line.height = heightInt;
//     return line;
// };
// //
// CanvasRelated.prototype.getLines = function(){
//     for(var i=0; i < lines.length; i++){
//         var lineObj = lines[i];
//         var lineInts = this.getLine(lineObj);
//         this.image.lines.push(lineInts);
//     }
// };
// // Event handlers
// // Checks for event locations
// CanvasRelated.prototype.checkLineBound = function(mX,
//                                                   mY,
//                                                   x1, // real coordinate no scaling
//                                                   y1,
//                                                   x2, // real coordinates no scaling
//                                                   y2){
//     // check if the line contains the mX and mY
//     var check = false;
//     //
//     if(
//         (y1 <= mY) && (mY <= y2) &&
//             (x1 <= mX) && (mX <= x2)
//     ){
//         check=true;
//     }
//     return check;
// };
// //
// CanvasRelated.prototype.checkEventRectBound = function(event,
//                                                        rectName,
//                                                        eventBool){
//     /*
//       Check if the event is in the given rectangle
//       event: a mouse event
//       eventName: is the boolean variable
//       that would be changed with the check
//       rectName: is the reference rectangle*/
//     var imcanvas = document.getElementById("image-canvas");
//     var context = imcanvas.getContext('2d');
//     var canvasOffsetX = imcanvas.offsetLeft;
//     var canvasOffsetY = imcanvas.offsetTop;
//     var mouseX2=parseInt(event.layerX - canvasOffsetX);
//     var mouseY2=parseInt(event.layerY - canvasOffsetY);
//     var mouseX2Trans = (mouseX2) / this.image.hratio; // real coordinates
//     var mouseY2Trans = (mouseY2) / this.image.vratio; // real coordinates
//     //
//     var x1 = parseInt(rectName["x1_real"], 10);
//     var y1 = parseInt(rectName["y1_real"], 10);
//     var x2 = parseInt(rectName["x2_real"], 10);
//     var y2 = parseInt(rectName["y2_real"], 10);
//     //
//     if(this.checkLineBound(mouseX2Trans, mouseY2Trans,
//                            x1, y1,
//                            x2, y2) === true){
//         eventBool=true;
//     }
// };
// //
// CanvasRelated.prototype.checkRectContained = function(rect1, rect2){
//     // Check if rect1 contains rect2
//     var rect1_x1 = rect1["x1"];
//     var rect1_y1 = rect1["x1"];
//     var rect1_x2 = rect1["x2"];
//     var rect1_y2 = rect1["y2"];
//     //
//     var rect2_x1 = rect2["x1"];
//     var rect2_y1 = rect2["x1"];
//     var rect2_x2 = rect2["x2"];
//     var rect2_y2 = rect2["y2"];
//     //
//     var check = false;
//     //
//     if((rect2_x1 > rect1_x1) ||
//        (rect2_x2 < rect1_x2) ||
//        (rect2_y1 > rect1_y1) ||
//        (rect2_y2 < rect1_y2)
//       ){
//         check = true;
//     }
//     return check;
// };
// // Get lines based on event locations
// CanvasRelated.prototype.getLineBound = function(mXcoord,
//                                                 mYcoord){
//     // get the line that is to be drawn based on the
//     // coordinates provided
//     var lineInBound = [];
//     //
//     for(var i=0; i< this.image.lines.length; i++){
//         var aLine = this.image.lines[i];
//         var x1 = parseInt(aLine["x1"], 10);
//         var y1 = parseInt(aLine["y1"], 10);
//         var x2 = x1 + parseInt(aLine["width"], 10);
//         var y2 = y1 + parseInt(aLine["height"], 10);
//         if(this.checkLineBound(mXcoord, mYcoord,
//                                x1, y1,
//                                x2, y2) === true){
//             lineInBound.push(aLine);
//         }
//     }
//     //
//     return lineInBound[0];
// };
// // Controling the mouse movements in canvas
// CanvasRelated.prototype.canvasMouseDown = function(event){
//     // handling canvas mouse button pressed
//     var imcanvas = document.getElementById("image-canvas");
//     var canvasOffsetX = imcanvas.offsetLeft;
//     var canvasOffsetY = imcanvas.offsetTop;

//     var mouseX=parseInt(event.layerX - canvasOffsetX);
//     var mouseY=parseInt(event.layerY - canvasOffsetY);
//     var mouseXTrans = mouseX  / this.image.hratio;
//     var mouseYTrans = mouseY / this.image.vratio ;

//     this.image.xcoord = mouseX;
//     this.image.ycoord = mouseY;
//     //
//     // store the starting mouse position
//     this.mousePress=true;
//     this.selectInProcess = true;
// };
// CanvasRelated.prototype.canvasMouseUp = function(event){
//     this.mousePress=false;
// };
// CanvasRelated.prototype.canvasMouseMove = function(event){
//     // regroups functions that activates with
//     // mouse move on canvas
//     var imcanvas = document.getElementById("image-canvas");
//     var context = imcanvas.getContext('2d');
//     var canvasOffsetX = imcanvas.offsetLeft;
//     var canvasOffsetY = imcanvas.offsetTop;
//     var mouseX = parseInt(event.layerX - canvasOffsetX);
//     var mouseY = parseInt(event.layerY - canvasOffsetY);
//     var mouseXTrans = mouseX / this.image.hratio; // real coordinates
//     var mouseYTrans = mouseY / this.image.vratio; // real coordinates
//     //
//     var currentRect = this.image.currentRect;
//     var hoveringRect = this.image.hoveringRect;
//     // var contains = this.checkRectContained(hoveringRect,// checks if first
//     // currentRect);// contains the second
//     var contains = false;
//     this.checkEventRectBound(event, hoveringRect, this.inhover);
//     if((this.inhover === false) &&
//        (this.selectInProcess === false) &&
//        (contains === false)){
//         this.drawLineBounds(event);
//     }
//     //
//     if(this.mousePress === false){
//         return;
//     }
//     if(this.mousePress === true){
//         this.selectInProcess = true;
//         context.strokeStyle = "lightgray";
//         context.lineWidth=2;
//         context.clearRect(0,0,
//                           imcanvas.width,
//                           imcanvas.height);
//         this.redrawPageImage(context, imcanvas);
//         // drawRectangleSelection(mouseXTrans,
//         //                        mouseYTrans,
//         //                        context);
//         var rect1 = this.image.currentRect;
//         this.drawRectangle(mouseX,
//                            mouseY,
//                            mouseXTrans,
//                            mouseYTrans,
//                            this.image.xcoord,
//                            this.image.ycoord,
//                            this.image.hratio,
//                            this.image.vratio,
//                            context,
//                            rect1);
//     }
// };
// // General Drawing Methods
// //
// CanvasRelated.prototype.drawRectangle = function(mouseX2,
//                                                  mouseY2,
//                                                  mouseX2Trans,
//                                                  mouseY2Trans,
//                                                  x1coord,
//                                                  y1coord,
//                                                  hratio,
//                                                  vratio,
//                                                  context,
//                                                  rectUpdate){
//     // Rectangle draw function
//     var rectW = mouseX2 - x1coord;
//     var rectH = mouseY2 - y1coord;
//     var x_real = x1coord / hratio;
//     var y_real = y1coord / vratio;
//     var width_real = Math.floor(mouseX2Trans - x_real);
//     var height_real = Math.floor(mouseY2Trans - y_real);
//     //
//     rectUpdate["y1"] = y1coord;
//     rectUpdate["x1"] = x1coord;
//     //
//     rectUpdate["y2"] = mouseY2;
//     rectUpdate["x2"] = mouseX2;
//     //
//     rectUpdate["width"] = rectW;
//     rectUpdate["height"] = rectH;
//     //
//     rectUpdate["hratio"] = hratio;
//     rectUpdate["vratio"] = vratio;
//     //
//     rectUpdate["x1_real"] = Math.floor(x_real);
//     rectUpdate["y1_real"] = Math.floor(y_real);
//     //
//     rectUpdate["x2_real"] = mouseX2Trans,
//     rectUpdate["y2_real"] = mouseY2Trans;
//     //
//     rectUpdate["width_real"] = width_real;
//     rectUpdate["height_real"] = height_real;
//     //
//     context.beginPath();
//     context.rect(x1coord,
//                  y1coord,
//                  rectW,
//                  rectH);
//     context.stroke();
// };
// // Draw Line Bounding Boxes
// CanvasRelated.prototype.drawLineBounds = function(event){
//     // makes the line bounding box
//     // visible if the mouse is
//     // in its coordinates
//     var imcanvas = document.getElementById("image-canvas");
//     var context = imcanvas.getContext('2d');
//     var canvasOffsetX = imcanvas.offsetLeft;
//     var canvasOffsetY = imcanvas.offsetTop;
//     var mouseX2 = parseInt(event.layerX - canvasOffsetX);
//     var mouseY2 = parseInt(event.layerY - canvasOffsetY);
//     var mouseX2Trans = (mouseX2) / this.image.hratio; // real coordinates
//     var mouseY2Trans = (mouseY2) / this.image.vratio; // real coordinates
//     context.clearRect(0,0,
//                       imcanvas.width,
//                       imcanvas.height);
//     this.redrawPageImage(context, imcanvas);
//     var funcThis = this;
//     var lineDraw =  funcThis.getLineBound(mouseX2Trans,
//                                           mouseY2Trans);
//     var y1_real = parseInt(lineDraw["y1"], 10);
//     var x1_real = parseInt(lineDraw["x1"], 10);
//     var x1coord1 = x1_real * this.image.hratio;
//     var y1coord1 = y1_real * this.image.vratio;
//     var width = parseInt(lineDraw["width"]);
//     var height = parseInt(lineDraw["height"]);
//     var x2_real = x1_real + width;
//     var y2_real = y1_real + height;
//     var x2 = x2_real * this.image.hratio;
//     var y2 = y2_real * this.image.vratio;
//     context.strokeStyle = "red";
//     context.lineWidth=1;
//     //
//     // draw the rectangle
//     this.drawRectangle(x2,
//                        y2,
//                        x2_real,
//                        y2_real,
//                        x1coord1,
//                        y1coord1,
//                        this.image.hratio,
//                        this.image.vratio,
//                        context,
//                        this.image.hoveringRect);
// };
// CanvasRelated.prototype.drawAllLines = function(event){
//     // Draw all detected lines at the same time
//     // on the image. This function should be controlled by a checkbox
//     var imcanvas = document.getElementById("image-canvas");
//     var context = imcanvas.getContext('2d');
//     var canvasOffsetX = imcanvas.offsetLeft;
//     var canvasOffsetY = imcanvas.offsetTop;
//     context.clearRect(0,0,
//                       imcanvas.width,
//                       imcanvas.height);
//     this.redrawPageImage(context, imcanvas);
//     for(var i=0; i< this.image.lines.length; i++){
//         if(isOdd(i) === true){
//             context.strokeStyle = "red";
//             context.fillStyle = "rgba(255, 0, 0, 0.2)";
//         }else{
//             context.strokeStyle = "green";
//             context.fillStyle = "rgba(0, 255, 0, 0.2)";
//         }
//         context.lineWidth=1;
//         var aLine = this.image.lines[i];
//         var x1_real = parseInt(aLine["x1"], 10);
//         var y1_real = parseInt(aLine["y1"], 10);
//         var x2_real = x1_real + parseInt(aLine["width"], 10);
//         var y2_real = y1_real + parseInt(aLine["height"], 10);
//         var x1coord = x1_real * this.image.hratio;
//         var y1coord = y1_real * this.image.vratio;
//         var x2 = x2_real * this.image.hratio;
//         var y2 = y2_real * this.image.vratio;
//         //
//         var width = x2 - x1coord;
//         var height = y2 - y1coord;
//         context.beginPath();
//         context.rect(x1coord,
//                      y1coord,
//                      width,
//                      height);
//         context.stroke();
//         context.fill();
//     };
// };
// //
// CanvasRelated.prototype.redrawRect = function(context, rectObj){
//     // redraw the last hovering rectangle
//     var x1coord = rectObj["x1"];
//     var y1coord = rectObj["y1"];
//     var nwidth = rectObj["width"];
//     var nheight = rectObj["height"];
//     // draw
//     context.strokeStyle = "red";
//     context.lineWidth=1;
//     context.beginPath();
//     context.rect(x1coord,
//                  y1coord,
//                  nwidth,
//                  nheight);
//     context.stroke();
// };
// //
// CanvasRelated.prototype.redrawPageImage = function(context, canvas){
//     // set canvas width and height
//     // Get client width/height, that is after styling
//     var imcwidth = this.image.pageImage.width;
//     var imcheight = this.image.pageImage.height;
//     // set client width of the canvas to image
//     canvas.width = imcwidth;
//     canvas.height = imcheight;
//     var cwidth = canvas.clientWidth;
//     var cheight = canvas.clientHeight;
//     // Get natural width and height
//     var imnwidth = this.image.pageImage.naturalWidth;
//     var imnheight = this.image.pageImage.naturalHeight;
//     //
//     var ratiolist  = this.getScaleFactor(cwidth, //dest width
//                                          cheight, // dest height
//                                          imnwidth, // src width
//                                          imnheight); // src height
//     var centerShift_x = ( cwidth - imcwidth * this.image.ratio ) / 2;
//     var centerShift_y = ( cheight - imcheight * this.image.ratio ) / 2;
//     context.drawImage(this.image.pageImage,
//                       0,0,// coordinate source
//                       imnwidth, // source rectangle width
//                       imnheight, // source rectangle height
//                       // centerShift_x, centerShift_y, // destination coordinate
//                       0,0,
//                       imnwidth*this.image.ratio, // destination width
//                       imnwidth*this.image.ratio // destination height
//                      );
// };
// //
// CanvasRelated.prototype.restoreOldCanvas = function(){
//     // restore canvas to its old state
//     var imcanvas = document.getElementById("image-canvas");
//     var context = imcanvas.getContext('2d');
//     context.clearRect(0,0,
//                       imcanvas.width,
//                       imcanvas.height);
//     this.redrawPageImage(context, imcanvas);
//     this.redrawRect(context, this.image.hoveringRect);
// };
// CanvasRelated.prototype.resetRect = function(){
//     // Clears canvas and redraws the original image
//     // Reset checks
//     this.selectInProcess = false;
//     //
//     this.image.currentRect = {
//         "y1" : "",
//         "x1" : "",
//         "y2" : "",
//         "x2" : "",
//         "width" : "",
//         "height" : "",
//         "hratio": "",
//         "vratio" : "",
//         "y1_real" : "",
//         "x1_real" : "",
//         "y2_real" : "",
//         "x2_real" : "",
//         "width_real" : "",
//         "height_real" : "",
//     };
//     this.image.hoveringRect = {
//         "y1" : "",
//         "x1" : "",
//         "y2" : "",
//         "x2" : "",
//         "width" : "",
//         "height" : "",
//         "hratio": "",
//         "vratio" : "",
//         "y1_real" : "",
//         "x1_real" : "",
//         "y2_real" : "",
//         "x2_real" : "",
//         "width_real" : "",
//         "height_real" : "",
//     };
//     this.restoreOldCanvas();
// };
// CanvasRelated.prototype.saveCoordinates = function(){
//     // opens up a window with line coordinates in it
//     var lines = this.image.lines;
//     var strjson = JSON.stringify(lines);
//     window.open("data:application/json; charset=utf-8," + strjson);
// };
// CanvasRelated.prototype.getCoordinates = function(){
//     // gets lines which contain coordinates
//     return this.image.lines;
// };

// // Transcription Column Related

// var TransColumn = function(){
//     var obj = Object.create(TransColumn.prototype);
//     var pageImage;
//     obj.image = pageImage;
//     obj.viewerCheck = false;
//     obj.currentRect = {
//         "y1" : "",
//         "x1" : "",
//         "y2" : "",
//         "x2" : "",
//         "width" : "",
//         "height" : "",
//         "hratio": "",
//         "vratio" : "",
//         "y1_real" : "",
//         "x1_real" : "",
//         "y2_real" : "",
//         "x2_real" : "",
//         "width_real" : "",
//         "height_real" : "",
//         "index" : "",
//     };
//     obj.lines = [];
//     obj.deletedNodes = [];
//     return obj;
// };
// // methods
// TransColumn.prototype.getLine = function(lineObj){
//     // get line coordinates from line object
//     var leftInt = parseInt(lineObj.x1, 10);
//     leftInt = Math.floor(leftInt);
//     var topInt = parseInt(lineObj.y1, 10);
//     topInt = Math.floor(topInt);
//     var widthInt = parseInt(lineObj.width, 10);
//     widthInt = Math.floor(widthInt);
//     var heightInt = parseInt(lineObj.height, 10);
//     heightInt = Math.floor(heightInt);
//     //
//     var line = {};
//     line.x1 = leftInt;
//     line.y1 = topInt;
//     line.width = widthInt;
//     line.height = heightInt;
//     line.index = lineObj.index;
//     line.bbox = lineObj.bbox;
//     return line;
// };
// //
// TransColumn.prototype.getLines = function(){
//     var getLine = TransColumn.prototype.getLine;
//     for(var i=0; i < lines.length; i++){
//         var lineObj = lines[i];
//         var lineInts = getLine(lineObj);
//         this.lines.push(lineInts);
//     }
// };
// //
// TransColumn.prototype.getLineById = function(idstr){
//     var index = idstr.replace(/[^0-9]/g, '');
//     var result;
//     for(var i=0; i < this.lines.length; i++){
//         var line = this.lines[i];
//         if(line.index === index){
//             result = line;
//         }
//     }
//     return result;
// };
// //
// TransColumn.prototype.createItemId = function(){
//     // creates the id of item group based on the
//     // the number of elements the text-line-list has
//     var orList = document.getElementById("text-line-list");
//     var children = orList.childNodes;
//     var childArray = [];
//     for(var i=0; i < children.length; i++){
//         var newchild = children[i];
//         if(newchild.className === "item-group"){
//             childArray.push(newchild);
//         }
//     }
//     //
//     var newId = childArray.length + 1;
//     return newId;
// };
// TransColumn.prototype.createIdWithPrefix = function(index, prefix){
//     // creates the id with the necessary prefix
//     var id = prefix.concat(index);
//     return id;
// };
// //
// TransColumn.prototype.checkRectangle = function(){
//     // check if the selection rectangle is empty
//     var result = false;
//     if(
//         (this.currentRect["x1"] === "") &&
//             (this.currentRect["y1"] === "") &&
//             (this.currentRect["x2"] === "") &&
//             (this.currentRect["y2"] === "") &&
//             (this.currentRect["width"] === "") &&
//             (this.currentRect["height"] === "") &&
//             (this.currentRect["hratio"] === "") &&
//             (this.currentRect["vratio"] === "") &&
//             (this.currentRect["x1_real"] === "") &&
//             (this.currentRect["y1_real"] === "") &&
//             (this.currentRect["x2_real"] === "") &&
//             (this.currentRect["y2_real"] === "") &&
//             (this.currentRect["width_real"] === "") &&
//             (this.currentRect["height_real"] === "")
//     ){
//         result = true;
//     }
//     //
//     return result;
// };
// //
// TransColumn.prototype.createIGroup = function(idstr){
//     // create the list element that will hold the group
//     var listItem = document.createElement("li");
//     listItem.setAttribute("class", "item-group");
//     listItem.setAttribute("id", idstr);
//     //
//     return listItem;
// };
// //
// TransColumn.prototype.createItList = function(idstr){
//     // Unordered list that would hold the checkbox
//     // and the transcription line
//     var ulList = document.createElement("ul");
//     ulList.setAttribute("class", "item-list");
//     ulList.setAttribute("id", idstr);
//     //
//     return ulList;
// };
// TransColumn.prototype.createTLine = function(idstr, regionType){
//     // create a transcription line
//     var transLine = document.createElement("textarea");
//     // set attributes
//     transLine.setAttribute("id", idstr);
//     transLine.setAttribute("spellcheck", "true");
//     transLine.setAttribute("class", "editable-textarea");
//     transLine.setAttribute("onfocus", "viewLine(event)");
//     //
//     var index = idstr.replace(/[^0-9]/g, '');
//     var placeholder = "Enter text for added ";
//     placeholder = placeholder.concat(regionType);
//     transLine.setAttribute("data-placeholder", placeholder);
//     var bbox = "";
//     bbox = bbox.concat(this.currentRect["x1_real"]);
//     bbox = bbox.concat(", ");
//     bbox = bbox.concat(this.currentRect["y1_real"]);
//     bbox = bbox.concat(", ");
//     bbox = bbox.concat(this.currentRect["width_real"]);
//     bbox = bbox.concat(", ");
//     bbox = bbox.concat(this.currentRect["height_real"]);
//     transLine.setAttribute("data-bbox", bbox);
//     //
//     return transLine;
// };
// //
// TransColumn.prototype.createLineCbox = function(idstr){
//     // Create the checkbox in the line widget
//     var cbox = document.createElement("input");
//     cbox.setAttribute("id", idstr);
//     cbox.setAttribute("type","checkbox");
//     cbox.setAttribute("class", "line-cbox");
//     //
//     return cbox;
// };
// //
// TransColumn.prototype.createLineCboxLabel = function(idstr){
//     // Create line cbox label
//     // add the span element of the cbox
//     var labelContainer = document.createElement("label");
//     labelContainer.setAttribute("class", "cbox-container");
//     labelContainer.setAttribute("id", idstr);
//     // Commenting out the span element
//     // it is not really needed for anything
//     // var spanElement = document.createElement("span");
//     // spanElement.setAttribute("class", "checkmark");
//     // labelContainer.appendChild(spanElement);
//     return labelContainer;
// };
// //
// TransColumn.prototype.createLineWidget = function(idstr){
//     // Create the line widget that holds
//     // checkboxes and other functionality
//     var lineWidget = document.createElement("li");
//     lineWidget.setAttribute("class", "line-widget");
//     lineWidget.setAttribute("id", idstr);
//     //
//     return lineWidget;
// };
// //
// TransColumn.prototype.addTranscription = function(){
//     // adds a transcription box to item list
//     /*
//       First checks if a region is selected in the image
//       then gets the count of the number of transcription regions
//       in the transcription column
//       Then creates the elements that a transcription region holds
//       At the end, appends these elements to their corresponding parents

//      */
//     var funcThis = this;
//     var check = funcThis.checkRectangle();
//     if(check === true){
//         alert("Please select an area before adding a transcription");
//         return;
//     }
//     var rbuttons = document.querySelector("input[name='selected-region-rbutton']:checked");
//     check = false;
//     if(rbuttons != null){
//         check = true;
//     }
//     if(check === false){
//         alert("Please Select the Region Type before adding the selection");
//     }
//     var rbtnval = rbuttons.value;
//     var orList = document.getElementById("text-line-list");
//     // create the new line id
//     var newListId = this.createItemId();
//     this.currentRect["index"] = newListId;
//     //
//     var igId = this.createIdWithPrefix(newListId, "ig");
//     var listItem = this.createIGroup(igId);
//     //
//     var ilId = this.createIdWithPrefix(newListId, "il");
//     var ulList = this.createItList(ilId);
//     //
//     var taId = this.createIdWithPrefix(newListId, "ta");
//     var transLine = this.createTLine(taId, rbtnval);
//     //
//     var elId = this.createIdWithPrefix(newListId, "el");
//     var liel = document.createElement("li");
//     liel.setAttribute("id", elId);
//     //
//     var lwId = this.createIdWithPrefix(newListId, "lw");
//     var lineWidget = this.createLineWidget(lwId);
//     //
//     var cbcId = this.createIdWithPrefix(newListId, "cbc");
//     var cboxLabel = this.createLineCboxLabel(cbcId);
//     //
//     var lcboxId = this.createIdWithPrefix(newListId, "lcbox");
//     var lcbox = this.createLineCbox(lcboxId);
//     //
//     // cbox goes into cboxlabel
//     // cboxLabel.prependChild(lcbox);
//     cboxLabel.prepend(lcbox);
//     // cboxlabel goes into linewidget
//     lineWidget.appendChild(cboxLabel);
//     // textarea goes into line element
//     liel.appendChild(transLine);
//     // transline and linewidget goes into ullist
//     ulList.appendChild(lineWidget);
//     ulList.appendChild(liel);
//     // ul list goes into list item
//     listItem.appendChild(ulList);
//     // list item goes into ol list
//     orList.appendChild(listItem);
//     // add the line to the lines list as well
//     var newline = {
//         "x1" : this.currentRect["x1_real"],
//         "y1" : this.currentRect["y1_real"],
//         "width" : this.currentRect["width_real"],
//         "height" : this.currentRect["height_real"],
//         "bbox" : transLine.getAttribute("data-bbox"),
//         "index" : newListId,
//         "type" : rbtnval
//     };
//     this.lines.push(newline);
//     this.sortLines();
// };
// //
// TransColumn.prototype.changeItemAttribute = function(index,
//                                                      prefix,
//                                                      attr,
//                                                      val){
//     /*
//       Change Item attribute to val
//       index: numeric part of id
//       prefix: string part of id
//       attr: attribute name
//       val: value to be set
//     */
//     var itemid = this.createIdWithPrefix(index, prefix);
//     var item = document.getElementById(itemid);
//     item.setAttribute(attr, val);
//     return item;
// };
// //
// TransColumn.prototype.markRTL = function(){
//     /*
//       Mark Selection as Right to Left
//      */
//     var cboxes = document.querySelectorAll("input.line-cbox");
//     var cboxlen = cboxes.length;
//     var i = 0;
//     for(i; i < cboxlen; i++){
//         //
//         var cbox = cboxes[i];
//         var checkval = cbox.checked;
//         if(checkval===true){
//             //
//             var index = cbox.id;
//             index = index.replace(/[^0-9]/g, '');
//             this.changeItemAttribute(index,
//                                      "el",
//                                      "dir",
//                                      "rtl");
//         }
//     }
// };
// //
// TransColumn.prototype.markLTR = function(){
//     /*
//       Mark Selection as Right to Left
//     */
//     var cboxes = document.querySelectorAll("input.line-cbox");
//     var cboxlen = cboxes.length;
//     var i = 0;
//     for(i; i < cboxlen; i++){
//         //
//         var cbox = cboxes[i];
//         var checkval = cbox.checked;
//         if(checkval===true){
//             //
//             var index = cbox.id;
//             index = index.replace(/[^0-9]/g, '');
//             this.changeItemAttribute(index,
//                                      "el",
//                                      "dir",
//                                      "ltr");
//         }
//     }
// };
// TransColumn.prototype.selectAllLines = function(){
//     // Mark all line checkboxes
//     var cboxlist = document.querySelectorAll("input.line-cbox");
//     var listlen = cboxlist.length;
//     var clist = [];
//     var i = 0;
//     for (i; i < listlen; i++){
//         var cbox = cboxlist[i];
//         if(cbox.checked === false){
//             cbox.checked = true;
//         }else{
//             clist.push(cbox);
//         }
//     }
//     if(clist.length === listlen){
//         for(i=0; i<listlen; i++){
//             var ncbox = cboxlist[i];
//             ncbox.checked = false;
//         }
//     }
// };
// //
// TransColumn.prototype.deleteBoxes = function(){
//     /*
//       Simple function for deleting lines whose checkboxes are selected
//       Description:
//       We query the input elements whose class is trans-cbox.
//       Then we check whether they are checked or not.
//       If they are checked we delete the item group containing them
//     */
//     var deleteCheckBoxList = document.querySelectorAll("input.line-cbox");
//     var dellength = deleteCheckBoxList.length;
//     var deletedboxlength = 0;
//     var i = 0;
//     while(i < dellength){
//         var cbox = deleteCheckBoxList[i];
//         var checkval = cbox.checked;
//         if(checkval===true){
//             // removing the element if checkbox is checked
//             var labelnode = cbox.parentNode;
//             var linewidgetNode = labelnode.parentNode;
//             var itemlistNode = linewidgetNode.parentNode;
//             var itemgroupNode = itemlistNode.parentNode;
//             var lineId = itemgroupNode.id;
//             // get the image line from the other column
//             var imageLine = this.getLineById(lineId);//
//             //
//             var itemparent = itemgroupNode.parentNode;
//             var deleted = {"imageline" : imageLine,
//                            "itemgroup" : itemgroupNode,
//                            "imageparent" : this.lines,
//                            "itemparent" : itemparent};
//             this.deletedNodes.push(deleted);
//             // remove both from the page
//             itemparent.removeChild(itemgroupNode);
//             var lineindex = this.lines.indexOf(imageLine);
//             this.lines.splice(lineindex,1);
//             deletedboxlength +=1;
//         }
//         i+=1;
//     }
//     this.sortLines();
//     if(deletedboxlength === 0){
//         alert("Please select lines for deletion");
//     }
// };
// //
// TransColumn.prototype.undoDeletion = function(){
//     if (this.deletedNodes.length === 0){
//         alert("Deleted line information is not found");
//     }
//     var lastObject = this.deletedNodes.pop();
//     //
//     var imageLine = lastObject["imageline"];
//     var itemgroup = lastObject["itemgroup"];
//     var imageparent = lastObject["imageparent"]; // this.lines
//     var itemparent = lastObject["itemparent"];
//     //
//     imageparent.push(imageLine);
//     itemparent.appendChild(itemgroup);
//     this.sortLines();
//     //
// };
// // sorting lines
// TransColumn.prototype.sortLines = function() {
//     var lineList = document.querySelectorAll(".item-group");
//     var itemparent = document.getElementById("text-line-list");
//     var linearr = Array.from(lineList).sort(
//         this.sortOnBbox
//     );
//     //
//     //
//     linearr.forEach( el => itemparent.appendChild(el) );
// };
// //
// TransColumn.prototype.sortOnBbox = function(a, b){
//     // Sorts the list elements according to
//     // their placement on the image
//     // get editable lines
//     var eline1 = a.getElementsByClassName("editable-textarea");// returns a list
//     var eline2 = b.getElementsByClassName("editable-textarea");// with single element
//     eline1 = eline1[0]; //  get the single element
//     eline2 = eline2[0];
//     //
//     // get bbox
//     var bbox1 = eline1.getAttribute("data-bbox");
//     var bbox2 = eline2.getAttribute("data-bbox");
//     // split the string
//     var bbox1_split = bbox1.split(",");
//     var bbox2_split = bbox2.split(",");
//     // second element is the top value
//     // get top value
//     var bbox1_top = bbox1_split[1];
//     var bbox2_top = bbox2_split[1];
//     bbox1_top = bbox1_top.trim();
//     bbox2_top = bbox2_top.trim();
//     //
//     bbox1_top = parseInt(bbox1_top, 10);
//     bbox2_top = parseInt(bbox2_top, 10);
//     //
//     // compare:
//     // if the the top value is higher
//     // that means the line is at a lower section
//     // of the page image
//     // so that which has a high value
//     // should be placed after it is a simple ascending
//     // numbers comparison
//     //
//     return bbox1_top - bbox2_top;
// };
// TransColumn.prototype.parseBbox = function(bbox){
//     // Parse the bbox values
//     var bboxsplit = bbox.split(",");
//     var bbox_x = parseInt(bboxsplit[0], 10);
//     var bbox_y = parseInt(bboxsplit[1], 10);
//     var bbox_x2 = parseInt(bboxsplit[2], 10);
//     var bbox_y2 = parseInt(bboxsplit[3], 10);
//     var newbox  = {};
//     newbox.x2 = bbox_x2;
//     newbox.y2 = bbox_y2;
//     newbox.x1 = bbox_x;
//     newbox.y1 = bbox_y;
//     //
//     return newbox;

// };
// TransColumn.prototype.checkBbox = function(bbox, hoverRect){
//     // Check if given bbox corresponds to hover rect coordinates
//     var newbox = this.parseBbox(bbox);
//     var hov_x = hoverRect["x1_real"];
//     var hov_y = hoverRect["y1_real"];
//     var check = false;
//     if((newbox.x1 === hov_x) && (newbox.y1 === hov_y)){
//         check = true;
//     }
//     return check;
// };
// TransColumn.prototype.emphTransRegion = function(hoverRect){
//     // Highlight transcription rectangle which
//     // correspond to hovering rect coordinates
//     var linelist = document.getElementsByClassName("editable-textarea");
//     var solidline;
//     //
//     for(var i=0; i < linelist.length; i++){
//         //
//         var line = linelist[i];
//         var bbox = line.getAttribute("data-bbox");
//         if(this.checkBbox(bbox, hoverRect) === true){
//             solidline = line;
//         }
//         line.setAttribute("style",
//                           "border-color: black;border-style: dashed;");
//     }
//     if (solidline != null){
//         solidline.setAttribute("style", "border-color: red;border-style: solid;");
//     }
// };
// TransColumn.prototype.getScaleFactor = function(destWidth,
//                                                 destHeight,
//                                                 srcWidth,
//                                                 srcHeight) {
//     // Get scale factor for correctly drawing rectangle
//     var hratio = destWidth / srcWidth;
//     var vratio = destHeight / srcHeight;
//     var ratio = Math.min(hratio, vratio);
//     //
//     return [hratio, vratio, ratio];
// };
// TransColumn.prototype.removeViewer = function(){
//     // remove the line viewer from dom
//     var oldviewer = document.getElementById("line-viewer");
//     if (oldviewer != null){
//         document.getElementById("line-viewer").remove();
//     }
//     return;

// };
// TransColumn.prototype.drawLineOnCanvas =  function(event){
//     /*
//       Draw the line on a canvas for selected transcription area
//       Finds the selected transcription area
//       Parses its bbox
//       Creates a canvas
//       Draws the associated coordinates of the image found in bbox
//       on canvas
//     */
//     if(this.viewerCheck === false){
//         this.removeViewer();
//         return;
//     }
//     // remove old viewer
//     this.removeViewer();
//     //
//     var resultline = event.target;
//     var linebbox = resultline.getAttribute("data-bbox");
//     var idstr = resultline.getAttribute("id");
//     var index = idstr.replace(/[^0-9]/g, '');
//     // get the corresponding line widget
//     var idLineWidget = this.createIdWithPrefix(index, "lw");
//     console.log(idLineWidget);
//     var activeLineWidget = document.getElementById(idLineWidget);
//     var idLineEl = this.createIdWithPrefix(index,"el");
//     var activeLineEl = document.getElementById(idLineEl);
//     console.log(activeLineWidget);
//     //
//     var bbox = this.parseBbox(linebbox);
//     var lineCanvas = document.createElement("canvas");
//     var imcanvas = document.getElementById("image-canvas");
//     console.log(bbox);
//     // var aspratio = bbox.height / bbox.width; // aspect ratio
//     // aspratio = aspratio * 100; // aspect ratio
//     // var str = "padding-top: ".concat(aspratio);
//     // str = str.concat("%;");
//     lineCanvas.id = "line-viewer";
//     // NOTE change the width style based on the region type
//     // character: square
//     // column: 4x3
//     // line: 2x4
//     lineCanvas.width = activeLineEl.clientWidth;
//     lineCanvas.height = activeLineEl.clientHeight;
//     var ctxt = lineCanvas.getContext('2d');
//     var nimage = this.image;
//     var cwidth = lineCanvas.width;
//     var cheight = lineCanvas.height;
//     // Get natural width and height of the drawn image
//     var imnwidth = bbox.x2 - bbox.x1;
//     var imnheight = bbox.y2 -bbox.y1;
//     //
//     var ratiolist  = this.getScaleFactor(cwidth, //dest width
//                                          cheight, // dest height
//                                          imnwidth, // src width
//                                          imnheight); // src height
//     ctxt.drawImage(nimage,
//                    // 0,0,
//                    bbox.x1, bbox.y1, // source coordinate
//                    imnwidth,
//                    imnheight,
//                    0,0, // destination coordinate
//                    // centerShift_x, centerShift_y,
//                    cwidth,
//                    cheight
//                   );
//     console.log(activeLineWidget);
//     activeLineWidget.appendChild(lineCanvas);

// };
// TransColumn.prototype.saveTranscription = function(){
//     // Opens up a transcription window with
//     // transcription text in it.
//     var translines = document.getElementsByClassName("editable-textarea");
//     var texts = "";
//     var textlist = [];
//     //
//     for(var i=0; i < translines.length; i++){
//         //
//         var line = translines[i];
//         var text = line.innerText;
//         var linetext = "".concat(i);
//         linetext = linetext.concat(". ");
//         linetext = linetext.concat(text);
//         textlist.push(linetext);
//         linetext = linetext.concat("%0d%0a");
//         texts = texts.concat(linetext);
//     }
//     //
//     var stringfied = JSON.stringify(textlist);
//     window.open('data:application/json; charset=utf-8,' + stringfied);
//     window.open('data:text/.txt; charset=utf-8,' + texts);
// };

// TransColumn.prototype.getTranscriptions = function(){
//     // gets the text in transcription column
//     var translines = document.getElementsByClassName("editable-textarea");
//     var textlist = [];
//     for(var i=0; i < translines.length; i++){
//         var lineObj = {'index': i};
//         var line = translines[i];
//         var text = line.innerText;
//         lineObj.lineText = text;
//         textlist.push(lineObj);
//     }
//     return textlist;
// };


// // Done Classes

// // Instances

let ImageViewer = new ViewerRelated();
    // ImageViewer.getImageFiles(); // populating viewer with files
    // let canvasDraw = new CanvasRelated();
// canvasDraw.getLines(); // populating canvas with lines

// let transcription = new TransColumn();
// transcription.getLines(); // populating transcription column with lines
// // load image to canvas


// // keyboard events triggering functions in classes

// function globalKeyFuncs(event){
//     // Functions that are triggered with
//     // keystrocks within global window
//     // NOTE: Add a condition on event position
//     // if you want to make it specific to a widget
//     if(event.defaultPrevented){
//         return;
//     }
//     switch(event.key){
//     case "Escape": // Trigger reset rect with escape
//         canvasDraw.resetRect();
//         break;
//         // Add other keystrockes if they become necessary
//     default:
//         return;
//     }
//     event.preventDefault();
// }

// Interfacing with html

// image-list Section
function loadOriginalSize(event){
    // change the value of the original size check
    var selectval = document.getElementById("original-size-cbox");
    ImageViewer.originalSize = selectval.checked;
    return;
}

function loadImage2Viewer(event){
    // load image to viewer
    ImageViewer.imageLoad(event);
    return;
}

// viewer Section
function setDebug(event){
    // set debug mode
    var cbox = document.getElementById("debug-cbox");
    ImageViewer.debug = cbox.checked;
    console.log(ImageViewer);
    return;
}

// viewer-tools

function resetScene(){
    // reset scene
    ImageViewer.resetScene();
    return;
}

function addSelection(event){
    // add selection event
    var selectval = ImageViewer.selectInProcess;
    if(selectval === true){
        //
        ImageViewer.addSingleDrawnObject();
    }
    return;
}

// ------------- selector-set ---------------------

// ------------- selector-types -------------------
function setSelectorType(event){
    // set selector type to viewer
    var rbuttons = document.querySelector("input[name='selector-rbutton']:checked");
    var rbtnval = rbuttons.value;
    ImageViewer.selectorOptions.type = rbtnval;
    return;
}
// ------------- ends selector-types -------------------

// ------------- selector-options -------------------
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
        }
    }
    return rgbval;
}
function setSelectorStrokeColor(event){
    // set selector stroke color to viewer
    var rgbcode = getRgbCode("selector-stroke-color",
                             "selector-stroke-color-list");
    ImageViewer.selectorOptions.strokeColor = rgbcode;
    return;
}

function setSelectorFillColor(event){
    // set selector fill color to viewer
    var rgbcode = getRgbCode("selector-fill-color",
                             "selector-fill-color-list");
    ImageViewer.selectorOptions.fillColor = rgbcode;
    return;
}

function setSelectorFillOpacity(event){
    // set selector fill opacity to viewer
    var selectedValue = document.getElementById("selector-fill-opacity-list").value;
    ImageViewer.selectorOptions.fillOpacity = parseFloat(selectedValue, 10);
    return;
}

function setSelectionProcess(event){
    // set selection process to viewer
    var selectval = document.getElementById("selector-active-cbox");
    ImageViewer.selectInProcess=selectval.checked;
    return selectval;
}
function showAllSelections(){
    // show all previously added selections
    var selectval = document.getElementById("selector-showall-cbox");
    if(selectval.checked === true){
        console.log("in showall");
        ImageViewer.redrawAllDrawnObjects();
    }
}
// ------------- ends selector-options -------------------

// ------------- ends selector-set ---------------------

// ends Viewer Options ------------------------------------------

// Mouse Events -------------------------------------------------
function setSceneMouseUp(event){
    // set scene values for the mouse up event
    var selectval = ImageViewer.selectInProcess;
    if(selectval === true){
        ImageViewer.inMouseUp = true;
        //
        if(ImageViewer.selectorOptions.type === "polygon-selector"){
            var lastDrawingContext = ImageViewer.drawSelection(event);
            ImageViewer.drawPolygonFill(lastDrawingContext,
                                        ImageViewer.poly);
        }else{
            ImageViewer.drawSelection(event);
        }
    }
    ImageViewer.mousePressed = false;
    return;
}

function setSceneMouseDown(event){
    // set scene values for the mouse up event
    var selectval = ImageViewer.selectInProcess;
    if(selectval === true){
        // set boolean checks
        ImageViewer.inMouseUp = false; // necessary for closing polygon
        ImageViewer.mousePressed = true; // necessary for events with mouse press

        // get the type of the region that is being selected
        var rbuttons = document.querySelector("input[name='selected-region-rbutton']:checked");
        var rbtnval;
        if(rbuttons != null){
            rbtnval = rbuttons.value;
        }else{
            alert("Please Select the Region Type before adding the selection");
        }

        // get the selector type that is going to be used for selection
        var selectorType = ImageViewer.selectorOptions.type;
        if(selectorType === ""){
            alert("Please select a selector type");
        }else if(selectorType === "rectangle-selector"){
            // reset the rectangle if the selector is a rectangle
            ImageViewer.rect = {"x1" : "",
                                "type" : "rectangle",
                                "regionType" : "",
                                "y1" : "",
                                "x1_real" : "",
                                "y1_real" : "",
                                "width" : "",
                                "width_real" : "",
                                "height" : "",
                                "height_real" : "",
                                "imageId" : "",
                                "hratio" : "",
                                "vratio" : "",
                                "fillColor" : "",
                                "strokeColor" : "",
                                "fillOpacity" : "",
                                "id" : ""};
            ImageViewer.setRectId();
        }else if(selectorType === "polygon-selector"){
            // reset the polygon if the selector is a polygon
            ImageViewer.poly = {"pointlist" : [],
                                "id" : "",
                                "type" : "polygon",
                                "regionType" : "",
                                "hratio" : "",
                                "vratio" : "",
                                "fillColor" : "",
                                "strokeColor" : "",
                                "fillOpacity" : "",
                                "imageId" : ""};
            ImageViewer.setPolyId();
        }

        // set event coordinates as the selection coordinates
        ImageViewer.setSelectionCoordinates(event);
    }
    // test code
    return;
}

function setSceneMouseMove(event){
    // set values related to mouse movement to scene
    // console.log("in scene mouse move");
    var selectval = ImageViewer.selectInProcess;
    if(selectval === true){
        //
        ImageViewer.drawSelection(event);
    }
    return;
}
// ends Mouse Events -------------------------------------------------

// function imageLoad(){
//     // Load image to canvas
//     canvasDraw.imageLoad();
//     transcription.image = canvasDraw.image.pageImage;
// }

// window.onkeyup = globalKeyFuncs;

// function showToolBox(event){
//     var cbox = document.getElementById("showtoolbox-checkbox");
//     var fset = document.getElementById("hide-tools");
//     if(cbox.checked){
//         fset.setAttribute("style", "height: 20%;");
//     }else{
//         fset.setAttribute("style", "height: 0%;");
//     }
// }

// function activateViewer(){
//     var cbox = document.getElementById("activateViewer-checkbox");
//     transcription.removeViewer();
//     transcription.viewerCheck = cbox.checked;
// }

// // Transcription Related Functions

// function deleteBoxes(){
//     transcription.deleteBoxes();
// }

// function viewLine(event){
//     transcription.drawLineOnCanvas(event);
// }

// function undoDeletion(){
//     transcription.undoDeletion();
// }
// function sortLines(){
//     transcription.sortLines();
// }

// function markRTLTranscription(){
//     transcription.markRTL();
// }

// function markLTRTranscription(){
//     transcription.markLTR();
// }

// function selectAllLines(){
//     //
//     transcription.selectAllLines();
// }

// function deselectAllLines(){
//     //
//     transcription.deselectAllLines();
// }

// function addTranscription(){
//     transcription.currentRect = canvasDraw.image.currentRect;
//     transcription.addTranscription();
//     canvasDraw.image.lines = transcription.lines;
// }

// function saveTranscription(){
//     transcription.saveTranscription();
// }

// function changeAddTTitle(event){
//     var rbtn = event.target;
//     var val = rbtn.value;
//     var addTbtn = document.getElementById("addTranscriptionButton");
//     var addstr = "Add ";
//     addTbtn.title = addstr.concat(val);
// }
// // Canvas Related functions

// var allLinesCheck = false;

// function drawAllDetections(event){
//     var cbox = document.getElementById("showall-checkbox");
//     if(cbox.checked){
//         console.log("checked");
//         canvasDraw.drawAllLines(event);
//         allLinesCheck = true;
//     }else{
//         console.log("not");
//         allLinesCheck = false;
//         return;
//     }
// }

// function resetRect(){
//     canvasDraw.resetRect();
// }

// function canvasMouseDown(event){
//     canvasDraw.canvasMouseDown(event);
// }

// function canvasMouseUp(event){
//     canvasDraw.canvasMouseUp(event);
// }

// function canvasMouseMove(event){
//     if(allLinesCheck === true){
//         return;
//     }else{
//         transcription.currentRect = canvasDraw.image.currentRect;
//         canvasDraw.canvasMouseMove(event);
//         transcription.emphTransRegion(canvasDraw.image.hoveringRect);
//     }
// }

// function saveCoordinates(){
//     canvasDraw.saveCoordinates();
// }

// function saveEverything(){
//     // Saves the lines for transcribed coordinates
//     var textlines = transcription.getTranscriptions();
//     var coordinates = canvasDraw.getCoordinates();
//     var savelines = [];
//     // TODO change coordinates.length to textlines.length
//     // since we have less coordinates than transcriptions
//     // for now, we need to deal with undefined objects this way
//     for(var i=0; i < coordinates.length; i++){
//         var tline = textlines[i];
//         var cline = coordinates[i];
//         var newcline = Object.assign(cline);
//         newcline.index = tline.index;
//         newcline.text = tline.lineText;
//         savelines.push(newcline);
//     }
//     var stringfied = JSON.stringify(savelines, null, 4);
//     var w = window.innerWidth.toString();
//     var h = window.innerHeight.toString();
//     w = "width=".concat(w);
//     h = "height=".concat(h);
//     var spec = w.concat(",");
//     spec = spec.concat(h);
//     var saveWindow = window.open("", "Save Window", spec);
//     saveWindow.document.write("<pre>");
//     saveWindow.document.write(stringfied);
//     saveWindow.document.write("</pre>");
// };
//
// Change Add Transcription to Add line then associate the line with the region
//
