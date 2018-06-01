# -*- coding: utf-8 -*-
# Simple annotator for producing coordinate data

from PyQt5 import QtCore, QtGui, QtWidgets, Qt
from selector_brut import Ui_MainWindow as QtDesignerImageWindow
import os
import sys

# end of Packages

class Annotator_init(QtDesignerImageWindow):
    """Initializes the Image Window made in qt designer"""
    # Constructor
    #
    def __init__(self):
        # The Main Window as it is designed by
        # Qt Designer.
        self.main_window = Qt.QMainWindow()
        super().setupUi(self.main_window)
        #

class ViewerNew(QtWidgets.QGraphicsView):
    """
    Overwrite methods of graphics view for selectors

    taken from SO: https://stackoverflow.com/a/47108486/7330813
    """
    rectChanged = QtCore.pyqtSignal(QtCore.QRect)
    def __init__(self, *args, **kwargs):
        QtWidgets.QGraphicsView.__init__(self, *args, **kwargs)
        self.rubberBand = QtWidgets.QRubberBand(QtWidgets.QRubberBand.Rectangle, self)
        self.setMouseTracking(True)
        self.origin = QtCore.QPoint()
        self.changeRubberBand = False

    def mousePressEvent(self, event):
        self.origin = event.pos()
        self.rubberBand.setGeometry(QtCore.QRect(self.origin, QtCore.QSize()))
        self.rectChanged.emit(self.rubberBand.geometry())
        self.rubberBand.show()
        self.changeRubberBand = True
        QtWidgets.QGraphicsView.mousePressEvent(self, event)

    def mouseMoveEvent(self, event):
        if self.changeRubberBand:
            self.rubberBand.setGeometry(QtCore.QRect(self.origin, event.pos()).normalized())
            self.rectChanged.emit(self.rubberBand.geometry())
        QtWidgets.QGraphicsView.mouseMoveEvent(self, event)

    def mouseReleaseEvent(self, event):
        self.changeRubberBand = False
        QtWidgets.QGraphicsView.mouseReleaseEvent(self, event)
    #
# Final Interface -----------------------------

class Annotator_final(Annotator_init):
    "Final version of the interface"
    def __init__(self):
        super().__init__()
        self.main_window.setWindowTitle("PySesh Image Annotator")
        self.main_window.closeEvent = self._closeEvent
        #
        # ---- Central Widget -------------
        #
        self.centralwidget.setMinimumSize(640,480)
        #
        # File Loading ---------------------------
        #
        self.importImagesButton.clicked.connect(self._browseFolder)
        self.importImagesButton.setShortcut("ctrl+o")
        self.removeImageButton.clicked.connect(self._remove_image)
        # Load Image ------------------
        self.loadImageButton.clicked.connect(self.get_image)
        #
        # ---- Image Operations -----------
        #
        self.image_dict = {}
        self.viewer_new = ViewerNew()
        self.GraphicWidget.addWidget(self.viewer_new)
        self.viewer_new.rectChanged.connect(self.onRectChanged)
        self.graphicsScene = QtWidgets.QGraphicsScene()
        self.pixmap_image = QtGui.QPixmap()
        #
    #
    # #### Standard Gui Elements ####
    #
    def _closeEvent(self, event):
        reply = QtWidgets.QMessageBox.question(self.centralwidget,'Message',
            "Are you sure to quit?", QtWidgets.QMessageBox.Yes | 
            QtWidgets.QMessageBox.No, QtWidgets.QMessageBox.No)

        if reply == QtWidgets.QMessageBox.Yes:
            event.accept()
        else:
            event.ignore()
            #
        #
        return None
    #
    def _browseFolder(self):
        """
        Imports the images to the image list
        from the selected images in the file dialog
        """
        #
        self.imageListWidget.clear()
        # Clears the image in the image list section
        #
        #directory = QFileDialog.getExistingDirectory(self, "Pick Images")
        file_directory = QtWidgets.QFileDialog.getOpenFileNames(self.centralwidget,
                                                      "Pick Images",
                                                      "",
                                                      "Images (*.jpg *.png)")
        # Opens a file browsing window, with title pick images.
        #
        if file_directory:
            for file_name in file_directory[0]:
                file_item = QtWidgets.QListWidgetItem(self.imageListWidget)
                image_index = self.imageListWidget.indexFromItem(file_item)
                image_dict = {}
                item_name = os.path.basename(file_name)
                file_item.setText(item_name)
                image_dict['image_path'] = file_name
                image_dict['image_name'] = item_name
                image_dict['image_index'] = image_index
                self.image_dict[image_index] = image_dict
                self.imageListWidget.sortItems()
        #
        return None
    #
    def showInterface(self):
        """
        start the interface
        """
        #
        self.main_window.show()
        #
        return
    #
    # Image List Widget
    #
    def _remove_image(self):
        """
        Removes selected images in the Widgetlist
        """
        #
        selected_images = self.imageListWidget.selectedItems()
        # Gives the selected images in the image list
        #
        for image in selected_images:
            item_row = self.imageListWidget.row(image)
            # Gives the image row a variable
            self.imageListWidget.takeItem(item_row)
            # Pops the image row from the list.
            #
        #
        #self.image_GraphicScene.clear()
        # Clears the scene
    #
    #
    # GraphicView Widget
    #
    def get_image(self):
        """
        gets the selected image from the widget list
        and passes it to the image_cv_read
        """
        #
        if self.graphicsScene.isActive():
            self.graphicsScene.clear()
            # If the scene is occupied the newly
            # selected image clears the old one.
        if len(self.imageListWidget.selectedItems()) > 1:
            # Checks to see if there are images selected in the
            # image list.
            self.statusbar.showMessage("Please select only 1 image for loading")
            return
        elif len(self.imageListWidget.selectedItems()) < 1:
            self.statusbar.showMessage("Please select an image for loading")
            return
        #
        elif len(self.imageListWidget.selectedItems()) == 1:
            selected_image = self.imageListWidget.selectedItems()[0]
            selected_image_index = self.imageListWidget.indexFromItem(
                selected_image
            )
            im_dict = self.image_dict[selected_image_index]
            img_path = im_dict['image_path']
            img = QtGui.QImage(img_path)
            self.view_image(qt_image=img)
        #
        return None
    #
    def view_image(self, qt_image):
        """Display the image in Scene"""
        # Scale qt_image
        self.pixmap_image = QtGui.QPixmap.fromImage(qt_image)
        width_px, height_px = (self.pixmap_image.width(),
                               self.pixmap_image.height())
        self.graphicsScene.setSceneRect(0,0, width_px, height_px)
        self.graphicsScene.addPixmap(self.pixmap_image)
        self.viewer_new.setSceneRect(0, # item position x
                                       0, # item position y
                                       width_px, height_px)
        self.viewer_new.setScene(self.graphicsScene)
        self.viewer_new.show()
        #
        return None
    #
    def onRectChanged(self, r):
        topLeft = r.topLeft()
        bottomRight = r.bottomRight()
        print(topLeft.x(), topLeft.y(), bottomRight.x(), bottomRight.y())
        # TODO change this to be active if the radio button is selected
        # and take the coordinates and added to the dictionary of the
        # image in the image dict




if __name__ == '__main__':
    #
    app = Qt.QApplication(sys.argv)
    window = Annotator_final()
    window.showInterface()
    sys.exit(app.exec_())
