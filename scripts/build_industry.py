"""Reconcile every downloaded NSW coal registry record with curated evidence.

Unknowns remain null. Complex-level production is stored once, never summed as
separate mine production. Registry status is retained independently of operator facts.
"""
from pathlib import Path
import json, re
R=Path(__file__).resolve().parents[1];D=R/'dist/data'
a=json.loads((D/'atlas.json').read_text())
raw=json.loads((D/'nsw-operating-mines.geojson').read_text())
sources={s['id']:s for s in a['sources']}
def source(id,url,title):
    sources[id]=dict(id=id,url=url,title=title,note='Operator source reviewed 11 September 2026. Reporting dates are given with individual metrics.')
source('whitehaven','https://whitehavencoal.com.au/','Whitehaven — NSW assets')
source('glencore','https://www.glencore.com.au/operations-and-projects/coal/current-operations','Glencore — coal operations')
source('centennial','https://www.centennialcoal.com.au/projects/projects-overview','Centennial — project and operations overview')
source('airly','https://www.centennialcoal.com.au/operations/airly','Centennial — Airly')
source('ulan','https://www.glencore.com.au/operations-and-projects/coal/current-operations/ulan-coal','Glencore — Ulan Coal')
source('narrabri','https://whitehavencoal.com.au/our-business/our-assets/narrabri-mine/','Whitehaven — Narrabri Mine')
source('bengalla','https://newhopegroup.com.au/bengalla-mining-company/about-us/','Bengalla — ownership and operations')
source('mtarthur','https://www.bhp.com/what-we-do/global-locations/australia/nsw-mt-arthur-coal-mine-hunter-valley','BHP — Mt Arthur')
source('mountpleasant','https://machenergyaustralia.com.au/mount-pleasant/','MACH Energy — Mount Pleasant')
source('maxwell','https://malabarresources.com.au/about-us/our-assets/','Malabar — Maxwell Underground')
source('yancoalsites','https://www.yancoal.com.au/our-sites/','Yancoal — sites and interests')

# The operator/group field is separate from joint-venture ownership.
groups=[
 (['Appin','Dendrobium'],'GM³','appin'),
 (['Metropolitan','Wambo underground'],'Peabody','metro'),
 (['Mandalong','Myuna'],'Centennial','mandalong'),
 (['Airly'],'Centennial','airly'),
 (['Clarence','Springvale'],'Centennial','centennial'),
 (['Mount Thorley','Moolarben','Ashton'],'Yancoal','yancoalsites'),
 (['Bulga','Ravensworth','Mangoola','Mount Owen','Glendell','United Wambo'],'Glencore','glencore'),
 (['Ulan'],'Glencore','ulan'),
 (['Maules Creek','Tarrawonga','Vickery'],'Whitehaven','whitehaven'),
 (['Narrabri'],'Whitehaven','narrabri'),
 (['Bloomfield','Rixs Creek'],'Bloomfield Group','rixscreek'),
 (['Chain Valley'],'Delta Coal','chainvalley'),
 (['Bengalla'],'Bengalla Mining Company','bengalla'),
 (['Mount Arthur'],'BHP / NSW Energy Coal','mtarthur'),
 (['Mount Pleasant'],'MACH Energy','mountpleasant'),
 (['Maxwell'],'Malabar Resources','maxwell'),
]
by_registry={m.get('registryId'):m for m in a['mines']}
records=[]
for f in raw['features']:
    p=f['properties']
    if p['comm_type']!='COAL':continue
    name=p['operation'];lon,lat=f['geometry']['coordinates'];old=by_registry.get(p['occurrence_id'])
    id=old['id'] if old else re.sub('[^a-z0-9]+','-',name.lower()).strip('-')
    region='Gunnedah' if lat>-31.5 else 'Southern' if lat<-34 else 'Western' if lon<150.5 else 'Newcastle' if any(n in name for n in ['Bloomfield','Chain Valley','Mandalong','Myuna']) else 'Hunter'
    operator=None;extra=[]
    for needles,company,src in groups:
        if any(n in name for n in needles):operator=company;extra=[src];break
    if 'Hunter Valley Operations' in name:operator='Hunter Valley Operations JV';extra=['yancoalsites','glencore']
    tags=old['tags'] if old else ['unknown']
    if any(n in name for n in ['Moolarben','Ulan','Narrabri','Bengalla','Mount Arthur','Mount Pleasant']):tags=['thermal']
    if 'Maxwell' in name:tags=['met','thermal']
    complex_id='moolarben' if 'Moolarben' in name else 'ulan' if 'Ulan' in name else 'mtw' if 'Mount Thorley' in name else None
    records.append(dict(id=id,registryId=p['occurrence_id'],name=old['name'] if old else name,registryName=name,
        lon=lon,lat=lat,region=region,operator=operator,tags=tags,complexId=complex_id,
        method='Underground' if 'underground' in name.lower() else 'Open cut' if 'open cut' in name.lower() else None,
        registryStatus=p['operation_state'],statusNote='Downloaded registry status; not independently confirmed current operation.',
        in3D=bool(old),seams=old['seams'] if old else [],
        description=old['description'] if old else 'Source registry location. Detailed geological and commercial attributes are not yet populated.',
        sources=list(dict.fromkeys((old['sources'] if old else ['gs'])+extra)),reviewedAt='2026-09-11',ownership=None,capacity=None))

for r in records:
    if 'Narrabri' in r['name']:
        r['ownership']='Whitehaven 77.5%; three other interests of 7.5% each (operator page).'
        r['capacity']=dict(value=11,unit='Mtpa',basis='Approved run-of-mine production; not actual output',source='narrabri')
    if 'Bengalla' in r['name']:r['ownership']='New Hope Group 80%; Taipower 20% (operator page).'
    if r['complexId']=='ulan':r['ownership']='Glencore 100% (Ulan complex).'

complexes={
 'moolarben':dict(name='Moolarben complex',saleableMt=19.1,romMt=21.6,period='Calendar 2025',basis='100% operation; open cut and underground combined',source='mtw'),
 'mtw':dict(name='Mount Thorley Warkworth complex',saleableMt=11.8,romMt=17.7,period='Calendar 2025',basis='100% operation; integrated complex',source='mtw'),
 'ulan':dict(name='Ulan Coal complex',saleableMt=10.044,romMt=None,period='Calendar 2025',basis='Ulan Underground and Ulan West combined',source='ulan'),
}
out=dict(version=2,date='2026-09-11',records=sorted(records,key=lambda r:r['name']),complexes=complexes,
    destinations=a['destinations'],routes=a['routes'],sources=list(sources.values()),
    coverageNote='All 35 coal location records in the downloaded GSNSW operating-mine layer. This is registry coverage, not proof of an exhaustive or current NSW mine inventory. Historical Balmain remains in the 3D geology tour.')
assert len(records)==sum(f['properties']['comm_type']=='COAL' for f in raw['features'])
(D/'industry.json').write_text(json.dumps(out,separators=(',',':')))
print('Built',len(records),'registry records;',sum(r['operator'] is not None for r in records),'operator/group associations;',len(complexes),'production profiles')
