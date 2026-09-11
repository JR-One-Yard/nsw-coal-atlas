"""Offline regression tests for reviewed DEM artefacts and fail-closed acquisition."""
import copy
import json
import unittest
from datetime import datetime, timezone
from terrain_quality import ROOT, LEDGER, corrected_terrain, isolated_extremes


class TerrainQualityTests(unittest.TestCase):
    def setUp(self):
        self.terrain = json.loads((ROOT / 'dist/data/terrain.json').read_text())
        self.ledger = json.loads(LEDGER.read_text())
        self.raw = copy.deepcopy(self.terrain)
        for c in self.ledger['corrections']:
            self.raw['elevations'][c['row'] * self.raw['nx'] + c['column']] = c['originalMetres']

    def test_known_source_spike_and_pit_are_detected(self):
        self.assertEqual({(p['column'], p['row']) for p in isolated_extremes(self.raw)}, {(93, 200), (89, 140)})

    def test_only_reviewed_samples_change_and_inputs_are_preserved(self):
        original = copy.deepcopy(self.raw)
        corrected = corrected_terrain(self.raw)
        changed = {i for i, (a, b) in enumerate(zip(self.raw['elevations'], corrected['elevations'])) if a != b}
        self.assertEqual(changed, {200 * 193 + 93, 140 * 193 + 89})
        self.assertEqual(self.raw, original)
        self.assertEqual(corrected, self.terrain)

    def test_yarra_bay_is_zero_and_references_retained(self):
        c = next(c for c in self.ledger['corrections'] if c['id'] == 'yarra-bay-water-surface')
        self.assertEqual(c['originalMetres'], 826)
        self.assertEqual(c['replacementMetres'], 0)
        self.assertEqual(float(c['response']['results'][0]['attributes']['Stretch.Pixel Value']), 0)
        self.assertTrue(c['url'].startswith('https://services.ga.gov.au/'))
        self.assertEqual(self.terrain['elevations'][200 * 193 + 93], 0)

    def test_reapplication_is_idempotent(self):
        self.assertEqual(corrected_terrain(self.terrain), self.terrain)

    def test_changed_source_and_shifted_grid_require_new_review(self):
        self.raw['elevations'][200 * 193 + 93] = 827
        with self.assertRaisesRegex(ValueError, 'Source elevation changed'):
            corrected_terrain(self.raw)
        shifted = copy.deepcopy(self.terrain)
        shifted['bounds'][0] += .01
        with self.assertRaisesRegex(ValueError, 'does not match'):
            corrected_terrain(shifted)

    def test_new_positive_or_negative_extreme_blocks_acquisition(self):
        for height in [9000, -9000]:
            suspect = copy.deepcopy(self.terrain)
            suspect['elevations'][100 * 193 + 100] = height
            with self.assertRaisesRegex(ValueError, 'Unreviewed isolated'):
                corrected_terrain(suspect)

    def test_real_relief_and_remaining_bathymetry_are_not_smoothed(self):
        self.assertEqual(self.terrain['elevations'][192 * 193 + 14], 592)
        self.assertTrue(any(h < 0 for h in self.terrain['elevations']))
        self.assertEqual(isolated_extremes(self.terrain), [])
        local = json.loads((ROOT / 'dist/data/illawarra-terrain.json').read_text())
        self.assertEqual(isolated_extremes(local), [])

    def test_malformed_elevation_grid_is_rejected(self):
        for bad in [self.terrain['elevations'][:-1], [float('nan')] * (193 * 289)]:
            with self.assertRaisesRegex(ValueError, 'complete finite'):
                isolated_extremes({**self.terrain, 'elevations': bad})


if __name__ == '__main__':
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(TerrainQualityTests)
    names = [test.id().split('.')[-1] for test in suite]
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    failed = {test.id().split('.')[-1] for test, _ in result.failures + result.errors}
    (ROOT / 'evidence/terrain-tests.json').write_text(json.dumps({
        'date': datetime.now(timezone.utc).isoformat(),
        'checks': [{'name': name, 'passed': name not in failed} for name in names]
    }, indent=2) + '\n')
    raise SystemExit(0 if result.wasSuccessful() else 1)
