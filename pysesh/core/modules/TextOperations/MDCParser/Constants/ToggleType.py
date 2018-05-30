##################################
# constants taken from the jsesh
# ################################
# original author: Serge Rosmorduc
# python author: Kaan Eraslan
# license: GPL-3, see LICENSE
# No Warranty
#
# Note: Explanations in the docstrings are for the most part taken
# from java source files
###################################

class ToggleType(object):
    "Toggle Type as enum class"
    type_list = [
        ("SHADINGTOGGLE", "#")
	    ("SHADINGON", "#b")
	    ("SHADINGOFF", "#e")
	    ("RED", "$r")
	    ("BLACK", "$b")
	    ("LACUNA", "?")
	    ("LINELACUNA", "??")
	    ("OMMIT", "^")
	    ("BLACKRED", "$")
    ]
    type_dict = {name[0]:name[1] for name in type_list}
    type_mdc_dict = {name[1]:name[0] for name in type_list}
    type_name_id_dict = {name[0]:i for i, name in enumerate(type_list)}
    #
    def __init__(self,
                 toggle_id: int,
                 toggle_name: str,
                 toggle_mdc: str) -> None:
        "Constructor"
        assert((toggle_id > len(ToggleType.type_list)),
               "Entered toggle id does not correspond to any toggle type"\
               "Allowed toggle ids: " + str(len(ToggleType.type_list)) + " You have"\
               " entered: " + str(toggle_id)
        )
        self.mdc_str = toggle_mdc
        self.toggle_type = toggle_id
        self.toogle_name = toggle_name
        #
        return None
    #
    def getMDC(self) -> str:
        "Get mdc string for the initiated toggle"
        return self.mdc_str
    #
    def getToggleType(self) -> int:
        "Get the id no of the toggle type"
        return self.toggle_type
    #
    def getToggleName(self) -> str:
        "Get toggle name"
        return self.toggle_name
    #
    def getToggleNameById(self, id_no: int) -> str:
        "Get Toggle type by id number"
        assert((id_no > len(ToggleType.type_list)),
               "Entered toggle id does not correspond to any toggle type"\
               "Allowed toggle ids: " + str(len(ToggleType.type_list)) + " You have"\
               " entered: " + str(id_no))
        return ToggleType.type_list[id_no][0]
    #
    def getToggleIdByName(self, name_str: str) -> int:
        "Get toggle id no by name"
        return ToggleType.type_name_id_dict.get(name_str)
    #
    def getToggleMDCByName(self, name_str: str) -> str:
        "Get toggle mdc string with name"
        return ToggleType.type_dict.get(name_str)
    #
    def getToggleNameByMDC(self, mdc_str: str) -> str:
        "Get toggle name with mdc string"
        return ToggleType.type_mdc_dict.get(mdc_str)


