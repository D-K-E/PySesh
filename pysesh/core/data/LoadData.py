####################################
__author__ = "Kaan Eraslan"        #
# No Warranties                    #
__license__ = "GPL-3, see LICENSE" #
####################################
# Package Declaration
import os
# End of Package Declaration

class LoadGlyphPaths(object):
    """Load Glyph Paths"""
    def __init__(self):
        self.glyph_paths = []
        self.glyphs = []
        self.glyph_extension = "svg"
        #
        self.path = os.path.abspath("./Images/GlyphSvg")
        #
        return None
    #
    def get_glyph_paths(self):
        "Get glyph paths from path"
        for element in os.path.listdir(self.path):
            extension = "." + self.glyph_extension
            if element.endswith(extension):
                abs_el = os.path.abspath(element)
                self.glyph_paths.append(abs_el)
                glyph_name_len = len(element) - len(extension)
                self.glyphs.append(element[:glyph_name_len])
        #
        return None
