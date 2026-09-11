"""Build the editable Blender scene from exactly the browser's JSON geometry.
Run: blender --background --factory-startup --python scripts/build_blender.py
Optional --render-stills / --render-animation after --.
"""
import bpy, json, math, sys, re
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[1];D=R/'dist/data';OUT=R/'blender';OUT.mkdir(exist_ok=True)
a=json.loads((D/'atlas.json').read_text());t=json.loads((D/'terrain.json').read_text());EX=12
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=True
# Cycles provides consistent transparent-layer rendering for stills and optional offline animation.
collections={}
def collection(name):
 c=bpy.data.collections.new(name);scene.collection.children.link(c);collections[name]=c;return c
for name in ['00 Terrain','10 Metallurgical seams','20 Thermal seams','30 Mixed-use horizons','40 Unclassified formations','50 Mines and destinations','60 Schematic supply links','70 Recorded boreholes','80 Labels','90 Camera and lighting']:collection(name)
def link(obj,group):
 for c in list(obj.users_collection):c.objects.unlink(obj)
 collections[group].objects.link(obj);return obj
def xyz(p):return (p[0],-p[2],p[1]*EX)
def geo(lon,lat,h=0):return ((lon-151.15)*111.32*math.cos(math.radians(-33.55)),(lat+33.55)*111.32,h/1000*EX)
def rgb(h):return tuple(int(h[i:i+2],16)/255 for i in (1,3,5))
def material(name,color,alpha=1,emission=.15):
 m=bpy.data.materials.new(name);m.diffuse_color=(*rgb(color),alpha);m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*rgb(color),1);bs.inputs['Roughness'].default_value=.72;bs.inputs['Alpha'].default_value=alpha;bs.inputs['Emission Color'].default_value=(*rgb(color),1);bs.inputs['Emission Strength'].default_value=emission
 return m
def mesh(name,verts,faces,group,mat):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);collections[group].objects.link(o);o.data.materials.append(mat);return o
def line(name,points,group,mat,radius=.05):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=radius;c.bevel_resolution=1;s=c.splines.new('POLY');s.points.add(len(points)-1)
 for p,v in zip(s.points,points):p.co=(*v,1)
 o=bpy.data.objects.new(name,c);collections[group].objects.link(o);o.data.materials.append(mat);return o
w,s,e,n=t['bounds'];nx=t['nx'];ny=t['ny'];vs=[];cs=[];fs=[]
for j in range(ny):
 for i in range(nx):
  h=t['elevations'][j*nx+i];vs.append(geo(w+(e-w)*i/(nx-1),n-(n-s)*j/(ny-1),max(0,h)))
  cs.append(rgb('#173d52' if h<=0 else '#687d70' if h<20 else '#4f7669' if h<150 else '#4e705f' if h<400 else '#72836a' if h<700 else '#acaf92'))
for j in range(ny-1):
 for i in range(nx-1):
  q=j*nx+i;fs.extend([(q,q+1,q+nx),(q+1,q+nx+1,q+nx)])
mat=material('Terrain · 28% opacity','#65806f',.28,0);bs=mat.node_tree.nodes.get('Principled BSDF');attr=mat.node_tree.nodes.new('ShaderNodeAttribute');attr.attribute_name='TerrainColor';mat.node_tree.links.new(attr.outputs['Color'],bs.inputs['Base Color']);land=mesh('NSW elevation · Mapzen Terrarium z9',vs,fs,'00 Terrain',mat);col=land.data.color_attributes.new(name='TerrainColor',type='FLOAT_COLOR',domain='POINT')
for dst,c in zip(col.data,cs):dst.color=(*c,1)
land['source']='https://www.mapzen.com/rights/';land['vertical_exaggeration']=EX
# The local tile replaces regional terrain in the same geographic rectangle.
lt=json.loads((D/'illawarra-terrain.json').read_text());surface=json.loads((D/'surface-geology.json').read_text())
lw,ls,le,ln=lt['bounds'];lx,ly=lt['nx'],lt['ny']
node=mat.node_tree.nodes;links=mat.node_tree.links
position=node.new('ShaderNodeNewGeometry');axes=node.new('ShaderNodeSeparateXYZ');links.new(position.outputs['Position'],axes.inputs[0])
conditions=[]
for axis,op,value in [('X','GREATER_THAN',geo(lw,ls)[0]),('X','LESS_THAN',geo(le,ln)[0]),('Y','GREATER_THAN',geo(lw,ls)[1]),('Y','LESS_THAN',geo(le,ln)[1])]:
 test=node.new('ShaderNodeMath');test.operation=op;links.new(axes.outputs[axis],test.inputs[0]);test.inputs[1].default_value=value;conditions.append(test.outputs[0])
inside=conditions[0]
for condition in conditions[1:]:
 multiply=node.new('ShaderNodeMath');multiply.operation='MULTIPLY';links.new(inside,multiply.inputs[0]);links.new(condition,multiply.inputs[1]);inside=multiply.outputs[0]
outside=node.new('ShaderNodeMath');outside.operation='SUBTRACT';outside.inputs[0].default_value=1;links.new(inside,outside.inputs[1])
alpha=node.new('ShaderNodeMath');alpha.operation='MULTIPLY';alpha.inputs[1].default_value=.28;links.new(outside.outputs[0],alpha.inputs[0]);links.new(alpha.outputs[0],bs.inputs['Alpha'])
vs=[geo(lw+(le-lw)*i/(lx-1),ln-(ln-ls)*j/(ly-1),max(0,lt['elevations'][j*lx+i])) for j in range(ly) for i in range(lx)]
fs=[]
for j in range(ly-1):
 for i in range(lx-1):
  q=j*lx+i;fs.extend([(q,q+1,q+lx),(q+1,q+lx+1,q+lx)])
lm=material('Illawarra mapped terrain · opacity .28','#65806f',.28,0)
local=mesh('Illawarra detailed terrain · GSNSW surface geology',vs,fs,'00 Terrain',lm)
uv=local.data.uv_layers.new(name='Geographic map UV')
uv_values=[value for loop in local.data.loops for value in (loop.vertex_index%lx/(lx-1),1-(loop.vertex_index//lx)/(ly-1))]
uv.data.foreach_set('uv',uv_values)
print('LOCAL_TERRAIN_READY',flush=True)
image=bpy.data.images.load(str(D/'illawarra-surface.png'));image.pack()
tex=lm.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
mix=lm.node_tree.nodes.new('ShaderNodeMixRGB');mix.blend_type='MIX';mix.inputs[1].default_value=(*rgb('#65806f'),1)
lm.node_tree.links.new(tex.outputs['Alpha'],mix.inputs[0]);lm.node_tree.links.new(tex.outputs['Color'],mix.inputs[2]);lm.node_tree.links.new(mix.outputs[0],lm.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
local['source']='GSNSW NSW Seamless Geology / CC BY 4.0; Mapzen Terrarium z11'
local['evidence']='Published surface interpretation; not an underground seam constraint'
local['vertical_exaggeration']=EX;local['snapshot']=surface['date'];local['bounds']=lt['bounds']
collection('05 Published surface fault traces')
def local_height(lon,lat):
 x=(lon-lw)/(le-lw)*(lx-1);y=(ln-lat)/(ln-ls)*(ly-1);i=min(lx-2,int(x));j=min(ly-2,int(y));u=x-i;v=y-j;h=lt['elevations']
 return max(0,h[j*lx+i]*(1-u)*(1-v)+h[j*lx+i+1]*u*(1-v)+h[(j+1)*lx+i]*(1-u)*v+h[(j+1)*lx+i+1]*u*v)
points=[];edges=[]
for f in surface['faults']:
 lines=[f['geometry']['coordinates']] if f['geometry']['type']=='LineString' else f['geometry']['coordinates']
 for line_points in lines:
  for start,end in zip(line_points,line_points[1:]):
   if not all(lw<=p[0]<=le and ls<=p[1]<=ln for p in [start,end]):continue
   edge=len(points);points.extend(geo(p[0],p[1],local_height(p[0],p[1])+5) for p in [start,end]);edges.append((edge,edge+1))
me=bpy.data.meshes.new('Published fault trace segments');me.from_pydata(points,edges,[]);faults=bpy.data.objects.new('GSNSW Illawarra fault traces · surface only',me);collections['05 Published surface fault traces'].objects.link(faults)
faults['evidence']='Published interpreted traces draped 5 m above terrain for visibility. No inferred subsurface dip or throw.'
faults['source']='https://gs-seamless.geoscience.nsw.gov.au/geoserver/ows';faults['source_records']=len(surface['faults'])
collections['05 Published surface fault traces'].hide_render=True;collections['05 Published surface fault traces'].hide_viewport=True
print('FAULTS_READY',len(edges),flush=True)
metadata=bpy.data.texts.new('GSNSW surface mapping metadata.json');metadata.from_string(json.dumps(surface,ensure_ascii=False,indent=2))

for l in a['seams']:
 p=l['mesh']['positions'];ii=l['mesh']['indices'];vs=[xyz(p[i:i+3]) for i in range(0,len(p),3)];fs=[tuple(reversed(ii[i:i+3])) for i in range(0,len(ii),3)];group='30 Mixed-use horizons' if len(l['tags'])>1 else '10 Metallurgical seams' if l['tags']==['met'] else '20 Thermal seams' if l['tags']==['thermal'] else '40 Unclassified formations';o=mesh(l['name'],vs,fs,group,material(l['name'],l['color'],.9,.25));o['atlas_id']=l['id'];o['geometry']='CONCEPTUAL — not fitted to boreholes';o['source_ids']=','.join(l['sources']);o['reference']=json.dumps(l['reference']);o['coal_use']=','.join(l['tags']);o['footprint']='Illustrative model window, not resource boundary'
 # Solidify a very thin visual ribbon; diagram thickness is not physical coal thickness.
 mod=o.modifiers.new('Visibility ribbon — not true thickness','SOLIDIFY');mod.thickness=.025
colors={'met':'#f7b967','thermal':'#58d8de','unknown':'#9da8c7'}
def colortags(tags):return '#dfa4ef' if len(tags)>1 else colors[tags[0]]
features={}
for f in a['mines']+a['destinations']:
 pos=Vector(xyz(f['position']));pos.z+=.7;bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=.5,location=pos);o=link(bpy.context.object,'50 Mines and destinations');o.name=f['name'];o.data.materials.append(material(f['name']+' marker',colortags(f['tags']),1,.6));o['atlas_id']=f['id'];o['description']=f['description'];o['location_evidence']=f['confidence'];features[f['id']]=o
for r in a['routes']:
 p=features[r['fromId']].location;q=features[r['toId']].location;mid=(p+q)/2;mid.z+=min(14,(p-q).length*.16+2);pts=[]
 for i in range(61):
  u=i/60;pts.append((1-u)**2*p+2*(1-u)*u*mid+u*u*q)
 o=line(r['id'],pts,'60 Schematic supply links',material(r['id'],colortags(r['tags']),1,.4),.045);o['geometry']=r['geometryNote'];o['mode']=r['mode']
# Recorded total-depth sticks; not seam intercepts or mapped borehole deviation.
bores=[]
for b in a['bores']:
 if b['depth'] and b['depth']>0:
  p=xyz(b['position']);q=(p[0],p[1],p[2]-b['depth']/1000*EX);bores.extend([p,q])
if bores:
 me=bpy.data.meshes.new('Borehole traces');me.from_pydata(bores,[(i,i+1) for i in range(0,len(bores),2)],[]);o=bpy.data.objects.new('Spatially thinned recorded boreholes',me);collections['70 Recorded boreholes'].objects.link(o);o['note']='Straight schematic traces of recorded total depth. Not used to construct seams.'
collections['70 Recorded boreholes'].hide_render=True;collections['70 Recorded boreholes'].hide_viewport=True
# Published compiled coal-top picks. Their MD-derived AHD values are not deviation corrected.
pick_data=json.loads((D/'borehole-picks.json').read_text())
collection('75 Compiled coal top picks · uncorrected')
pick_names={'Bulli Coal','Balgownie Coal','Balgownie Coal Member','Wongawilli Coal','Wallarah Coal','Great Northern Coal','Fassifern Coal'}
vs=[];fs=[];pick_records=[]
for bore in pick_data['bores']:
 if re.search('horizontal|deviated|directional|inclined',bore['comment'],re.I):continue
 for pick in bore['picks']:
  if not pick['preferredTop'] or pick['unit'] not in pick_names or pick['topAHD'] is None:continue
  point=geo(bore['lon'],bore['lat'],pick['topAHD']);q=len(vs);radius=.16
  vs.extend((point[0]+dx*radius,point[1]+dy*radius,point[2]+dz*radius) for dx,dy,dz in [(1,0,0),(-1,0,0),(0,1,0),(0,-1,0),(0,0,1),(0,0,-1)])
  fs.extend(tuple(q+i for i in face) for face in [(0,2,4),(2,1,4),(1,3,4),(3,0,4),(2,0,5),(1,2,5),(3,1,5),(0,3,5)])
  pick_records.append({'borehole':bore['id'],'pick':pick['id'],'name':bore['name'],'unit':pick['unit'],'position':point})
pick_object=mesh('ABSUC reported coal tops · inspect metadata before use',vs,fs,'75 Compiled coal top picks · uncorrected',material('Compiled picks','#b9e7de',1,.3))
pick_object['evidence']='Compiled interpretations, not independently verified. AHD derived from MD, no borehole deviation correction. Known horizontal/deviated collars excluded. Model datum not reconciled to AHD.'
pick_object['source']='https://doi.org/10.26186/149324';pick_object['count']=len(pick_records)
attribute=pick_object.data.attributes.new(name='source_pick_index',type='INT',domain='POINT');attribute.data.foreach_set('value',[i for i in range(len(pick_records)) for _ in range(6)])
collections['75 Compiled coal top picks · uncorrected'].hide_viewport=True;collections['75 Compiled coal top picks · uncorrected'].hide_render=True
bpy.data.texts.new('ABSUC regional borehole evidence.json').from_string(json.dumps(pick_data,ensure_ascii=False,indent=2))
bpy.data.texts.new('ABSUC pick marker lookup.json').from_string(json.dumps(pick_records,indent=2))
# Camera and tour keyframes.
bpy.ops.object.camera_add();cam=link(bpy.context.object,'90 Camera and lighting');cam.name='Flythrough camera';scene.camera=cam;cam.data.lens=35;cam.data.clip_end=1800;cam.data.clip_start=.1
scene.render.resolution_x=1280;scene.render.resolution_y=720;scene.render.resolution_percentage=100;scene.render.fps=12;scene.frame_start=1;scene.frame_end=1800
for i,c in enumerate(a['chapters']):
 target=Vector(geo(c['lon'],c['lat'],-150));cam.location=target+Vector((c['distance']*.75,-c['distance']*.6,c['elevation']));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();frame=1+round(i*(scene.frame_end-1)/4);cam.keyframe_insert('location',frame=frame);cam.keyframe_insert('rotation_euler',frame=frame);scene.timeline_markers.new(c['name'],frame=frame)
white=material('Labels','#e9f4f4',1,1)
def text(name,body,pos,size,mat=white,parent=None):
 cu=bpy.data.curves.new(name,'FONT');cu.body=body;cu.size=size;cu.extrude=0;ob=bpy.data.objects.new(name,cu);collections['80 Labels'].objects.link(ob);ob.location=pos;ob.data.materials.append(mat)
 if parent:ob.parent=parent
 return ob
for p in a['places']:
 v=Vector(xyz(p['position']));v.z+=1.6;o=text(p['name'],p['name'],v,.8 if p['major'] else .5);c=o.constraints.new('TRACK_TO');c.target=cam;c.track_axis='TRACK_Z';c.up_axis='UP_Y'
# Heads-up typography follows the camera.
text('Title','BENEATH THE COAST  /  NSW COAL',(-.91,.425,-2),.042,parent=cam)
text('Evidence notice','CONCEPTUAL SEAMS  |  Vertical scale 12x  |  Not a resource model',(-.91,-.44,-2),.018,parent=cam)
text('Credits','Terrain: Mapzen / SRTM   |   Mine points: GSNSW   |   Links: schematic',(-.91,-.48,-2),.014,parent=cam)
for i,c in enumerate(a['chapters']):
 o=text('Chapter '+c['name'],f"0{i+1}  {c['name'].upper()}",(-.91,.36,-2),.032,parent=cam)
 start=1 if i==0 else int((i-.5)/4*1799)+1;end=1800 if i==4 else int((i+.5)/4*1799)
 for fr,hide in [(1,True),(max(1,start-1),True),(start,False),(end,False),(end+1,True)]:o.hide_render=hide;o.keyframe_insert('hide_render',frame=fr)
world=bpy.data.worlds.new('Deep blue world');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.035,.065,.09,1);world.node_tree.nodes['Background'].inputs[1].default_value=.65;scene.world=world
bpy.ops.object.light_add(type='SUN',location=(50,-60,100));sun=link(bpy.context.object,'90 Camera and lighting');sun.data.energy=2.5;sun.rotation_euler=(.4,-.5,-.5);sun.data.angle=.3
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
scene['MODEL_WARNING']=a['modelNotice'];scene['VERTICAL_EXAGGERATION']=EX;scene['DATA_DATE']=a['date']
readme=bpy.data.texts.new('READ ME — atlas evidence and controls');readme.write('NSW COAL ATLAS\n\n'+a['modelNotice']+'\n\nCollections separate met, thermal, mixed-use and unknown layers. Toggle collections in the Outliner. Mixed-use layers should be included under either met or thermal. Frame 1–1800 is the 150-second tour at 12fps.\n\nGround opacity: Terrain material Principled BSDF Alpha (default .28). Ribbon modifier is visibility-only, not physical thickness. Vertical scale 12x was baked consistently into both terrain and depth. All displayed footprints and subsurface dip are illustrative.\n\nThe browser version provides the independent use filters, cross-section slider, layer selection and linked source panels.\n\nSOURCES\n'+'\n\n'.join(x['title']+'\n'+x['url']+'\n'+x['note'] for x in a['sources']))
readme.write('\n\nVERSION 2: Illawarra detailed terrain has 66,049 vertices and a packed GSNSW map texture. The regional terrain material masks this tile to avoid overlapping surfaces. Adjust its opacity with the final Multiply node and the local terrain Principled Alpha together. Published fault traces are in a separate initially hidden collection; enable it in the Outliner for inspection. Source feature metadata is embedded as a second text block. Coal geometry remains illustrative and unchanged. The browser adds linked sections, a stratigraphic field guide and a separate statewide inventory; out-of-window mines are not added to the bounded 3D scene.\n')
readme.write('\nVERSION 2.1: ABSUC 2024 v2 adds 569 borehole records and published formation picks as an embedded evidence table. The initially hidden collection 75 contains compiled coal-top markers at reported AHD elevations (12x display scale). No deviation correction or surface fitting has been done; known horizontal/deviated holes are excluded. Marker radius is a symbol, not uncertainty. Use the source_pick_index vertex attribute with the marker lookup text to resolve original IDs. The browser provides measured-depth logs and projected section comparison. Source: Vizy and Rollet (2024), Geoscience Australia, https://doi.org/10.26186/149324, CC BY 4.0.\n')
scene['ATLAS_VERSION']='2.1.0'
scene.frame_set(1)
for ar in bpy.context.screen.areas:
 if ar.type=='VIEW_3D':
  ar.spaces.active.region_3d.view_perspective='CAMERA';ar.spaces.active.shading.type='MATERIAL'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'NSW-Coal-Atlas.blend'),compress=True)
print('BLENDER_SCENE_READY',len(bpy.data.objects),'objects',flush=True)
if '--render-stills' in sys.argv:
 scene.render.resolution_percentage=75
 for fr,name in [(1,'illawarra'),(451,'sydney'),(901,'lake-macquarie'),(1350,'newcastle'),(1800,'hunter')]:
  scene.frame_set(fr);scene.render.filepath=str(R/'evidence'/('blender-'+name+'.png'));bpy.ops.render.render(write_still=True)
if '--render-animation' in sys.argv:
 scene.render.resolution_percentage=75;scene.cycles.samples=8;scene.render.filepath=str(OUT/'frames/frame-');bpy.ops.render.render(animation=True)
