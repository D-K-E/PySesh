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

class MDCAlphabeticText(object):
    "MDC alphabetic text"
    scriptCode = "l"
    text = ""
    #
    def __init__(self, scriptCode: str, text: str):
        "Constructor"
        self.scriptCode = scriptCode
        self.text = text
        #
        return None
    #
    def getScriptCode(self) -> str:
        """
        Possible codes are 'l' for latin, 'b' for latin bold,
	    'i' for latin italic, '+' for comments,
	    't' for transliteration, 'c' for coptic, 'g' for
	    greek, 'r' for cyrillic, 'h' for hebrew.
        """
        return self.scriptCode
    #
    def getText(self) -> str:
        "Get the text of the instance "
        return self.text
    #
    def setScriptCode(self, code_char: str) -> None:
        "Set the script code for the instance"
        self.scriptCode = code_char
        return None
    #
    def setText(self, text: str)-> None:
        "Set text for the instance"
        self.text = text
        return None
