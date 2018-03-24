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

class MDCShading(object):
    "Implements mdc symbols interface"
    def __init__(self):
        #
        self.shading_nb = set([0])
        #
    def getShading(self):
        "Get shading instance"
        return self.shading_nb
    #
    def setShading(self, mdc_string) -> None:
        "Set shading value"
        for char in mdc_string:
            if char.isdigit():
                self.shading_nb.add(char)
        #
        return None

