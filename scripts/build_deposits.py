"""Sourced geological context; never generates an inferred seam surface."""
from pathlib import Path
import json,math
R=Path(__file__).resolve().parents[1];D=R/'dist/data'
a=json.loads((D/'atlas.json').read_text());inventory=json.loads((D/'industry.json').read_text());bores=json.loads((D/'borehole-picks.json').read_text())['bores']
base='https://bioregionalassessments.gov.au/assessments/'
regions={
 'Western':dict(units=['Illawarra Coal Measures'],text='Regional economic coal units include Lithgow Coal, Ulan Coal and Katoomba Coal Member. Seam splitting and erosion prevent a single flat layer from representing the coalfield.',url=base+'12-resource-assessment-hunter-subregion/12113-western-coalfield'),
 'Gunnedah':dict(units=['Black Jack Group','Maules Creek Formation'],text='Coal resources occur in the Gunnedah Basin. Hoskissons Coal and the Maules Creek Formation are major targets. The Boggabri Ridge separates sub-basins with substantially different burial and structure.',url=base+'23-conceptual-modelling-namoi-subregion/2322-geology-and-hydrogeology'),
 'Hunter':dict(units=['Wittingham Coal Measures','Greta Coal Measures'],text='The regional coal succession includes the Wittingham and Greta coal measures. Individual seams split and change thickness; regional unit names do not establish the target at this mine.',url=base+'12-resource-assessment-hunter-subregion/12111-hunter-coalfield'),
 'Newcastle':dict(units=['Newcastle Coal Measures','Tomago Coal Measures','Greta Coal Measures'],text='The coalfield contains several coal-bearing successions. Wallarah, Great Northern and Fassifern are notable upper Newcastle seams. This regional sequence does not establish their presence beneath every marker.',url=base+'12-resource-assessment-hunter-subregion/12112-newcastle-coalfield'),
 'Southern':dict(units=['Illawarra Coal Measures'],text='The Southern Coalfield includes the Bulli and Wongawilli coal seams. Displayed sheets illustrate regional relationships; mine-specific seam surfaces and workings have not been reconstructed.',url='https://www.bioregionalassessments.gov.au/assessments/12-resource-assessment-sydney-basin-bioregion/1211-coal')}
# Historical geological observations only. No historical ownership or output is promoted to current fact.
sites={
 'Moolarben':(['Ulan Coal'],'The assessment reports a mean Ulan seam thickness of about 12 m at Moolarben. This is a deposit-scale historical reference shared by the complex, not a measurement at either registry point.','12-resource-assessment-hunter-subregion/12113-western-coalfield'),
 'Ulan':(['Ulan Coal'],'The assessment distinguishes the thicker coal-bearing unit from the approximately 3 m lower working section at Ulan. A working section is not the full seam thickness.','12-resource-assessment-hunter-subregion/12113-western-coalfield'),
 'Wilpinjong':(['Ulan Coal'],'Published regional notes describe the upper Ulan coal section at Wilpinjong as about 1.4–3.5 m thick. This range is not an interpolated surface.','12-resource-assessment-hunter-subregion/12113-western-coalfield'),
 'Mangoola':(['Great Northern coal seam','Awaba Tuff','Fassifern coal seam'],'Published site description places Awaba Tuff between Great Northern and Fassifern. The tuff is typically 9–10 m thick. Conglomerate and sandstone overburden is described as 15–90 m thick.','12-resource-assessment-hunter-subregion/122119-mangoola-coal-mine'),
 'Mount Arthur':([], 'The historical assessment describes extraction from 15 seams at Mount Arthur North. It does not provide a seam-level 3D surface for this atlas.','12-resource-assessment-hunter-subregion/122121-mount-arthur-coal-mine-complex'),
 'Mount Owen':(['Wittingham Coal Measures'],'The deposit lies between the Hunter and Hebden thrusts. The assessment identifies 22 mineable intervals within 11 seams and local dips up to 45°. These structural constraints rule out a defensible flat-sheet reconstruction.','12-resource-assessment-hunter-subregion/122122-mount-owen-complex'),
 'Glendell':(['Foybrook Formation'],'The assessment identifies Pikes Gully, Arties, Upper, Middle and Lower Liddell, and Barrett seams, with reported thicknesses of 0.3–3.5 m. The mapped mine point does not define their geometry.','12-resource-assessment-hunter-subregion/122122-mount-owen-complex'),
 'Boggabri':(['Maules Creek Formation'],'The Namoi assessment lists Braymont, Merriowen and Jeralong as target coal members, with a minor basal seam from the underlying Leard Formation.','23-conceptual-modelling-namoi-subregion/2322-geology-and-hydrogeology'),
 'Tarrawonga':(['Maules Creek Formation'],'The Namoi assessment lists Braymont, Bollol Creek and Jeralong as target coal members. No measured depths are assigned to this collar location.','23-conceptual-modelling-namoi-subregion/2322-geology-and-hydrogeology'),
 'Maules Creek':(['Maules Creek Formation'],'The Namoi assessment describes 15 target members, from Herndale to Templemore. The mine exploits a succession of seams rather than one continuous coal sheet.','23-conceptual-modelling-namoi-subregion/2322-geology-and-hydrogeology'),
}
records=[]
for r in inventory['records']:
 region=regions[r['region']];site=next((v for k,v in sites.items() if k.lower() in r['name'].lower()),None)
 units,text,url=(site[0],site[1],base+site[2]) if site else (region['units'],region['text'],region['url'])
 if not site and r['seams']:
  units=[next((s['name'] for s in a['seams'] if s['id']==id),id) for id in r['seams']]
  text=r['description']+' These existing atlas references do not supply validated deposit surfaces.'
  src=next((s for s in inventory['sources'] if s['id'] in r['sources'] and s['id']!='gs'),None)
  if src:url=src['url']
 near=[b['id'] for b in bores if math.hypot((b['lon']-r['lon'])*111.32*math.cos(math.radians(r['lat'])),(b['lat']-r['lat'])*111.32)<=10]
 records.append(dict(id=r['id'],name=r['name'],region=r['region'],units=units,summary=text,scope='Published site description' if site else 'Existing site reference' if r['seams'] else 'Regional context only',sourceUrl=url,sourceTitle='Bioregional Assessment — geological reference' if 'bioregional' in url else 'Existing atlas site reference',sourceBasis='Historical geological reference; not current production or mine status',reviewedAt='2026-09-13',terrain='Regional DEM with continuous coverage',surfaceMapping='Illawarra detailed tile' if r['region']=='Southern' else 'Not acquired for this mine',boreholeIdsWithin10km=near,boreholeNote='Proximity is not a seam correlation',publishedSection='Source narrative; no section digitised',surfaces3D='No validated mine-specific surfaces acquired',faults='Published thrust constraints; no geometry digitised' if 'Mount Owen' in r['name'] else 'No mine-specific fault geometry acquired',minePlans='Not acquired',commercialSourceIds=r['sources'],gaps=['Surveyed seam geometry, datum and fault constraints required for a 3D deposit model','Mine-scale terrain detail outside the Illawarra tile remains to be acquired'],orderedProfile=r['name'].startswith('Mangoola')))
(D/'mine-geology.json').write_text(json.dumps(dict(title='Mine geological coverage register',reviewedAt='2026-09-13',records=records),indent=2)+'\n')
print('Coverage register:',len(records),'mines;',sum(r['scope']=='Published site description' for r in records),'new site descriptions')
