"""

Test transliteration functions
Examiner les fonctionnes de translitération
Harf çevirisi işlemlerini test et

"""

__author__ = "Doğu Kaan Eraslan, <kaaneraslan@gmail.com>"
__license__ = "GPL-3.0 License. See LICENSE"


# Paketler / Les Paquets / Packages -----------------------------------

from pysesh.transliteration.mdc_text_unicode import mdc_unicode

import unittest

# -------------------------------------------------------

class TestSequenceFunctions(unittest.TestCase):  # pylint: disable=R0904
  """
  Class for unittest module
  Class pour unittest module
  Unittest kitaplığı için class

  """
  def test_latin_transliteration_mdc_unicode_q_kopf_True(self):
      """
      test to transliterate mdc to unicode
      for ancient egyptian texts.
      q_kopf option True
      """
      #
      mdc_string = """ink Smsw Sms nb=f bAk n ipt nswt
      irt pat wrt <Hswt> Hmt [nswt] snwsrt m Xnm-swt
      sAt nswt imn-m-HAt m
      qA-nfrw nfrw nbt imAx"""
      #
      test_result_string = mdc_unicode(mdc_string)
      #
      comparison_string ="""i҆nk šmsw šms nb⸗f bꜣk n i҆pt nswt
      i҆rt pꜥt wrt 〈ḥswt〉 ḥmt [nswt] snwsrt m ẖnm-swt
      sꜣt nswt i҆mn-m-ḥꜣt m
      qꜣ-nfrw nfrw nbt i҆mꜣḫ"""
      #
      self.assertEqual(test_result_string, comparison_string)

  
  def test_latin_transliteration_mdc_unicode_q_kopf_False(self):
      """
      test to transliterate mdc to unicode
      for ancient egyptian texts.
      q_kopf option False
      """
      #
      mdc_string = """ink Smsw Sms nb=f bAk n ipt nswt
      irt pat wrt <Hswt> Hmt [nswt] snwsrt m Xnm-swt
      sAt nswt imn-m-HAt m
      qA-nfrw nfrw nbt imAx"""
      #
      test_result_string = mdc_unicode(mdc_string, q_kopf=False)
      #
      comparison_string ="""i҆nk šmsw šms nb⸗f bꜣk n i҆pt nswt
      i҆rt pꜥt wrt 〈ḥswt〉 ḥmt [nswt] snwsrt m ẖnm-swt
      sꜣt nswt i҆mn-m-ḥꜣt m
      ḳꜣ-nfrw nfrw nbt i҆mꜣḫ"""
      #
      self.assertEqual(test_result_string, comparison_string)

