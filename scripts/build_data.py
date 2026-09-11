"""Curated educational model. All subsurface meshes are conceptual, NOT fitted to boreholes."""
from pathlib import Path
import json, math, hashlib
R=Path(__file__).resolve().parents[1];D=R/'dist/data'
def write(name,data): (D/name).write_text(json.dumps(data,separators=(',',':')))
S=[
 dict(id='gs',title='Geological Survey of NSW — mine and coal borehole records',url='https://www.resources.nsw.gov.au/geological-survey/products-and-data/gis-web-services',note='WFS point locations downloaded 11 September 2026 (Sydney). CC BY 4.0. Mine status is the registry snapshot, not a live operational guarantee.'),
 dict(id='terrain',title='Mapzen / Tilezen terrain tiles on AWS',url='https://www.mapzen.com/rights/',note='Terrarium elevation data, zoom 9, resampled to 193 × 289 points. Regional terrain only; includes bathymetry. Two reviewed source artefacts use GA DEM water-surface replacements; see terrain-corrections.json (CC BY 4.0, https://pid.geoscience.gov.au/dataset/ga/72759). Mapzen attribution and underlying SRTM/global datasets apply.'),
 dict(id='southern',title='Australian Government — Southern Coalfield geology',url='https://www.bioregionalassessments.gov.au/assessments/12-resource-assessment-sydney-basin-bioregion/1211-coal',note='Published assessment (2018/2019): seam order, Bulli thickness commonly 2–3m, Wongawilli workable lower section around 3m. Regional values, not measurements at every displayed point.'),
 dict(id='sydney',title='Australian Museum — Sydney Basin collieries',url='https://journals.australian.museum/media/dd/documents/1819_complete.2c68b3f.pdf',note='2023 review: Sydney Harbour Colliery at Birchgrove reached 880m. This shaft depth is a historical reference, not a basin-wide seam depth.'),
 dict(id='myuna',title='Australian Government — Myuna seam depths',url='https://www.bioregionalassessments.gov.au/assessments/12-resource-assessment-hunter-subregion/122125-myuna-colliery',note='Historical site reference: Wallarah ~80m, Great Northern ~120m, Fassifern ~140m below surface at Myuna. These do not establish regional seam surfaces.'),
 dict(id='myunaproduct',title='Centennial — Myuna',url='https://www.centennialcoal.com.au/operations/myuna',note='Operator describes underground operation at Wangi Wangi and supply to Eraring.'),
 dict(id='mandalong',title='Centennial — Mandalong',url='https://www.centennialcoal.com.au/operations/mandalong',note='Operator identifies supply to Eraring and Vales Point power stations.'),
 dict(id='appin',title='GM³ — Appin Mine',url='https://gm3.au/appin-mine/',note='Operator identifies Bulli Seam extraction and West Cliff preparation facilities.'),
 dict(id='dendrobium',title='GM³ — Dendrobium Mine',url='https://community.gm3.au/dendrobium-mine',note='Operator identifies mine location near Mount Kembla.'),
 dict(id='southtransport',title='GM³ — Dendrobium and Appin transport modification report',url='https://gm3.au/wp-content/uploads/2024/08/Dendrobium-Appin-Coal-Transport-MOD-Modification-Report.pdf',note='Transport connections to Port Kembla. Lines in this atlas are schematic links, not surveyed road or railway alignments.'),
 dict(id='metro',title='Peabody — February 2026 presentation',url='https://www.sec.gov/Archives/edgar/data/1064728/000106472826000008/bmoconference-feb2026fin.htm',note='Metropolitan: hard/semi-hard coking coal, by-products, Port Kembla Coal Terminal. By-products are not automatically classified as thermal here.'),
 dict(id='mtw',title='Yancoal — 2025 operations report',url='https://www.yancoal.com.au/wp-content/uploads/2026/04/Yancoal-P4-Report-2025.pdf',note='Mount Thorley Warkworth produces thermal and semi-soft coking coal.'),
 dict(id='types',title='NSW Resources — thermal and coking coal regions',url='https://www.resources.nsw.gov.au/sites/default/files/2022-11/thermal-coal.pdf',note='2021 regional guide: Hunter thermal and soft coking coals; Southern Coalfield hard coking coals. Use varies by seam, mine, processing and market.'),
 dict(id='mapping',title='NSW 3D geological mapping programme',url='https://www.resources.nsw.gov.au/geological-survey/projects/3d-mapping-of-nsw',note='Identifies basin modelling programme. No downloadable, continuous seam-level model was obtained for this build.'),
 dict(id='port',title='Port of Newcastle — trade overview',url='https://pon.com.au/trade-and-business/trade-overview-reports/',note='Regional coal export destination. Hunter transport link is illustrative, not a shipment record.')]
# x is kilometres east; z is kilometres south. Metres for elevations until rendering.
def xyz(lon,lat,h=0): return [round((lon-151.15)*111.32*math.cos(math.radians(-33.55)),4),h/1000,round((-33.55-lat)*111.32,4)]
terrain=json.load(open(D/'terrain.json'))
def height(lon,lat):
 w,s,e,n=terrain['bounds'];nx=terrain['nx'];ny=terrain['ny'];i=max(0,min(nx-1,round((lon-w)/(e-w)*(nx-1))));j=max(0,min(ny-1,round((n-lat)/(n-s)*(ny-1))));return max(0,terrain['elevations'][j*nx+i])
# footprints are explanatory windows, explicitly not mapped seam extent or mine leases.
seams=[]
def layer(id,name,region,tags,color,poly,mode,offset,ref,desc,src,kind='seam'):
 seams.append(dict(id=id,name=name,region=region,tags=tags,color=color,polygon=poly,mode=mode,offset=offset,reference=ref,description=desc,sources=src,kind=kind,confidence='Conceptual geometry',classification='Documented use near referenced operations; not an assay-based classification of the whole displayed sheet.',geometryNote='Illustrative footprint, depth and structure. Not a resource estimate, mine plan or borehole-interpolated surface.'))
south=[[150.62,-34.52],[150.80,-34.53],[150.91,-34.36],[151.04,-34.19],[151.01,-34.04],[150.69,-34.03],[150.57,-34.27]]
layer('bulli','Bulli Seam','Illawarra',['met'],'#f7b967',south,'south',0,{'Typical thickness':'2–3 m','Age':'Late Permian','Model elevation':'Variable / illustrative'},'The upper major coal seam of the Southern Coalfield. It is exposed near the coast and becomes deeply buried inland. Appin and Metropolitan mine this seam. Its hard coking coal is used in steelmaking.',['southern','appin','metro'])
layer('balgownie','Balgownie Seam','Illawarra',['met'],'#e68e55',south,'south',-90,{'Thickness':'Variable','Age':'Late Permian','Layer spacing':'Illustrative'},'A coal unit below the Bulli Seam in the Illawarra Coal Measures. It is associated with coking-coal resources; the model separates the sheets to make their stratigraphic order visible.',['southern','types'])
layer('wongawilli','Wongawilli Seam','Illawarra',['met'],'#ffe09e',south,'south',-220,{'Coal-bearing interval':'Often 6–15 m','Lower workable part':'About 3 m','Layer spacing':'Illustrative'},'A thick coal-bearing interval with mineral-rich bands. Only part of its thickness is typically worked. Dendrobium accesses the Wongawilli Seam; its coal is linked to Port Kembla steelmaking and export.',['southern','dendrobium','southtransport'])
central=[[150.69,-34.02],[151.04,-34.02],[151.30,-33.80],[151.37,-33.53],[151.09,-33.39],[150.73,-33.57]]
layer('central','Buried Illawarra Coal Measures','Sydney',['unknown'],'#9da8c7',central,'central',0,{'Historical shaft':'880 m at Birchgrove','Coal use':'Not assigned','Display':'Formation envelope'},'Under Sydney, coal-bearing Permian rocks lie beneath younger sandstone and shale. This sheet is an illustrative formation envelope, not a single identified coal seam. The Balmain shaft demonstrates deep coal beneath the harbour, but does not define the entire surface.',['sydney','southern'],'formation')
north=[[151.28,-33.25],[151.59,-33.25],[151.72,-33.08],[151.77,-32.92],[151.52,-32.83],[151.26,-33.01]]
layer('wallarah','Wallarah Seam','Lake Macquarie',['thermal'],'#76eef0',north,'north',0,{'Myuna depth reference':'About 80 m','Typical site thickness':'2–2.5 m','Depth outside Myuna':'Illustrative'},'The upper of the three seams shown around Myuna. Historical assessments describe mining beneath and around Lake Macquarie. Thermal classification reflects documented local power-station supply.',['myuna','myunaproduct'])
layer('greatnorthern','Great Northern Seam','Lake Macquarie',['thermal'],'#43c7d7',north,'north',-40,{'Myuna depth reference':'About 120 m','Typical site thickness':'2.5–3 m','Depth outside Myuna':'Illustrative'},'Below the Wallarah Seam, separated by other sedimentary rocks. Myuna is a documented example of these coal layers being used for electricity generation.',['myuna','myunaproduct'])
layer('fassifern','Fassifern Seam','Lake Macquarie',['thermal'],'#2797ae',north,'north',-60,{'Myuna depth reference':'About 140 m','Site thickness reference':'About 3 m','Depth outside Myuna':'Illustrative'},'The lowest of the three Myuna seams displayed. The reference depths come from a historical site assessment. Local thinning, splitting and structure are simplified in this regional view.',['myuna','myunaproduct'])
hunter=[[150.90,-32.90],[151.21,-32.94],[151.43,-32.72],[151.25,-32.47],[150.88,-32.46],[150.76,-32.65]]
layer('hunter','Hunter coal-bearing horizons','Hunter',['thermal','met'],'#dfa4ef',hunter,'hunter',0,{'Products':'Thermal + semi-soft coking','Display':'Composite horizons','Individual seam model':'Not available'},'A conceptual view of the coal-bearing succession in the Hunter. This is not one continuous named seam. Mount Thorley Warkworth produces both thermal and semi-soft coking coal; the purple classification represents that regional product mix.',['mtw','types'],'formation')
# Polygon gridding, no fabricated faults: smooth illustrative dip only.
def inside(x,y,p):
 c=False;j=len(p)-1
 for i in range(len(p)):
  a,b=p[i];u,v=p[j]
  if (b>y)!=(v>y) and x<(u-a)*(y-b)/(v-b)+a:c=not c
  j=i
 return c
for s in seams:
 p=s['polygon'];xmin=min(v[0] for v in p);xmax=max(v[0] for v in p);ymin=min(v[1] for v in p);ymax=max(v[1] for v in p);nx,ny=43,53;verts=[];tri=[]
 for j in range(ny):
  lat=ymin+(ymax-ymin)*j/(ny-1)
  for i in range(nx):
   lon=xmin+(xmax-xmin)*i/(nx-1)
   if s['mode']=='south': h=80-max(0,151.0-lon)*1800-(lat+34.3)*350+s['offset']
   elif s['mode']=='central': h=-740-160*math.cos((lat+33.7)*4)+(lon-151.1)*180
   elif s['mode']=='north': h=height(151.5674,-33.0635)-80-(151.5674-lon)*220+s['offset']
   else:h=-80-120*math.sin((lon-150.8)*6)-50*(lat+32.7)
   h=min(h,height(lon,lat)-15+s['offset'])
   verts.extend(xyz(lon,lat,h))
 for j in range(ny-1):
  for i in range(nx-1):
   lon=xmin+(xmax-xmin)*(i+.5)/(nx-1);lat=ymin+(ymax-ymin)*(j+.5)/(ny-1)
   if inside(lon,lat,p):
    a=j*nx+i;tri.extend([a,a+nx,a+1,a+1,a+nx,a+nx+1])
 s['mesh']={'positions':verts,'indices':tri};s['center']=xyz(sum(x[0] for x in p)/len(p),sum(x[1] for x in p)/len(p),-300)
mines=[];raw=json.load(open(D/'nsw-operating-mines.geojson'))
configs=[('Dendrobium','dendrobium',['met'],['wongawilli'],'Underground · Wongawilli','Metallurgical coal; preparation and steelmaking/export connections at Port Kembla.',['dendrobium','southern','southtransport']),('Appin','appin',['met'],['bulli'],'Underground · Bulli','Bulli Seam coal, processed through associated facilities including West Cliff.',['appin','southtransport']),('Metropolitan','metropolitan',['met'],['bulli'],'Underground · Bulli','Coking coal exported through Port Kembla. By-products are not automatically labelled thermal.',['metro','southern']),('Mandalong','mandalong',['thermal'],[],'Underground','Documented supply to Eraring and Vales Point. Its worked seam is not separately reconstructed in this atlas.',['mandalong']),('Myuna','myuna',['thermal'],['wallarah','greatnorthern','fassifern'],'Underground · three seams','Power-station coal from beneath the Lake Macquarie area; supply to Eraring.',['myuna','myunaproduct']),('Mount Thorley','mtw',['thermal','met'],['hunter'],'Open cut · multiple seams','Thermal and semi-soft coking coal. This example shows why thermal and met filters overlap.',['mtw','port'])]
extra=[
 ('Ashton','ashton',['thermal','met'],['hunter'],'Underground','Produces semi-soft coking coal and thermal products. Export through Newcastle is documented.','https://www.yancoal.com.au/our-sites/ashton/'),
 ('Bloomfield','bloomfield',['thermal'],[],'Open cut','Operator describes thermal coal and multi-seam mining. Individual seams are not reconstructed here.','https://www.bloomcoll.com.au/operations/bloomfield-collieries'),
 ('Bulga','bulga',['thermal','met'],['hunter'],'Open cut','Operator identifies both metallurgical and thermal coal products.','https://www.glencore.com.au/operations-and-projects/coal/current-operations/bulga-coal'),
 ('Chain Valley','chainvalley',['thermal'],[],'Underground','Developed to supply Vales Point. The atlas shows a schematic power-station connection.','https://www.deltacoal.com.au/ArticleDocuments/10302/Delta%20Coal%20Fact%20Sheet%2010%20Jan%202023.pdf.aspx'),
 ('Hunter Valley Operations','hvo',['thermal','met'],['hunter'],'Open cut','Thermal and semi-soft coking products are documented by the operator.','https://www.yancoal.com.au/our-sites/hunter-valley-operations/'),
 ('Ravensworth','ravensworth',['thermal','met'],['hunter'],'Open cut','Thermal and metallurgical coal exported through Newcastle.','https://www.glencore.com.au/operations-and-projects/coal/current-operations/ravensworth-operations'),
 ('Rixs Creek','rixscreek',['thermal','met'],['hunter'],'Open cut','Thermal and semi-soft coking coal, transported by rail to Newcastle.','https://www.bloomcoll.com.au/operations/rixs-creek'),
 ('Wambo underground','wambo',['thermal'],['hunter'],'Underground','Peabody identifies a thermal product. The point is the underground operation, distinct from United Wambo open cut.','https://www.peabodyenergy.com/Operations/Australia-Mining/New-South-Wales-Mining/Wambo-Underground-Mine'),
 ('United Wambo','unitedwambo',['thermal','met'],['hunter'],'Open cut','The 2024 review describes thermal and metallurgical products. The GSNSW point name still says proposal; it is retained as a location record, not a current project-status claim.','https://www.glencore.com.au/.rest/api/v1/documents/7b5888d56616d0ea4df620724dfd6658/2024_DEV_UW_EXT_AREP_Review_App.pdf')]
for needle,id,tags,ss,method,desc,url in extra:
 S.append(dict(id=id,title=needle+' — operator evidence',url=url,note=desc))
 configs.append((needle,id,tags,ss,method,desc,[id]))
for needle,id,tags,ss,method,desc,src in configs:
 f=next(f for f in raw['features'] if needle.lower() in f['properties']['operation'].lower());lon,lat=f['geometry']['coordinates']
 mines.append(dict(id=id,name='Mount Thorley Warkworth' if id=='mtw' else needle,lon=lon,lat=lat,position=xyz(lon,lat,height(lon,lat)),tags=tags,seams=ss,kind='mine',method=method,description=desc,sources=['gs']+src,confidence='GSNSW point location',status=f['properties']['operation_state']+' in downloaded registry',registryId=f['properties']['occurrence_id']))
mines.append(dict(id='balmain',name='Balmain / Birchgrove',lon=151.1806,lat=-33.8456,position=xyz(151.1806,-33.8456,height(151.1806,-33.8456)),tags=['unknown'],seams=['central'],kind='historic',method='Historical shaft mine',description='Sydney Harbour Colliery reached 880m. Coal production ended in 1931. The marker is an approximate historical location and the shaft is a diagram, not a surveyed alignment.',sources=['sydney'],confidence='Approximate historical location',status='Historical · closed'))
dests=[dict(id='pkct',name='Port Kembla · export',lon=150.902,lat=-34.456,kind='port',tags=['met','thermal'],description='Coal export terminal. Southern mine links are schematic connections; no live shipments or volumes are implied.',sources=['southtransport','metro']),dict(id='steelworks',name='Port Kembla · steelworks',lon=150.879,lat=-34.48,kind='steel',tags=['met'],description='Steelmaking destination for Illawarra metallurgical coal. The route shows the supply relationship, not an exact conveyor or rail alignment.',sources=['southtransport']),dict(id='eraring',name='Eraring power station',lon=151.52,lat=-33.061,kind='power',tags=['thermal'],description='Documented thermal-coal destination for Myuna and Mandalong.',sources=['myunaproduct','mandalong']),dict(id='vales',name='Vales Point power station',lon=151.541,lat=-33.16,kind='power',tags=['thermal'],description='Documented thermal-coal destination for Mandalong.',sources=['mandalong']),dict(id='newcastleport',name='Newcastle · export',lon=151.777,lat=-32.899,kind='port',tags=['met','thermal'],description='Regional export gateway. The Hunter connection is illustrative; it does not identify a shipment, customer or exact rail path.',sources=['port','mtw'])]
for d in dests:d['position']=xyz(d['lon'],d['lat'],height(d['lon'],d['lat']));d['confidence']='Approximate facility location';d['seams']=[]
routes=[]
for a,b,mode,src in [('dendrobium','steelworks','Rail / preparation',['southtransport']),('dendrobium','pkct','Preparation / export',['southtransport']),('appin','pkct','Road / preparation / export',['southtransport']),('metropolitan','pkct','Rail / export',['metro']),('myuna','eraring','Conveyor / power generation',['myunaproduct']),('mandalong','eraring','Local coal supply',['mandalong']),('mandalong','vales','Local coal supply',['mandalong']),('mtw','newcastleport','Regional rail / export (illustrative)',['mtw','port']),('ashton','newcastleport','Rail / export',['ashton']),('ravensworth','newcastleport','Export connection',['ravensworth']),('rixscreek','newcastleport','Rail / export',['rixscreek']),('chainvalley','vales','Local power-station supply',['chainvalley'])]:
 m=next(m for m in mines if m['id']==a);d=next(d for d in dests if d['id']==b);tags=[t for t in m['tags'] if t in d['tags']]
 routes.append(dict(id=a+'-'+b,fromId=a,toId=b,tags=tags,mode=mode,sources=src,geometryNote='Schematic connection. Not a mapped transport alignment. No volume implied.'))
chapters=[dict(id='illawarra',name='Illawarra',region='SOUTHERN COALFIELD',title='Where the coal meets the coast',text='Follow the Bulli and Wongawilli seams beneath the escarpment. Warm colours identify documented metallurgical uses near the southern mines.',lon=150.84,lat=-34.32,distance=69,elevation=44,seam='bulli'),dict(id='sydney',name='Sydney',region='CENTRAL COALFIELD',title='A hidden basin beneath the harbour',text='The familiar sandstone city sits above much older coal-bearing rocks. At Birchgrove, a historical shaft reached 880 metres. The pale sheet here is a formation envelope, not a mapped seam.',lon=151.12,lat=-33.85,distance=67,elevation=46,seam='central'),dict(id='lake',name='Lake Macquarie',region='NEWCASTLE COALFIELD',title='Three seams beneath the lake',text='Wallarah, Great Northern and Fassifern form the local sequence shown at Myuna. Turn on coal journeys to follow their documented connection to electricity generation.',lon=151.49,lat=-33.12,distance=50,elevation=32,seam='wallarah'),dict(id='newcastle',name='Newcastle',region='NEWCASTLE COALFIELD',title='From buried forests to an export port',text='Arrive at Newcastle and explore the coastal coalfield. The borehole layer shows where coal exploration has been recorded; borehole depths are not seam depths.',lon=151.65,lat=-32.97,distance=54,elevation=36,seam='fassifern'),dict(id='hunter',name='Hunter Valley',region='HUNTER COALFIELD',title='One region, more than one coal use',text='Continue inland to Mount Thorley Warkworth. Purple marks a thermal and metallurgical product mix. The composite coal horizons are schematic, not a mine resource model.',lon=151.08,lat=-32.69,distance=60,elevation=40,seam='hunter')]
places=[('WOLLONGONG',150.894,-34.425),('SYDNEY',151.209,-33.869),('NEWCASTLE',151.782,-32.928),('Coalcliff',150.975,-34.245),('Campbelltown',150.815,-34.065),('Gosford',151.343,-33.426),('Lake Macquarie',151.59,-33.11),('Singleton',151.177,-32.565),('Port Kembla',150.90,-34.475)]
places=[dict(name=n,lon=x,lat=y,position=xyz(x,y,height(x,y)),major=n.isupper()) for n,x,y in places]
b=json.load(open(R/'cache/coal-bores.geojson'));bf=b.get('features',[])
# Keep full filtered source locally; browser points spatially thin to avoid overdraw.
bycell={}
for f in bf:
 x,y=f['geometry']['coordinates'];key=(round(x/0.02),round(y/0.02))
 if key not in bycell or (f['properties'].get('end_depth') or 0)>(bycell[key]['properties'].get('end_depth') or 0):bycell[key]=f
bores=[]
for f in bycell.values():
 x,y=f['geometry']['coordinates'];p=f['properties'];bores.append(dict(id=p['gsnsw_drill_id'],name=p.get('hole_name') or p['gsnsw_drill_id'],position=xyz(x,y,height(x,y)),depth=p.get('end_depth'),year=p.get('year_drilled')))
write('atlas.json',dict(title='Beneath the coast',date='2026-09-11',origin=[151.15,-33.55],sources=S,seams=seams,mines=mines,destinations=dests,routes=routes,chapters=chapters,places=places,bores=bores,boreTotal=len(bf),boreDisplayed=len(bores),modelNotice='All subsurface sheets are conceptual educational reconstructions. Boreholes are location/depth context only and were not used to fit seam surfaces.'))
print('Built',len(seams),'layers,',len(mines),'mines,',len(routes),'connections,',len(bores),'of',len(bf),'boreholes')
