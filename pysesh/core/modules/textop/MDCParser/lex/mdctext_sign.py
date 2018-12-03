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

class MDCSign(object):
    "Sign object for mdc text"
    def __init__(self, sign_type: int, sign_string: str):
        "Constructor"
        self.sign_type = sign_type
        self.sign_string = sign_string
        #
    #
    def getType(self) -> int:
        "Get sign type for the instance"
        return self.sign_type
    #
    def setType(self, s_type: int) -> None:
        "Set sign type for the instance"
        self.sign_type = s_type
        return None
    #
    def getSignString(self) -> str:
        "Get sign string from the instance"
        return self.sign_type
    #
    def setSignString(self, s_string: str) -> None:
        "Set sign to the instance"
        self.sign_string = s_string
        return None
    #
