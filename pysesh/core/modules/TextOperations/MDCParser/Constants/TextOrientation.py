##################################
# constants taken from the jsesh
# ################################
# original author: Serge Rosmorduc
# python author: Kaan Eraslan
# license: GPL-3, see LICENSE
# No Warranty
#
# Note: Explanations in the docstrings are for the most part taken
# from java source files
###################################

import enum

class TextOrientation(object):
    """Text orentation as enum class"""
    Orientation = enum.Enum(value="Orientation",
                            names=["HORIZONTAL", "VERTICAL"],
                            qualname="TextOrientation.Orientation")
    #
    def isHorizontal(self) -> bool:
        """Check if the orientation is Horizontal"""
        return bool(TextOrientation.Orientation.HORIZONTAL)

