# import unlabeled images to assets/images folder
# make a imagePathList.txt containing their paths
# in asset/images folder
import os
import glob
from jinja2 import Template, Environment, select_autoescape, FileSystemLoader

def getRawImagesFromSource(image_ext: str) -> list:
    "Get images according to extension"
    currentdir = os.getcwd()
    modulesdir = os.path.join(currentdir, os.pardir)
    # modulesdir = currentdir + os.sep + os.pardir
    coredir = os.path.join(modulesdir, os.pardir)
    # coredir = modulesdir + os.sep + os.pardir
    datadir = os.path.join(coredir, "data")
    # datadir = coredir + os.sep + "data"
    imagedir = os.path.join(datadir, "Images")
    # imagedir = datadir + os.sep + "Images"
    rawdir = os.path.join(imagedir, "raw")
    # rawdir = imagedir + os.sep + "raw"
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

def prepareAssets(image_ext: str):
    "Prepare assets that will be rendered by the template"
    assets = {}

    # get images from their location
    getpath = "assets" + os.sep + "images"
    imlist = glob.glob(getpath + os.sep + "**." + image_ext)
    imlist = [[im, os.path.basename(im), indx] for indx, im in enumerate(imlist)]
    assets["images"] = imlist

    # get scripts from their location
    scriptPath = "assets" + os.sep + "js" + os.sep
    scripts = glob.glob(scriptPath + "**.js")
    scripts = [[spath, "javascript"] for spath in scripts]
    assets["scripts"] = scripts

    # get css from their location
    cssPath = "assets" + os.sep + "css" + os.sep
    stylesheets = glob.glob(cssPath + "**.css")
    stylesheets = [[csspath, "css"] for csspath in stylesheets]
    assets["stylesheets"] = stylesheets

    # get icons from their location
    iconpath = "assets" + os.sep + "icons" + os.sep
    icons = glob.glob(iconpath + "**.svg")
    icons = {os.path.basename(ipath): ipath for ipath in icons}
    assets["icons"] = icons
    return assets


def renderAssets(assets: dict,
                 layoutpath="layout.html",
):
    "Get images from getpath"

    # load to template
    current_dir = os.getcwd()
    template_dir = current_dir + os.sep + "assets" + os.sep  + "templates"
    jinenv = Environment(autoescape=select_autoescape(['html', 'xml']),
                         loader=FileSystemLoader(template_dir))
    template = jinenv.get_template(layoutpath)
    (imlist, scripts,
     sheets, icons) = (assets["images"], assets["scripts"],
                       assets["stylesheets"], assets["icons"])
    output = template.render(impaths=imlist,
                             scripts=scripts,
                             sheets=sheets,
                             icons=icons)
    interfacepath = "interface.html"
    with open(interfacepath, "w", encoding="utf-8", newline="\n") as htmlf:
        htmlf.write(output)
    print("Interface ready for use!")
    #
    return None

if __name__ == "__main__":

    print("Welcome to interface preparation util")

    image_extension = input("Please provide an extension for images (default png): ")

    if not image_extension:
        image_extension = "png"

    imlist = getRawImagesFromSource(image_extension)
    saveRawImages(imlist)
    assets = prepareAssets(image_extension)
    renderAssets(assets)
