# author: Kaan Eraslan

import unittest
from selenium import webdriver
import os

current_path = os.getcwd()
tests_path = current_path + os.sep + os.pardir
pysesh_main_path = tests_path + os.sep + os.pardir
pysesh_path = pysesh_main_path + os.sep + "pysesh"
core_path = pysesh_path + os.sep + "core"
modules_path = core_path + os.sep + "modules"
preprocess_path = modules_path + os.sep + "preprocessing"
interface_path = preprocess_path + os.sep + "interface.html"

driver = webdriver.Firefox()
