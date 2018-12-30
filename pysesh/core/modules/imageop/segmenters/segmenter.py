####################################
__author__ = "Kaan Eraslan"        #
# No Warranties                    #
__license__ = "GPL-3, see LICENSE" #
####################################


import imageio
import numpy as np  # array/matrix manipulation
import scipy.ndimage as nd  # operate easily on image matrices
import os
import glob
import json

from pointcarver import SeamMarker

currentDir = os.getcwd()

imageopdir = os.path.join(currentDir, os.pardir)

moduleDir = os.path.join(imageopdir, os.pardir)

coreDir = os.path.join(moduleDir, os.pardir)

datadir = os.path.join(coreDir, 'data')

imageDataDir = os.path.join(datadir, 'Images')

rawImageDir = os.path.join(imageDataDir, 'raw')

coordinateDir = os.path.join(imageDataDir, 'coordinates')

pointDir = os.path.join(coordinateDir, 'point')

segmentDir = os.path.join(coordinateDir, 'segmenter')



def loadImageData(filename: str,
                  ext: str,
):
    "Load the image file from data dir"
    imfile = os.path.join(filename, rawImageDir)
    img = imageio.imread(imfile, ext)
    namelen = len(filename)
    extlen = len(ext)
    isExtInFilename = filename.endswith(ext)
    if isExtInFilename:
        basename = filename[:namelen-extlen]
    else:
        basename = filename
    return (img, basename)


def loadImageCoordinates(basename: str):
    "Load image coordinate"
    coordinateFile = os.path.join(coordinateDir,
                                  basename)
    coordfileList = glob.glob(coordinateFile + '.*')
    if len(coordfileList) > 1:
        raise ValueError('Please provide only a single coordinate file')
    elif len(coordfileList) == 0:
        raise ValueError(
            'Please provide a coordinate file to {0}'.format(coordinateDir)
        )
    coord = coordfileList[0]
    # TODO continue with loading coordinates

