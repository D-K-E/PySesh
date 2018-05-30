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

# HorizontalListElement Block #############################

class HorizontalListElementInterface(metaclass=ABC):
    """Interface for the HorizontalListElement"""
    pass

class ComplexLigatureInterface(HorizontalListElementInterface):
    """Extends the HorizontalListElementInterface"""
    def __init__(self):
        super().__init__()
        #
        return None

class InnerGroupInterface(HorizontalListElementInterface):
    """
    Extends the HorizontalListElementInterface
    The innermost groups :
    Hieroglyphs, ligatures, philology groups (if needed),
    and sub cadrats
    Abstract interface. Only sub interfaces for this one are of interest.
    """
    def __init__(self):
        super().__init__()
        #
        return None

class CartoucheInterface(InnerGroupInterface):
    """Extends the InnerGroupInterface"""
    def __init__(self):
        super().__init__()
        #
        return None

class AbsoluteGroupInterface(InnerGroupInterface):
    """
    Extends the InnerGroupInterface:
    A group (built with "&&" for which the placement of the signs is explicit.
    """
    def __init__(self):
        super().__init__()
        #
        return None

class HieroglyphInterface(InnerGroupInterface):
    """
    Extends innerGroupInterface
    SignInterface subsumes both hieroglyphs and symbols
    (such as shading signs).
    """
    def __init__(self):
        super().__init__()
        #
        return None

class LigatureInterface(InnerGroupInterface):
    """Extends InnerGroupInterface"""
    def __init__(self):
        super().__init__()
        #
        return None

class OverwriteInterface(InnerGroupInterface):
    """Extends InnerGroupInterface"""
    def __init__(self):
        super().__init__()
        #
        return None

class PhilologyInterface(InnerGroupInterface):
    """Extends InnerGroupInterface"""
    def __init__(self):
        super().__init__()
        #
        return None


class SubCadratInterface(InnerGroupInterface):
    """Extends InnerGroupInterface"""
    def __init__(self):
        super().__init__()
        #
        return None
