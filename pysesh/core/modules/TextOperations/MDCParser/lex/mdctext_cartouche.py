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

class MDCCartouche(object):
    """
    Builds a cartouche:
    possible values are 'c', 's', 'f' and 'h'. Uppercase
    letters are allowed.
    """
    #
    def __init__(self,
                 cartouche_type: str,
                 cartouche_part: int):
        "Constructor"
        self.cartouche_type = cartouche_type.lower()
        self.cartouche_part = cartouche_part
        #
        return None
    #
    #  for a given type of cartouche, indicate how this extremity
    #       should be drawn.
    #
    #       meaning depends on cartouche.
    #        0 : do not draw this ending.
    #       	for cartouches and serekh 1 : begin 2 : end
    #       		(2 being normally the decorated part)
    #        for Hout signs : 
    #      		1 : no square
    #      		2 : square in the lower part.
    #      		3 : square in the upper part
    #
    #        Note that <-....-> is equivalent to <1-....-2>
    #        and that <H-..-> is equivalent to <h1-...-h2>
    #
    def getPart(self) -> int:
        "Get instance part"
        return self.cartouche_part
    #
    def getType(self) -> str:
        "Get instance cartouche type"
        return self.cartouche_type
    #

