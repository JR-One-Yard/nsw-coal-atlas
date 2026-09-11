"""Download public datasets and pinned Three.js. No API keys required."""
from pathlib import Path
import urllib.request, json, math, concurrent.futures, hashlib
from PIL import Image
from terrain_quality import corrected_terrain
ROOT=Path(__file__).resolve().parents[1]
D=ROOT/'dist/data'; V=ROOT/'dist/vendor'; C=ROOT/'cache'
C.mkdir(exist_ok=True)
receipts=[]
def get(url,path):
    if not path.exists():
        req=urllib.request.Request(url,headers={'User-Agent':'NSWCoalAtlas/1.0 educational visualization'})
        with urllib.request.urlopen(req,timeout=90) as r: body=r.read()
        path.write_bytes(body)
    receipts.append({'url':url,'file':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size})
    return path
jobs=[
 ('https://unpkg.com/three@0.180.0/build/three.module.js',V/'three.module.js'),
 ('https://unpkg.com/three@0.180.0/build/three.core.js',V/'three.core.js'),
 ('https://unpkg.com/three@0.180.0/examples/jsm/controls/OrbitControls.js',V/'OrbitControls.js'),
 ('https://unpkg.com/three@0.180.0/LICENSE',V/'THREE-LICENSE.txt'),
 ('https://public-gs.geoscience.nsw.gov.au/geoserver/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=mineral-occurrence:mineral_occurrence_operating_mines&outputFormat=application/json&srsName=EPSG:4326',D/'nsw-operating-mines.geojson'),
 ('https://public-gs.geoscience.nsw.gov.au/geoserver/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=drilling:drilling_drillholes_coal&outputFormat=application/json&count=20000&srsName=EPSG:4326&propertyName=geom,hole_name,gsnsw_drill_id,end_depth,year_drilled,program',C/'coal-bores-all.geojson')]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
    for result in ex.map(lambda j:get(*j),jobs): print(result.name,flush=True)
bores=json.loads((C/'coal-bores-all.geojson').read_text())
bores['features']=[f for f in bores['features'] if 150.45<=f['geometry']['coordinates'][0]<=152.05 and -34.65<=f['geometry']['coordinates'][1]<=-32.45]
bores['numberReturned']=len(bores['features'])
(C/'coal-bores.geojson').write_text(json.dumps(bores))
# Terrarium source grid (~250m at zoom 9) resampled to a 0.5–1km regional mesh.
z=9; west,east,south,north=150.45,152.05,-34.65,-32.45
def tile(lon,lat):
    return (lon+180)/360*2**z,(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*2**z
xa,ya=tile(west,north); xb,yb=tile(east,south)
tiles={}
def fetch_tile(xy):
    x,y=xy;p=get(f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',C/f'terrain-{z}-{x}-{y}.png')
    return xy,Image.open(p).convert('RGB')
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
    for xy,im in ex.map(fetch_tile,[(x,y) for x in range(int(xa),int(xb)+1) for y in range(int(ya),int(yb)+1)]):tiles[xy]=im
nx,ny=193,289; heights=[]
for j in range(ny):
    lat=north-(north-south)*j/(ny-1)
    for i in range(nx):
        lon=west+(east-west)*i/(nx-1);x,y=tile(lon,lat)
        r,g,b=tiles[int(x),int(y)].getpixel((int(x%1*256),int(y%1*256)))
        heights.append(round(r*256+g+b/256-32768,1))
terrain = corrected_terrain({'bounds':[west,south,east,north],'nx':nx,'ny':ny,'elevations':heights,'source':'Mapzen / Tilezen terrain tiles on AWS; Terrarium z9'})
(D/'terrain.json').write_text(json.dumps(terrain,separators=(',',':')))
(ROOT/'evidence/downloads.json').write_text(json.dumps(receipts,indent=2))
print('Terrain complete:',len(heights),'samples',min(heights),max(heights),flush=True)
