"""Extract the atlas window from GA ABSUC v2; preserve preferred picks and datums.
No surface fitting, depth reinterpretation or top/base pairing across source records.
Uses standard Python only. National archive (~744 MB) is cached, not shipped.
"""
import csv,io,json,zipfile,urllib.request,hashlib,datetime
from pathlib import Path
R=Path(__file__).resolve().parents[1];CACHE=R/'cache/absuc';CACHE.mkdir(parents=True,exist_ok=True)
URL='https://d28rz98at9flks.cloudfront.net/149324/149324_01_0.zip'
META='https://d28rz98at9flks.cloudfront.net/149324/149324_00_1.pdf'
archive=CACHE/'149324_01_0.zip'
if not archive.exists():
 with urllib.request.urlopen(URL,timeout=60) as source,(CACHE/'download.partial').open('wb') as target:
  while chunk:=source.read(8*1024*1024):target.write(chunk)
 (CACHE/'download.partial').rename(archive)
bounds=[150.45,-34.65,152.05,-32.45]
def num(r,key):
 try:return float(r[key]) if r[key] else None
 except (ValueError,KeyError):return None
def regional(rows):
 for r in rows:
  lon,lat=num(r,'GDA94_LONGITUDE'),num(r,'GDA94_LATITUDE')
  if lon is not None and lat is not None and bounds[0]<=lon<=bounds[2] and bounds[1]<=lat<=bounds[3]:yield r
with zipfile.ZipFile(archive) as z:
 def read(name):return list(regional(csv.DictReader(io.TextIOWrapper(z.open('Data Package/'+name),encoding='utf-8-sig'))))
 collars=read('ABSUC_BOREHOLE_v2.txt');tops=read('ABSUC_TOP_v2.txt');bases=read('ABSUC_BASE_v2.txt')
records={}
for kind,rows in [('top',tops),('base',bases)]:
 for r in rows:
  key=r['GA_GUID'];record=records.setdefault(key,dict(r,preferredTop=False,preferredBase=False))
  record['preferred'+kind.title()]=True
bores={r['GA_BOREHOLE_GUID']:{'id':r['GA_BOREHOLE_GUID'],'name':r['GA_BOREHOLE_NAME'] or r['CUSTODIAN_BOREHOLE_NAME'],'uwi':r['UWI'],'stateId':r['STATE_ID'],'lon':num(r,'GDA94_LONGITUDE'),'lat':num(r,'GDA94_LATITUDE'),'groundAHD':num(r,'GL_AHD_M'),'srtmAHD':num(r,'SRTM_HE_AHD_M'),'datumAHD':num(r,'DATUM_ELEVATION_AHD_M'),'datumName':r['DATUM_NAME'],'totalMD':num(r,'TD_MD_M'),'source':r['DATA_SOURCE'],'comment':r['COMMENT'],'picks':[]} for r in collars}
for r in records.values():
 bore=bores[r['GA_BOREHOLE_GUID']]
 bore['picks'].append({'id':r['GA_GUID'],'unit':r['GA_UNIT'],'sourceUnit':r['SOURCE_UNIT'],'asud':num(r,'GA_ASUD_NO'),'topMD':num(r,'TOP_MD_M'),'baseMD':num(r,'BASE_MD_M'),'topAHD':num(r,'TOP_AHD_M'),'baseAHD':num(r,'BASE_AHD_M'),'preferredTop':r['preferredTop'],'preferredBase':r['preferredBase'],'preference':r['PREFERRED'],'source':r['DATA_SOURCE'],'hierarchy':num(r,'HIERARCHY'),'tag':r['TAG'],'comment':r['COMMENT']})
for b in bores.values():b['picks'].sort(key=lambda p:(p['topMD'] if p['topMD'] is not None else float('inf'),p['unit']))
out={'title':'Australian Borehole Stratigraphic Units Compilation 2024 v2 · atlas subset','citation':'Vizy, J. and Rollet, N. (2024), Geoscience Australia. ABSUC 2024 Version 2.0.','url':'https://doi.org/10.26186/149324','metadataUrl':META,'archiveUrl':URL,'license':'CC BY 4.0, Commonwealth of Australia (Geoscience Australia); underlying regional sources GSNSW_2021 and GA_NDP_31_10_2022, CC BY 4.0.','downloaded':datetime.datetime.now(datetime.timezone.utc).date().isoformat(),'bounds':bounds,'horizontalDatum':'GDA94 geographic coordinates, displayed at regional scale without a WGS84 transformation.','verticalDatum':'Australian Height Datum (AHD); original drilling reference retained per borehole.','warning':'Published compiled stratigraphic interpretations, not newly verified logs. Measured depths are not corrected for borehole deviation, including horizontal and low-angle holes. Tops and bases were selected independently by the source; no equivalent-pick validation was undertaken.','method':'Included every preferred TOP/BASE record within the regional bounds, joined by original GA_GUID only. No interpolated contacts or surfaces. Suspect bases remain flagged and are not used as verified interval ends.','stats':{'bores':len(bores),'preferredTops':len(tops),'preferredBases':len(bases),'uniqueRecords':len(records)},'bores':sorted(bores.values(),key=lambda b:b['name'])}
(R/'dist/data/borehole-picks.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
receipt={'date':out['downloaded'],'url':URL,'archiveSHA256':hashlib.file_digest(archive.open('rb'),'sha256').hexdigest(),'members':['ABSUC_BOREHOLE_v2.txt','ABSUC_TOP_v2.txt','ABSUC_BASE_v2.txt'],'bounds':bounds,'stats':out['stats'],'metadataUrl':META}
(R/'evidence/borehole-downloads.json').write_text(json.dumps(receipt,indent=2))
print(out['stats'])
