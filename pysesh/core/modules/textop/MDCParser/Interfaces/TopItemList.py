##################################
# interfaces taken from the jsesh
# ################################
# original author: Serge Rosmorduc
# python author: Kaan Eraslan
# license: GPL-3, see LICENSE
# No Warranty
#
# Note: Explanations in the docstrings are for the most part taken
# from java source files
###################################

from abc import ABC

# TopItemListInterface block ##################################

class TopItemListInterface(metaclass=ABC):
    """
    Interface for TopItemList:
    A list of top items : that is, item which form the text lines.
    This include Cartouches, Cadrats...
    Stuff is added to this list by the add...ToTopItemListInterface

    """
    pass
