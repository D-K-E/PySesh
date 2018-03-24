##################################
# lex taken from the jsesh
# ################################
# original author: Serge Rosmorduc
# python author: Kaan Eraslan
# license: GPL-3, see LICENSE
# No Warranty
#
# Note: Explanations in the docstrings are for the most part taken
# from java source files
###################################

class MDCSubType(object):
    """
    MDCSubType is used to represent types that have an variety of
    subtypes. The code sent back by the lexer will give the main type,
    and the MDCSubType value will give the subtype.
    """
    def __init__(self, subType: int):
        "Constructor"
        self.subType = subType
        #
        return None
    #
    def getSubType(self) -> int:
        "Get subType from instance"
        return self.subType
    #
    def setSubType(self, s_type: int) -> None:
        "Set subtype to instance"
        self.subType = s_type
        return None
    #
