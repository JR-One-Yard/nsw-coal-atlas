"""Aligned regional extension of reviewed terrain; no smoothing or synthetic fill.

Reuses the original corridor grid exactly, including its correction ledger.
Illawarra's finer tile is retained by the viewer. Terrarium tiles encode metres,
not a coloured DEM export. Source tiles and hashes are retained for rebuilding.
"""
from pathlib import Path
import json, math, urllib.request, hashlib, concurrent.futures
from PIL import Image
from terrain_quality import isolated_extremes
R=Path(__file__).resolve().parents[1];D=R/'dist/data';C=R/'cache'
old=json.loads((D/'terrain.json').read_text())
w,s,e,n=149.65,-34.65,152.05,-30.25
nx,ny=289,577;z=9

def tile(lon,lat):
    return (lon+180)/360*2**z,(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*2**z

def fetch(xy):
    x,y=xy;url=f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';p=C/f'terrain-{z}-{x}-{y}.png'
    if not p.exists():
        with urllib.request.urlopen(url,timeout=60) as r:p.write_bytes(r.read())
    return xy,Image.open(p).convert('RGB'),dict(url=url,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),file=str(p.relative_to(R)))
xa,ya=tile(w,n);xb,yb=tile(e,s)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
    results=list(ex.map(fetch,[(x,y) for x in range(int(xa),int(xb)+1) for y in range(int(ya),int(yb)+1)]))
tiles={xy:im for xy,im,_ in results};heights=[]
for j in range(ny):
    for i in range(nx):
        if i>=96 and j>=288:
            heights.append(old['elevations'][(j-288)*old['nx']+i-96]);continue
        x,y=tile(w+(e-w)*i/(nx-1),n-(n-s)*j/(ny-1));r,g,b=tiles[int(x),int(y)].getpixel((min(255,int(x%1*256)),min(255,int(y%1*256))))
        heights.append(round(r*256+g+b/256-32768,1))
t=dict(bounds=[w,s,e,n],nx=nx,ny=ny,elevations=heights,source=old['source'],attribution=old['attribution'],horizontalDatum='WGS84 geographic grid; source tiles Web Mercator',verticalDatum='Source DEM elevations in metres; mixed source vertical references, not survey-grade AHD.',note='Aligned regional extension, about 0.8 km grid. Original corridor samples retained exactly; Illawarra has a finer display tile. Negative elevations retained in data and clamped to water surface in display. No mine-scale surface survey is implied.',preservedCorridor=dict(file='terrain.json',columnOffset=96,rowOffset=288,correctionLedger='terrain-corrections.json'),acquiredAt='2026-09-13')
suspects=isolated_extremes(t)
if suspects:raise ValueError('Review new extremes before use: '+json.dumps(suspects))
(D/'terrain-wide.json').write_text(json.dumps(t,separators=(',',':')))
(R/'evidence/terrain-extension-downloads.json').write_text(json.dumps(dict(tiles=[r[2] for r in results],bounds=t['bounds'],rangeMetres=[min(heights),max(heights)],isolatedExtremes=suspects),indent=2)+'\n')
print('Expanded terrain:',len(heights),'samples;',len(tiles),'tiles;',min(heights),max(heights))
