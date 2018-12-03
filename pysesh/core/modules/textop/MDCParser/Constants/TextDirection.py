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

class TextDirection(object):
    "Toggle Type as enum class"
       LEFT_TO_RIGHT = "LEFT_TO_RIGHT"
       RIGHT_TO_LEFT = "RIGHT_TO_LEFT"
    #
    def __init__(self,
                 text_direction: str
    ) -> None:
        "Constructor"
        self.text_direction = text_direction
        #
        return None
    #
    def isLeftToRight(self) -> bool:
        "Left to Right check"
        return bool(self.text_direction == TextDirection.LEFT_TO_RIGHT)
