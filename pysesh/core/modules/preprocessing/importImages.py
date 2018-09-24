# import unlabeled images to assets/images folder
# make a imagePathList.txt containing their paths
# in asset/images folder
import os
import glob
from jinja2 import Template, Environment, select_autoescape, FileSystemLoader

def getRawImagesFromSource(image_ext: str) -> list:
    "Get images according to extension"
    currentdir = os.getcwd()
    modulesdir = currentdir + os.sep + os.pardir
    coredir = modulesdir + os.sep + os.pardir
    datadir = coredir + os.sep + "data"
    imagedir = datadir + os.sep + "Images"
    rawdir = imagedir + os.sep + "raw"
    rawimages = glob.glob(rawdir + os.sep + "**." + image_ext)
    return rawimages


def saveRawImages(images: list,
                  savepath="." + os.sep + "assets" + os.sep + "images"):
    "Save raw images to path"
    for imagepath in images:
        imname = os.path.basename(imagepath)
        newpath = savepath + os.sep + imname
        with open(imagepath, "rb") as imfile:
            img = imfile.read()
        with open(newpath, "wb") as imfile:
            imfile.write(img)

def renderImagePaths(image_ext: str,
                     layoutpath="layout.html",
                     getpath="assets" + os.sep + "images"):
    "Get images from getpath"
    imlist = glob.glob(getpath + os.sep + "**." + image_ext)
    imlist = [[im, os.path.basename(im)] for im in imlist]
    jinenv = Environment(autoescape=select_autoescape(['html', 'xml']),
                         loader=FileSystemLoader("./assets/templates"))
    template = jinenv.get_template(layoutpath)
    output = template.render(impaths=imlist)
    interfacepath = "interface.html"
    with open(interfacepath, "w", encoding="utf-8", newline="\n") as htmlf:
        htmlf.write(output)
    print("Interface ready for use!")
    #
    return None


print("Welcome to interface preparation util")

image_extension = input("Please provide an extension for images (default png): ")

if not image_extension:
    image_extension = "png"

imlist = getRawImagesFromSource(image_extension)
saveRawImages(imlist)
renderImagePaths(image_extension)
