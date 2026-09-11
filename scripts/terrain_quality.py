"""Review isolated terrain extremes; apply only explicitly sourced corrections.

This is not a smoothing filter. A new extreme stops acquisition for review.
The correction ledger preserves source values and the independent response.
"""
import copy
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEDGER = ROOT / 'dist/data/terrain-corrections.json'


def isolated_extremes(terrain, threshold=500):
    """Flag interior samples >500 m beyond all four immediate neighbours.

    Deliberately conservative screening, not a complete DEM accuracy test.
    Real steep relief is reported for review, never automatically flattened.
    """
    nx, ny = terrain['nx'], terrain['ny']
    heights = terrain['elevations']
    if nx < 3 or ny < 3 or len(heights) != nx * ny or not all(math.isfinite(h) for h in heights):
        raise ValueError('Terrain grid must contain complete finite elevations')
    found = []
    for row in range(1, ny - 1):
        for column in range(1, nx - 1):
            k = row * nx + column
            neighbours = [heights[k-1], heights[k+1], heights[k-nx], heights[k+nx]]
            if heights[k] > max(neighbours) + threshold or heights[k] < min(neighbours) - threshold:
                found.append({'column': column, 'row': row, 'metres': heights[k]})
    return found


def corrected_terrain(terrain, ledger=None):
    ledger = ledger if ledger is not None else json.loads(LEDGER.read_text())
    if any(terrain[k] != ledger['grid'][k] for k in ['bounds', 'nx', 'ny']):
        raise ValueError('Correction ledger does not match this terrain grid')
    result = copy.deepcopy(terrain)
    isolated_extremes(result)  # Validate shape and finite values before indexing.
    for correction in ledger['corrections']:
        k = correction['row'] * result['nx'] + correction['column']
        if result['elevations'][k] not in (correction['originalMetres'], correction['replacementMetres']):
            raise ValueError('Source elevation changed: re-review ' + correction['id'])
        result['elevations'][k] = correction['replacementMetres']
    suspects = isolated_extremes(result)
    if suspects:
        raise ValueError('Unreviewed isolated terrain extremes: ' + json.dumps(suspects))
    result['correctionLedger'] = 'terrain-corrections.json'
    result['note'] = ('Regional resampling; elevation metres. Not survey-grade. Heights below sea level retained except '
                      'two reviewed isolated source artefacts replaced by GA DEM zero-valued water-surface samples. '
                      'These replacements do not measure seabed depth. See terrain-corrections.json. '
                      'Conservative isolated-extreme screening is not comprehensive elevation validation.')
    result['attribution'] = ('Mapzen terrain tiles: © Mapzen, SRTM and other sources; https://www.mapzen.com/rights/. '
                             'Two reviewed replacements: © Commonwealth of Australia (Geoscience Australia) 2024, '
                             'DEM SRTM 1 Second, CC BY 4.0; https://pid.geoscience.gov.au/dataset/ga/72759.')
    return result


if __name__ == '__main__':
    path = ROOT / 'dist/data/terrain.json'
    terrain = json.loads(path.read_text())
    result = corrected_terrain(terrain)
    path.write_text(json.dumps(result, separators=(',', ':')))
    print('Applied reviewed terrain corrections; no unreviewed >500 m isolated extremes remain.')
