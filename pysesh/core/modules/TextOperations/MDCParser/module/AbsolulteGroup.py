##################################
# model taken from the jsesh
# ################################
# original author: Serge Rosmorduc
# python author: Kaan Eraslan
# license: GPL-3, see LICENSE
# No Warranty
#
# Note: Explanations in the docstrings are for the most part taken
# from java source files
###################################

class AbsoluteGroup(object):
    """
    A group of signs with explicit placement. IMPORTANT : currently, we need
    at least two signs in an absolute group.
    """
    serialVersionUID = -5214658535536154651L
    #
    def addHieroglyph(hiero):
        """
        Purpose
        --------
        Add a hieroglyph to group

        Description
        ------------
        Add a child. For compatibility with the graphical formats and
        because of questions of transparency, shading elements will be
        placed in front of other elements if necessary.

        """
