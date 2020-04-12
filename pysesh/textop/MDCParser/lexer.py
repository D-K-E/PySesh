# author: Kaan Eraslan
# purpose: symbols for mdc parser based on yacc

"""
File taken from:
https://github.com/rosmord/jsesh/blob/master/jsesh/src/main/resources/jsesh/mdc/gram.txt

commit no: d1f6656
commit date: 6 Feb 2011 
file author: Serge Rosmorduc

mdcfile   ::= [WORDEND] [SEPARATOR] (textitem [SEPARATOR])+
textitem    ::= cadrat [HACHING] | cartouche | PAGEEND | LINEEND | TEXTSUPER | TOGGLE | TEXT
cadrat ::= subcadrat (":" subcadrat)*
subcadrat  ::= inhierlist ("*" inhierlist)*
inhierlist  ::= sign | BEGINPHIL cadrats ENDPHIL | "(" cadrats ")"
cadrats   ::= maincadrat ([SEPARATOR] maincadrat)*                             
maincadrat ::= cadrat | TEXT
sign ::= (hieroglyphs | SYMBOL) [OVERWRITE (hieroglyphs|SYMBOL)]
hieroglyphs ::= hieroglyph [ligature]
ligature ::=  ("&" hieroglyph)+
hieroglyph  ::= [GRAMMAR] HIEROGLYPH MODIFIER* [WORDEND]

// The new kind of cartouches.
cartouche ::= BEGINCARTOUCHE (cadrat [HACHING] | TEXT | TOGGLE)* ENDCARTOUCHE
// old kind of cartouches
cartouches ::= BEGINOLDCARTOUCHE 


BEGINPHIL/ENDPHIL = parenthesized constructs


CURRENT GRAMMAR :

[0] mdcfile ::= optWordEnd textitems 
[1] $START ::= mdcfile EOF 
[2] textitems ::= 
[3] textitems ::= textitems optSeparator textitem 
[4] textitem ::= topcadrat 
[5] textitem ::= cartouche 
[6] textitem ::= toggle 
[7] textitem ::= text 
[8] textitem ::= lineEnd 
[9] textitem ::= pageEnd 
[10] textitem ::= textSuper 
[11] lineEnd ::= LINEEND 
[12] pageEnd ::= PAGEEND 
[13] textSuper ::= TEXTSUPER 
[14] toggle ::= TOGGLE 
[15] text ::= TEXT 
[16] topcadrat ::= cadrat optShading 
[17] optShading ::= 
[18] optShading ::= SHADING 
[19] cadrat ::= verticalStack 
[20] verticalStack ::= horizontalList 
[21] verticalStack ::= verticalStack COLUMN horizontalList 
[22] horizontalList ::= horizontalListElement 
[23] horizontalList ::= horizontalList STAR horizontalListElement 
[24] horizontalListElement ::= complexsign 
[25] horizontalListElement ::= BEGINPHIL cadrats ENDPHIL 
[26] horizontalListElement ::= BPAR cadrats EPAR 
[27] cadrats ::= maincadrats 
[28] maincadrats ::= maincadrat 
[29] maincadrats ::= maincadrats optSeparator maincadrat 
[30] optSeparator ::= 
[31] optSeparator ::= SEPARATOR 
[32] maincadrat ::= cadrat 
[33] maincadrat ::= text 
[34] maincadrat ::= toggle 
[35] complexsign ::= hieroglyphsOrSymbol 
[36] complexsign ::= hieroglyphsOrSymbol OVERWRITE hieroglyphsOrSymbol 
[37] hieroglyphsOrSymbol ::= hieroglyphs 
[38] hieroglyphsOrSymbol ::= SYMBOL 
[39] hieroglyphs ::= ligatures 
[40] ligatures ::= hieroglyph 
[41] ligatures ::= ligatures AMP hieroglyph 
[42] hieroglyph ::= optGrammar HIEROGLYPH modifiers optWordEnd 
[43] optWordEnd ::= 
[44] optWordEnd ::= WORDEND 
[45] optGrammar ::= 
[46] optGrammar ::= GRAMMAR 
[47] modifiers ::= 
[48] modifiers ::= modifiers MODIFIER 
[49] cartouche ::= BEGINCARTOUCHE cartoucheTexts ENDCARTOUCHE 
[50] cartouche ::= BEGINOLDCARTOUCHE cartoucheTexts ENDCARTOUCHE 
[51] cartoucheTexts ::= 
[52] cartoucheTexts ::= cartoucheTexts cartoucheText 
[53] cartoucheText ::= topcadrat 
[54] cartoucheText ::= text 
[55] cartoucheText ::= toggle 


BNF View :

mdcfile ::= [WordEnd] topitems 

topitems ::= ([Separator] topitem)*

topitem= topcadrat 
	| cartouche 
	| toggle 
	| text 
	| lineEnd 
	| pageEnd 
	| textSuper

topcadrat ::= cadrat optShading

[11] lineEnd ::= LINEEND 
[12] pageEnd ::= PAGEEND 
[13] textSuper ::= TEXTSUPER 
[14] toggle ::= TOGGLE 
[15] text ::= TEXT 

optShading ::= 0 | SHADING 

cadrat ::= verticalStack 

verticalStack ::= horizontalList (COLUMN horizontalList)*

horizontalList ::= horizontalList (STAR horizontalListElement)*

horizontalListElement ::= complexsign 
	| BEGINPHIL cadrats ENDPHIL 
	| BPAR cadrats EPAR 

cadrats ::= maincadrats 

maincadrats ::= maincadrat 
maincadrats ::= maincadrats ([Separator] maincadrat)*

maincadrat ::= cadrat 
	| text 
	| toggle 


complexsign ::= hieroglyphsOrSymbol [OVERWRITE hieroglyphsOrSymbol]

hieroglyphsOrSymbol ::= hieroglyphs 
	| SYMBOL 

hieroglyphs ::= ligatures 

ligatures ::= hieroglyphs (AMP hieroglyph)*

hieroglyph ::= optGrammar HIEROGLYPH modifiers optWordEnd 

optWordEnd ::= 
	| WORDEND 

optGrammar ::= 
	| GRAMMAR 

modifiers ::= modifier*
modifier ::= MODIFIER 

cartouche ::= BEGINCARTOUCHE cartoucheTexts ENDCARTOUCHE 
	| BEGINOLDCARTOUCHE cartoucheTexts ENDCARTOUCHE 

cartoucheTexts ::= cartoucheText*

cartoucheText ::= topcadrat 
	| text 
	| toggle 


ITEMS : 

topitem= topcadrat 
	| cartouche 
	| toggle 
	| text 
	| lineEnd 
	| pageEnd 
	| textSuper

basicitem ::= topcadrat 
	| text 
| toggle 

"""

import ply.lex as lex

# list of tokens

tokens = (
    "WORDEND",
    "SEPARATOR",
    "HACHING",
    "PAGEEND",
    "LINEEND",
    "TEXTSUPER",
    "TEXT",
    "BEGINPHIL",
    "ENDPHIL",
    "SYMBOL",
    "OVERWRITE",
    "GRAMMAR",
    "HIEROGLYPH",
    "GARDINERFORM",
    "MODIFIER",
    "BEGINCARTOUCHE",
    "ENDCARTOUCHE",
    "BEGINOLDCARTOUCHE",
    "EOF",
    "TEXTSUPER",
    "TOGGLE",
    "LACUNA",
    "COLUMN",
    "STAR",
    "BPAR",
    "EPAR",
    # from lexical utilities symbols for philological markup
    "HALFSPACE",
    "FULLSPACE",
    "REDPOINT",
    "BLACKPOINT",
    "FULLSHADE",
    "VERTICALSHADE",
    "HORIZONTALSHADE",
    "QUATERSHADE",
    "BEGINERASE",
    "ENDERASE",
    "BEGINEDITORADDITION",
    "ENDEDITORADDITION",
    "BEGINMINORADDITION",
    "ENDMINORADDITION",
    "BEGINDUBIOUS",
    "ENDDUBIOUS",
    "BEGINEDITORSUPERFLUOUS",
    "ENDEDITORSUPERFLUOUS",
    "BEGINPREVIOUSLYREADABLE",
    "ENDPREVIOUSLYREADABLE",
    "BEGINSCRIBEADDITION",
    "ENDSCRIBEADDITION",
    "SMALLTEXT",
)
SYMBOL_CODES = {
    "HALFSPACE": ".",
    "FULLSPACE": "..",
    "REDPOINT": "o",
    "BLACKPOINT": "O",
    "FULLSHADE": "//",
    "VERTICALSHADE": "v/",
    "HORIZONTALSHADE": "h/",
    "QUATERSHADE": "/",
    "BEGINERASE": "[[",
    "ENDERASE": "]]",
    "BEGINEDITORADDITION": "[&",
    "ENDEDITORADDITION": "&]",
    "BEGINMINORADDITION": "[(",
    "ENDMINORADDITION": ")]",
    "BEGINDUBIOUS": "[?",
    "ENDDUBIOUS": "?]",
    "BEGINEDITORSUPERFLUOUS": "[{",
    "ENDEDITORSUPERFLUOUS": "}]",
    "BEGINPREVIOUSLYREADABLE": '["',
    "ENDPREVIOUSLYREADABLE": '"]',
    "BEGINSCRIBEADDITION": "['",
    "ENDSCRIBEADDITION": "']",
    "SMALLTEXT": '""',
}

SCRIPT_CODES = {
    # "ALL": "*",
    "HIEROGLYPHICSCRIPT": "+s",
    "LATINSCRIPT": "+l",
    "ITALICSCRIPT": "+i",
    "BOLDSCRIPT": "+b",
    "TRANSLITERATIONSCRIPT": "+t",
    "COPTICSCRIPT": "+c",
    "GREEKSCRIPT": "+g",
    "HEBREWSCRIPT": "+h",
    "CYRILLICSCRIPT": "+c",
    #   "COMMENT": "+",
}
TOGGLE_TYPES = {
    #   "SHADINGTOGGLE": "#",
    "SHADINGON": "#b",
    "SHADINGOFF": "#e",
    "SHADINGRED": "$r",
    "SHADINGBLACK": "$b",
}

SOME_LITERALS = {}
SOME_LITERALS.update(SYMBOL_CODES)
SOME_LITERALS.update(SCRIPT_CODES)
SOME_LITERALS.update(TOGGLE_TYPES)

tokens = tuple(SOME_LITERALS.keys())


class MdcLexer:
    literals = list(SOME_LITERALS.values())

    def __init__(self):
        """
        A lexer for Manuel de Codage tokens

        Internally it uses pyacc
        Following information are stored for tokens that are parsed

        Number of occurence

        """
        ### literal counts ####
        self.HALFSPACE_count = 0
        self.FULLSPACE_count = 0
        self.TOTALSPACE_count = 0
        # points
        self.REDPOINT_count = 0
        self.BLACKPOINT_count = 0
        self.TOTALPOINT_count = 0

        # shades
        self.VERTICALSHADE_count = 0
        self.HORIZONTALSHADE_count = 0
        self.FULLSHADE_count = 0
        self.QUATERSHADE_count = 0
        self.TOTALSHADE_count = 0
        self.SHADINGBLACK_count = 0
        self.SHADINGRED_count = 0
        self.SHADINGON_count = 0
        self.SHADINGOFF_count = 0

        # philological
        self.BEGINERASE_count = 0
        self.ENDERASE_count = 0
        self.TOTALERASE_count = 0

        self.BEGINEDITORADDITION_count = 0
        self.ENDEDITORADDITION_count = 0
        self.TOTALEDITORADDITION_count = 0

        self.BEGINMINORADDITION_count = 0
        self.ENDMINORADDITION_count = 0
        self.TOTALMINORADDITION_count = 0

        self.BEGINDUBIOUS_count = 0
        self.ENDDUBIOUS_count = 0
        self.TOTALDUBIOUS_count = 0

        self.BEGINEDITORSUPERFLUOUS_count = 0
        self.ENDEDITORSUPERFLUOUS_count = 0
        self.TOTALEDITORSUPERFLUOUS_count = 0

        self.BEGINSCRIBEADDITION_count = 0
        self.ENDSCRIBEADDITION_count = 0
        self.TOTALSCRIBEADDITION_count = 0

        self.SMALLTEXT_count = 0

        self.BEGINPREVIOUSLYREADABLE_count = 0
        self.ENDPREVIOUSLYREADABLE_count = 0
        self.TOTALPREVIOUSLYREADABLE_count = 0

        # scripts
        self.HIEROGLYPHICSCRIPT_count = 0
        self.LATINSCRIPT_count = 0
        self.ITALICSCRIPT_count = 0
        self.BOLDSCRIPT_count = 0
        self.TRANSLITERATIONSCRIPT_count = 0
        self.COPTICSCRIPT_count = 0
        self.GREEKSCRIPT_count = 0
        self.HEBREWSCRIPT_count = 0
        self.CYRILLICSCRIPT_count = 0

        ### end literal counts ##
        self.hieroglyph_count = 0
        self.gardiner_form_count = 0
        self.SEPARATOR_count = 0

        # sign related
        self.USERID_count = 0
        self.TOTALSIGNFAMILY_count = 0
        self.SIGNFAMILY_table = {}
        self.SIGNVARIANT_count = 0
        self.AMP_count = 0  # &
        self.LINEEND_count = 0  # !
        self.PAGEEND_count = 0  # !
        self.STAR_count = 0  # *
        self.COLUMN_count = 0  # :
        self.DSTAR_count = 0  # **
        self.BPAR_count = 0  # (
        self.EPAR_count = 0  # (
        self.MIRRORING_count = self.BLACKLASH_count = 0
        self.CLOCKWISE_count = 0
        self.COUNTERCLOCKWISE_count = 0

    #### Implementing Literals ###
    def t_HALFSPACE(self, t):
        r"\."
        t.type = SYMBOL_CODES["HALFSPACE"]
        self.HALFSPACE_count += 1
        self.TOTALSPACE_count += 1
        return t

    def t_FULLSPACE(self, t):
        r"\.\."
        t.type = SYMBOL_CODES["FULLSPACE"]
        self.FULLSPACE_count += 1
        self.total_space_count += 1
        return t

    def t_REDPOINT(self, t):
        r"o"
        t.type = SYMBOL_CODES["REDPOINT"]
        self.REDPOINT_count += 1
        self.TOTALPOINT_count += 1
        return t

    def t_BLACKPOINT(self, t):
        r"O"
        t.type = SYMBOL_CODES["BLACKPOINT"]
        self.BLACKPOINT_count += 1
        self.TOTALPOINT_count += 1
        return t

    def t_VERTICALSHADE(self, t):
        r"v/"
        t.type = SYMBOL_CODES["VERTICALSHADE"]
        self.VERTICALSHADE_count += 1
        self.TOTALSHADE_count += 1
        return t

    def t_HORIZONTALSHADE(self, t):
        r"h/"
        t.type = SYMBOL_CODES["HORIZONTALSHADE"]
        self.HORIZONTALSHADE_count += 1
        self.TOTALSHADE_count += 1
        return t

    def t_BEGINERASE(self, t):
        r"\[\["
        t.type = SYMBOL_CODES["BEGINERASE"]
        self.BEGINERASE_count += 1
        self.TOTALERASE_count += 1
        return t

    def t_ENDERASE(self, t):
        r"\[\["
        t.type = SYMBOL_CODES["ENDERASE"]
        self.ENDERASE_count += 1
        self.TOTALERASE_count += 1
        return t

    def t_BEGINEDITORADDITION(self, t):
        r"[&"
        t.type = SYMBOL_CODES["BEGINEDITORADDITION"]
        self.BEGINEDITORADDITION_count += 1
        self.TOTALEDITORADDITION_count += 1
        return t

    def t_ENDEDITORADDITION(self, t):
        r"&]"
        t.type = SYMBOL_CODES["ENDEDITORADDITION"]
        self.ENDEDITORADDITION_count += 1
        self.TOTALEDITORADDITION_count += 1
        return t

    def t_BEGINMINORADDITION(self, t):
        r"[("
        t.type = SYMBOL_CODES["BEGINMINORADDITION"]
        self.BEGINMINORADDITION_count += 1
        self.TOTALMINORADDITION_count += 1
        return t

    def t_ENDMINORADDITION(self, t):
        r")]"
        t.type = SYMBOL_CODES["ENDMINORADDITION"]
        self.ENDMINORADDITION_count += 1
        self.TOTALMINORADDITION_count += 1
        return t

    def t_BEGINDUBIOUS(self, t):
        r"[?"
        t.type = SYMBOL_CODES["BEGINDUBIOUS"]
        self.BEGINDUBIOUS_count += 1
        self.TOTALDUBIOUS_count += 1
        return t

    def t_ENDDUBIOUS(self, t):
        r"?]"
        t.type = SYMBOL_CODES["ENDDUBIOUS"]
        self.ENDDUBIOUS_count += 1
        self.TOTALDUBIOUS_count += 1
        return t

    def t_BEGINEDITORSUPERFLUOUS(self, t):
        r"[{"
        t.type = SYMBOL_CODES["BEGINEDITORSUPERFLUOUS"]
        self.BEGINEDITORSUPERFLUOUS_count += 1
        self.TOTALEDITORSUPERFLUOUS_count += 1
        return t

    def t_ENDEDITORSUPERFLUOUS(self, t):
        r"}]"
        t.type = SYMBOL_CODES["ENDEDITORSUPERFLUOUS"]
        self.ENDEDITORSUPERFLUOUS_count += 1
        self.TOTALEDITORSUPERFLUOUS_count += 1
        return t

    def t_BEGINSCRIBEADDITION(self, t):
        r"['"
        t.type = SYMBOL_CODES["BEGINSCRIBEADDITION"]
        self.BEGINSCRIBEADDITION_count += 1
        self.TOTALSCRIBEADDITION_count += 1
        return t

    def t_ENDSCRIBEADDITION(self, t):
        r"']"
        t.type = SYMBOL_CODES["ENDSCRIBEADDITION"]
        self.ENDSCRIBEADDITION_count += 1
        self.TOTALSCRIBEADDITION_count += 1
        return t

    def t_SMALLTEXT(self, t):
        r'""'
        t.type = SYMBOL_CODES["SMALLTEXT"]
        self.SMALLTEXT_count += 1
        return t

    def t_BEGINPREVIOUSLYREADABLE(self, t):
        r'["'
        t.type = SYMBOL_CODES["BEGINPREVIOUSLYREADABLE"]
        self.BEGINPREVIOUSLYREADABLE_count += 1
        self.TOTALPREVIOUSLYREADABLE_count += 1
        return t

    def t_ENDPREVIOUSLYREADABLE(self, t):
        r'"]'
        t.type = SYMBOL_CODES["ENDPREVIOUSLYREADABLE"]
        self.ENDPREVIOUSLYREADABLE_count += 1
        self.TOTALPREVIOUSLYREADABLE_count += 1
        return t

    def t_HIEROGLYPHICSCRIPT(self, t):
        r"+s"
        t.type = SCRIPT_CODES["HIEROGLYPHICSCRIPT"]
        self.HIEROGLYPHICSCRIPT_count += 1
        return t

    def t_LATINSCRIPT(self, t):
        r"+l"
        t.type = SCRIPT_CODES["LATINSCRIPT"]
        self.LATINSCRIPT_count += 1
        return t

    def t_ITALICSCRIPT(self, t):
        r"+i"
        t.type = SCRIPT_CODES["ITALICSCRIPT"]
        self.ITALICSCRIPT_count += 1
        return t

    def t_BOLDSCRIPT(self, t):
        r"+b"
        t.type = SCRIPT_CODES["BOLDSCRIPT"]
        self.BOLDSCRIPT_count += 1
        return t

    def t_TRANSLITERATIONSCRIPT(self, t):
        r"+t"
        t.type = SCRIPT_CODES["TRANSLITERATIONSCRIPT"]
        self.TRANSLITERATIONSCRIPT_count += 1
        return t

    def t_COPTICSCRIPT(self, t):
        r"+c"
        t.type = SCRIPT_CODES["COPTICSCRIPT"]
        self.COPTICSCRIPT_count += 1
        return t

    def t_GREEKSCRIPT(self, t):
        r"+g"
        t.type = SCRIPT_CODES["GREEKSCRIPT"]
        self.GREEKSCRIPT_count += 1
        return t

    def t_HEBREWSCRIPT(self, t):
        r"+h"
        t.type = SCRIPT_CODES["HEBREWSCRIPT"]
        self.HEBREWSCRIPT_count += 1
        return t

    def t_CYRILLICSCRIPT(self, t):
        r"+c"
        t.type = SCRIPT_CODES["CYRILLICSCRIPT"]
        self.CYRILLICSCRIPT_count += 1
        return t

    def t_SHADINGON(self, t):
        r"#b"
        t.type = TOGGLE_TYPES["SHADINGON"]
        self.SHADINGON_count += 1
        self.TOTALSHADE_count += 1
        return t

    def t_SHADINGOFF(self, t):
        r"#e"
        t.type = TOGGLE_TYPES["SHADINGOFF"]
        self.SHADINGOFF_count += 1
        self.TOTALSHADE_count += 1
        return t

    def t_SHADINGRED(self, t):
        r"$r"
        t.type = TOGGLE_TYPES["SHADINGRED"]
        self.SHADINGRED_count += 1
        self.TOTALSHADE_count += 1
        return t

    def t_SHADINGBLACK(self, t):
        r"$b"
        t.type = TOGGLE_TYPES["SHADINGBLACK"]
        self.SHADINGBLACK_count += 1
        self.TOTALSHADE_count += 1
        return t

    def t_QUATERSHADE(self, t):
        r"/\d+"
        self.QUATERSHADE_count += 1
        self.TOTALSHADE_count += 1
        return t

    def t_USERID(self, t):
        r"(US([0-9]+))"
        self.USERID_count += 1
        return t

    def t_SIGNFAMILY(self, t):
        r"([A-Z]|Aa|Ff|NL|NU)"
        self.TOTALSIGNFAMILY_count += 1
        if self.SIGNFAMILY_table.get(t.value) is None:
            self.SIGNFAMILY_table[t.value] = 0
        self.SIGNFAMILY_table[t.value] += 1
        return t

    def t_SIGNVARIANT(self, t):
        r"([A-Za-z]*)"
        self.SIGNVARIANT_count += 1
        return t

    def t_GARDINERFORM(self, t):
        # regex taken from
        # https://github.com/rosmord/jsesh/blob/master/jsesh/src/main/java/jsesh/hieroglyphs/GardinerCode.java
        # commit no:  2cc38d1 on 20 Jul 2019
        r"(US([0-9]+))?([A-Z]|Aa|Ff|NL|NU)([0-9]+)([A-Za-z]*)"
        self.gardiner_form_count += 1
        return t

    def t_AMP(self, t):
        r"&"
        self.AMP_count += 1
        return t

    def t_LINEEND(self, t):
        r"!"
        self.LINEEND_count += 1
        return t

    def t_PAGEEND(self, t):
        r"!"
        self.PAGEEND_count += 1
        return t

    def t_COLUMN(self, t):
        r":"
        self.COLUMN_count += 1
        return t

    def t_STAR(self, t):
        r"\*"
        self.STAR_count += 1
        return t

    def t_DSTAR(self, t):
        r"\*\*"
        self.DSTAR_count += 1
        return t

    def t_BPAR(self, t):
        r"\("
        self.BPAR_count += 1
        return t

    def t_EPAR(self, t):
        r"\)"
        self.EPAR_count += 1
        return t

    def t_SEPARATOR(self, t):
        r"-"
        self.SEPARATOR_count += 1
        return t

    def t_BLACKLASH(self, t):
        r"\\"
        self.BLACKLASH_count += 1
        return t

    def t_CLOCKWISE(self, t):
        r"\\t[1-3]"
        self.CLOCKWISE_count += 1
        return t

    def t_COUNTERCLOCKWISE(self, t):
        r"\\r[1-3]"
        self.COUNTERCLOCKWISE_count += 1
        return t

    def t_error(self, t) -> None:
        print("Illegal character '%s'" % t.value[0])
        t.lexer.skip(1)

    def build(self, **kwargs):
        self.lexer = lex.lex(object=self, **kwargs)
