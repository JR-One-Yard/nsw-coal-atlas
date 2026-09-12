import unittest
from bore_quality import depth_quality,select_bores
class QualityTests(unittest.TestCase):
 def test_selection_rejects_suspect_before_thinning_and_retains_evidence(self):
  def feature(id,depth):return dict(properties=dict(gsnsw_drill_id=id,end_depth=depth,hole_name=id),geometry=dict(coordinates=[150.7,-34.2]))
  selected=select_bores([feature('COAL_004298',9999),feature('valid',800),feature('missing',None)])
  self.assertEqual({f['properties']['gsnsw_drill_id'] for f in selected},{'valid','COAL_004298'})
 def test_no_global_depth_cap(self):
  self.assertTrue(depth_quality(3059)['eligible'])
  for d in [None,0,-1,float('nan'),9999]:self.assertFalse(depth_quality(d)['eligible'])
if __name__=='__main__':unittest.main()
