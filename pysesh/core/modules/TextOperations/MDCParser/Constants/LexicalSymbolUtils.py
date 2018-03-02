##################################
# constants taken from the jsesh
# ################################
# original author: Serge Rosmorduc
# python author: Kaan Eraslan
# license: GPL-3, see LICENSE
# No Warranty
#
# Note: Explanations in the docstrings and comments
# are for the most part taken from java source files
###################################

from SymbolCodePoints import SymbolCodes

class LexicalSymbolUtils(object):
    """Regroups various methods for lexical utilites"""
    def __init__(self):
        """
        Attributes:

        codesToSymbols
            A dict containing the symbols

        symbolsToCodes
            A dict mapping the symbols back to code points
        """
        self.codesToSymbols = {}
        self.symbolsToCodes = {}
        #
        self.codesToSymbols[SymbolCodes.HALFSPACE] = "."
		self.codesToSymbols[SymbolCodes.FULLSPACE] = ".."
		self.codesToSymbols[SymbolCodes.REDPOINT] = "o"
		self.codesToSymbols[SymbolCodes.BLACKPOINT] = "O"
		self.codesToSymbols[SymbolCodes.FULLSHADE] = "//"
		self.codesToSymbols[SymbolCodes.VERTICALSHADE] = "v/"
		self.codesToSymbols[SymbolCodes.HORIZONTALSHADE] = "h/"
		self.codesToSymbols[SymbolCodes.QUATERSHADE] = "/"
		self.codesToSymbols[SymbolCodes.BEGINERASE] = "[["
		self.codesToSymbols[SymbolCodes.ENDERASE] = "]]"
		self.codesToSymbols[SymbolCodes.BEGINEDITORADDITION] = "[&"
		self.codesToSymbols[SymbolCodes.ENDEDITORADDITION] = "&]"
		self.codesToSymbols[SymbolCodes.BEGINMINORADDITION] = "[("
		self.codesToSymbols[SymbolCodes.ENDMINORADDITION] = ")]"
		self.codesToSymbols[SymbolCodes.BEGINDUBIOUS] = "[?"
		self.codesToSymbols[SymbolCodes.ENDDUBIOUS] = "?]"
		self.codesToSymbols[SymbolCodes.BEGINEDITORSUPERFLUOUS] = "[{"
		self.codesToSymbols[SymbolCodes.ENDEDITORSUPERFLUOUS] = "}]"
		self.codesToSymbols[SymbolCodes.BEGINPREVIOUSLYREADABLE] = "[\""
		self.codesToSymbols[SymbolCodes.ENDPREVIOUSLYREADABLE] = "\"]"
		self.codesToSymbols[SymbolCodes.BEGINSCRIBEADDITION] = "['"
		self.codesToSymbols[SymbolCodes.ENDSCRIBEADDITION] = "']"
		self.codesToSymbols[SymbolCodes.SMALLTEXT]= "\"\""
        #
        self.symbolsToCodes = {value:key for key, value in self.codesToSymbols.items()}
        #
        return None
    #
    def getStringForPhilology(self, codepoint: int):
        """Get Philology code points"""
        if codepoint == SymbolCodes.BEGINERASE:
            result = self.codesToSymbols[SymbolCodes.BEGINERASE]
	    elif codepoint == SymbolCodes.ENDERASE:
            result = self.codesToSymbols[SymbolCodes.ENDERASE]
		elif codepoint == SymbolCodes.BEGINEDITORADDITION:
            result = self.codesToSymbols[SymbolCodes.BEGINEDITORADDITION]
		elif codepoint == SymbolCodes.ENDEDITORADDITION:
            result = self.codesToSymbols[SymbolCodes.ENDEDITORADDITION]
		elif codepoint == SymbolCodes.BEGINEDITORSUPERFLUOUS:
            result = self.codesToSymbols[SymbolCodes.BEGINEDITORSUPERFLUOUS]
			 # [{ }] => { }
		elif codepoint == SymbolCodes.ENDEDITORSUPERFLUOUS:
            result = self.codesToSymbols[SymbolCodes.ENDEDITORSUPERFLUOUS]
			 # [{ }] => { }
		elif codepoint == SymbolCodes.BEGINPREVIOUSLYREADABLE:
            result = self.codesToSymbols[SymbolCodes.BEGINPREVIOUSLYREADABLE]
			 # [" "] => [| |]
		elif codepoint == SymbolCodes.ENDPREVIOUSLYREADABLE:
            result = self.codesToSymbols[SymbolCodes.ENDPREVIOUSLYREADABLE]
			 # [" "] => [| |]
		elif codepoint == SymbolCodes.BEGINSCRIBEADDITION:
            result = self.codesToSymbols[SymbolCodes.BEGINSCRIBEADDITION]
			# [' '] => ' '
		elif codepoint == SymbolCodes.ENDSCRIBEADDITION:
            result = self.codesToSymbols[SymbolCodes.ENDSCRIBEADDITION]
			 # [' '] => ' '
        else:
            result = "??"
        #
        return result
    #
    def getOpenCodeForPhilology(self, code: int) -> "":
        """Get opening philological paranthesis with code point"""
        result = ""
		if code == SymbolCodes.ERASEDSIGNS:
			result = self.codesToSymbols[SymbolCodes.BEGINERASE]
		elif code == SymbolCodes.EDITORADDITION:
			result = self.codesToSymbols[SymbolCodes.BEGINEDITORADDITION]
		elif code == SymbolCodes.EDITORSUPERFLUOUS:
			result = self.codesToSymbols[SymbolCodes.BEGINEDITORSUPERFLUOUS]
			 # [{ }] => { }
		elif code == SymbolCodes.PREVIOUSLYREADABLE:
			result = self.codesToSymbols[SymbolCodes.BEGINPREVIOUSLYREADABLE]
			 # [" "] => [| |]
		elif code == SymbolCodes.SCRIBEADDITION:
			result = self.codesToSymbols[SymbolCodes.BEGINSCRIBEADDITION]
        #
        return result
    #
    def getCloseCodeForPhilology(self, code: int) -> "":
        """Get closing philological paranthesis with code point"""
        result = ""
        if code == SymbolCodes.ERASEDSIGNS:
			result = self.codesToSymbols[SymbolCodes.ENDERASEDSIGNS]
		elif code == SymbolCodes.EDITORADDITION:
			result = self.codesToSymbols[SymbolCodes.ENDEDITORADDITION]
		elif code == SymbolCodes.EDITORSUPERFLUOUS:
			result = self.codesToSymbols[ENDEDITORSUPERFLUOUS]
			 # [{ }] => { }
		elif code == SymbolCodes.PREVIOUSLYREADABLE:
			result = self.codesToSymbols[ENDPREVIOUSLYREADABLE]
			 # [" "] => [| |]
		elif code == SymbolCodes.SCRIBEADDITION:
			result = self.codesToSymbols[ENDSCRIBEADDITION]
			 # [' '] => ' '
        #
        return result
    #
    def getStringForLexicalItem(self, code: int) -> "":
        """for simple lexical item, like space, halfspace, red
	 * point, etc."""
        return self.codesToSymbols[code]
    #
    def getCodeForString(self, mdcString: str) -> int:
        """Return integer for mdc string, or none"""
        return self.symbolsToCodes.get(mdcString, default=None)

