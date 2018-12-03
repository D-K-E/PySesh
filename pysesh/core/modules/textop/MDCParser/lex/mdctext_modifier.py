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

class MDCModifier(object):
    """
    Analyse a string in MDC format and extracts the modifier
    it represents
    """
    #
    def __init__(self, string: str):
        "Constructor"
        self.name = ""
        self.value = int
        self.mdc_string = string
        #
        return None
    #
    def setName(self) -> None:
        """
        Set name for the instance
        Skip the initial "\"
	    find the first char in str which is not
	    an ASCII letter nor an "?"
        """
        end_position = 1
        for index, char in enumerate(self.mdc_string):
            if index > 1 and char.isalpha() == True:
                if char != "?":
                    end_position += 1
        #
        self.name = self.mdc_string[1:end_position]
        #
        return None
    #
    def setValue(self) -> None:
        "Set value for the instance"
        #
        name_length = len(self.name)
        value_string = self.mdc_string[name_length:]
        self.value = int(value_string)
        #
        return None
    #
    def buildMDCModifier(self, mdc_string: str) -> None:
        "Set class values from a given string"
        self.mdc_string = mdc_string
        self.setName()
        self.setValue()
        #
        return None
    #
    def getName(self):
        "Get name from instance"
        return self.name
    #
    def getValue(self):
        "Get value from instance"
        return self.value
    #
    def getString(self):
        "Get mdc_string from instance"
        # might help debugging
        return self.mdc_string
    #
    def toString(self):
        "Get String representation of the modifier"
        return "\\" + self.getName() + "=" + self.getValue()
    #

