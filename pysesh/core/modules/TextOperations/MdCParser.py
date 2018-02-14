# Author: Kaan Eraslan
# No Warranty

__author__ = "Kaan Eraslan"
__license__ = "GPL-3 License, see LICENSE"

# Package Declarations

import re

# End of Package Declarations

class MdCCharacter(object):
    """Character object in MdC"""
    def __init__(self, mdc_char: str):
        self.mdc_char = mdc_char
        assert(isinstance(self.mdc_char, str))
        return None
    #
    def get_char(self):
        """Get the character from the constructor"""
        return self.mdc_char
    #
    def check_contains_char(self, text: str) -> bool:
        """Check if the text contains the char"""
        assert(isinstance(text, str))
        return bool(self.mdc_char in text)
    #
    def findall(self, text: str):
        """Find all the occurences of the char in text"""
        if self.check_contains_char() is False:
            results = None
        else:
            results = re.findall(pattern=self.mdc_char,
                                 string=text)
        return results
    #
    def split_by_char(self, text: str) -> []:
        """Split the text by mdc char"""
        if self.check_contains_char(text) is False:
            return None
        #
        split_text = text.split(self.get_char())
        return split_text
    #
    def count_chars(self, text: str) -> int:
        """Count the number of chars in text"""
        mdc_chars = self.findall(text)
        if mdc_chars is None:
            nb_chars = 0
        else:
            nb_chars = len(mdc_chars)
        #
        return nb_chars

#
#

class MdCSeparator(object):
    """Defines the Separators in MdC"""
    def __init__(self):
        """Constructor for MdC Separator"""
        self.sign_separator = MdCCharacter(mdc_char="-")
        self.sign_separator_horizontal = MdCCharacter(mdc_char="*")
        self.sign_separator_vertical = MdCCharacter(mdc_char=":")
        #
        return None
    #
    def get_separator_chars(self) -> []:
        """Return all the separators in a list"""
        return [
            self.sign_separator.get_char(),
            self.sign_separator_horizontal.get_char(),
            self.sign_separator_vertical.get_char()
        ]
    #
    def get_vertical_sep_char(self) -> str:
        """Return vertical separator"""
        return self.sign_separator_vertical.get_char()
    #
    def get_sign_sep_char(self) -> str:
        """Return sign separator"""
        return self.sign_separator.get_char()
    #
    def get_horizontal_sep_char(self) -> str:
        """Return horizontal separator"""
        return self.sign_separator_horizontal.get_char()
    #
    def check_contains_separators(self, text: str) -> bool:
        """Check if text contains separators"""
        if self.check_contains_sep_sign(text) is False:
            return False
        if self.check_contains_sep_vertical(text) is False:
            return False
        if self.check_contains_sep_horizontal(text) is False:
            return False
        #
        return True
    #
    def check_contains_sep_horizontal(self, text: str) -> bool:
        """Check if text contains horizontal separators"""
        return self.sign_separator_horizontal.check_contains_char(text)
    #
    def check_contains_sep_vertical(self, text: str) -> bool:
        """Check if text contains vertical separators"""
        return self.sign_separator_vertical.check_contains_char(text)
    #
    def check_contains_sep_sign(self, text: str) -> bool:
        return self.sign_separator_vertical.check_contains_char(text)
    #
    def findall_separators(self, text: str) -> ():
        """Find all separators in the text"""
        vertical = self.findall_sep_vertical(text)
        horizontal = self.findall_sep_horizontal(text)
        sign = self.findall_sep_sign(text)
        return (sign, horizontal, vertical)
    #
    def findall_sep_horizontal(self, text: str):
        """Find all occurences of horizontal separator"""
        return self.sign_separator_horizontal.findall(text)
    #
    def findall_sep_vertical(self, text: str):
        """Find all occurences of vertical separator"""
        return self.sign_separator_vertical.findall(text)
    #
    def findall_sep_sign(self, text: str):
        """Find all occurences of sign separator"""
        return self.sign_separator.findall(text)
    #
    def split_sep_horizontal(self, text: str):
        """Split text by horizontal separator"""
        return self.sign_separator_horizontal.split_by_char(text)
    #
    def split_sep_vertical(self, text: str):
        """Split text by vertical separator"""
        return self.sign_separator_vertical.split_by_char(text)
    #
    def split_sep_sign(self, text: str):
        """Split text by sign separator"""
        return self.sign_separator.split_by_char(text)
    #
    def count_sep_horizontal(self, text: str) -> int:
        """Count the horizontal separator in text"""
        return self.sign_separator_horizontal.count_chars(text)
    #
    def count_sep_vertical(self, text: str) -> int:
        """Count the horizontal separator in text"""
        return self.sign_separator_vertical.count_chars(text)
    #
    def count_sep_sign(self, text: str) -> int:
        """Count the horizontal separator in text"""
        return self.sign_separator.count_chars(text)

class MdCGrammarEnd(MdCCharacter):
    """Defines grammar end in MdC"""
    def __init__(self):
        """Constructor MdC grammar end"""
        super().__init__(mdc_char="=")
        #
        return None

class MdCWordEnd(MdCCharacter):
    """Defines WordEnd in MdC"""
    def __init__(self):
        super().__init__(mdc_char="_")
        """Construct MdC Word end based on the grammar"""
        #
        return None

class MdCLineEnd(MdCCharacter):
    """Line end object from MdC grammar"""
    def __init__(self):
        """Constructor for Line end object"""
        super().__init__(mdc_char="!")
        #
        return None
    #
class MdCPageEnd(MdCCharacter):
    """Page end object from MdC grammar"""
    def __init__(self):
        """Constructor for Page end object"""
        super().__init__(mdc_char="!!")
        return None
    #

class MdCTextSuper(MdCCharacter):
    """Text super object from MdC Grammar"""
    def __init__(self):
        """Constructor for TextSuper object"""
        super().__init__(mdc_char="|")
        return None
    #
class MdCHieroglyph(MdCCharacter):
    """Hieroglyph object from MdC Grammar"""
    def __init__(self, glyph_name: str):
        """Constructor for hieroglyph"""
        super().__init__(mdc_char=glyph_name)
        #
        return None


class MdCFile(object):
    """Contains the MdC file"""
    def __init__(self):
        """Construct MdC file based on the grammar"""
        #
        self.word_ends = [MdCWordEnd()]
        self.separators = []
        self.text_item_group = []

