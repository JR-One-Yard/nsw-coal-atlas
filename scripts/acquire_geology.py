"""Acquire bounded GSNSW surface geology and higher-resolution Illawarra terrain.

Downloaded mapping is retained separately from illustrative subsurface geometry.
Run with Python + Pillow. Existing source snapshots are reused, never overwritten.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlencode
from urllib.request import urlopen, Request
import hashlib
import json
import math
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'cache/geology'
DATA = ROOT / 'dist/data'
CACHE.mkdir(parents=True, exist_ok=True)
BOUNDS = [150.55, -34.56, 151.12, -34.02]
BASE = 'https://gs-seamless.geoscience.nsw.gov.au/geoserver/ows?'
receipts = []

def fetch(url, path):
    if not path.exists():
        with urlopen(Request(url, headers={'User-Agent': 'NSWCoalAtlas/2.0'}), timeout=90) as response:
            body = response.read()
        path.write_bytes(body)
    body = path.read_bytes()
    receipts.append(dict(url=url, file=str(path.relative_to(ROOT)), bytes=len(body), sha256=hashlib.sha256(body).hexdigest()))
    return body

def features(layer, name):
    all_features = []
    offset = 0
    while True:
        params = dict(service='WFS', version='2.0.0', request='GetFeature', typeNames=layer,
                      outputFormat='application/json', srsName='EPSG:4326', count=1000, startIndex=offset,
                      bbox=','.join(map(str, BOUNDS))+',urn:ogc:def:crs:OGC:1.3:CRS84')
        page = json.loads(fetch(BASE+urlencode(params), CACHE/f'{name}-{offset}.geojson'))
        batch = page['features']
        all_features.extend(batch)
        offset += len(batch)
        total = page.get('numberMatched')
        if not batch or (isinstance(total, int) and offset >= total):
            break
    assert len({f['id'] for f in all_features}) == len(all_features), 'Duplicate WFS page records'
    return all_features

rocks = features('geology:rock_units_nsw', 'surface')
faults = features('geology:faults_nsw', 'faults')
print('Acquired', len(rocks), 'rock polygons and', len(faults), 'fault segments', flush=True)

# A local raster made directly from source polygons, with an integer feature lookup.
# Hole masks preserve the underlying geology, and RGB colours are the source colours.
width = height = 1600
w, s, e, n = BOUNDS
def pixel(point):
    return ((point[0]-w)/(e-w)*width, (n-point[1])/(n-s)*height)

texture = Image.new('RGBA', (width, height), (0, 0, 0, 0))
lookup = Image.new('I', (width, height), 0)
units = []
for index, feature in enumerate(rocks, 1):
    props = feature['properties']
    polygons = feature['geometry']['coordinates']
    if feature['geometry']['type'] == 'Polygon': polygons = [polygons]
    mask = Image.new('L', (width, height), 0)
    draw = ImageDraw.Draw(mask)
    for polygon in polygons:
        draw.polygon([pixel(p) for p in polygon[0]], fill=255)
        for hole in polygon[1:]: draw.polygon([pixel(p) for p in hole], fill=0)
    texture.paste(props.get('colour_rgb') or '#9da8c7', (0, 0, width, height), mask)
    lookup.paste(index, (0, 0, width, height), mask)
    units.append(dict(id=feature['id'], **props))
texture.save(DATA/'illawarra-surface.png')
# Packed little-endian uint16 for fast offline pointer/section lookups.
import struct
(DATA/'illawarra-surface-index.bin').write_bytes(struct.pack('<'+'H'*(width*height), *lookup.getdata()))

z = 11
def tile(lon, lat):
    return (lon+180)/360*2**z, (1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*2**z
xa, ya = tile(w, n); xb, yb = tile(e, s)
def terrain_tile(xy):
    x, y = xy
    path = CACHE/f'terrain-{z}-{x}-{y}.png'
    fetch(f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png', path)
    return xy, Image.open(path).convert('RGB')
with ThreadPoolExecutor(max_workers=4) as pool:
    tiles = dict(pool.map(terrain_tile, [(x, y) for x in range(int(xa), int(xb)+1) for y in range(int(ya), int(yb)+1)]))
nx = ny = 257
elevations = []
for j in range(ny):
    for i in range(nx):
        lon, lat = w+(e-w)*i/(nx-1), n-(n-s)*j/(ny-1)
        x, y = tile(lon, lat)
        r, g, b = tiles[int(x), int(y)].getpixel((int(x%1*256), int(y%1*256)))
        elevations.append(round(r*256+g+b/256-32768, 1))
(DATA/'illawarra-terrain.json').write_text(json.dumps(dict(bounds=BOUNDS, nx=nx, ny=ny, elevations=elevations,
    source='Mapzen / Tilezen Terrarium z11; regional elevation, not a site survey'), separators=(',', ':')))
(DATA/'surface-geology.json').write_text(json.dumps(dict(bounds=BOUNDS, width=width, height=height, units=units,
    faults=faults, date='2026-09-11', source='GSNSW NSW Seamless Geology',
    sourceUrl='https://www.resources.nsw.gov.au/geological-survey/projects/nsw-seamless-geology-project',
    license='CC BY 4.0 — Geological Survey of New South Wales',
    note='Published geological mapping includes interpretation. Fault traces do not establish underground dip or throw.'), separators=(',', ':')))
(ROOT/'evidence/geology-downloads.json').write_text(json.dumps(sorted(receipts, key=lambda r:r['file']), indent=2))
print('Built surface texture, feature lookup and', nx*ny, 'local elevation samples', flush=True)
