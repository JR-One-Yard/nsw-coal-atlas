import bpy,json,hashlib,math
from pathlib import Path
R=Path(__file__).resolve().parents[1];a=json.loads((R/'dist/data/atlas.json').read_text());scene=bpy.context.scene;checks=[]
def check(name,ok):
 assert ok,name
 checks.append({'name':name,'passed':True})
check('Blender file reopens with a camera and 150-second timeline',scene.camera is not None and scene.frame_end==1800 and scene.render.fps==12)
check('All 8 browser geological layers exist as editable meshes',all(s['name'] in bpy.data.objects for s in a['seams']))
for s in a['seams']:
 o=bpy.data.objects[s['name']];p=s['mesh']['positions'];check(s['name']+' vertices match browser geometry at 12x vertical scale',len(o.data.vertices)==len(p)//3 and all(abs(o.data.vertices[i].co.x-p[i*3])<.001 and abs(o.data.vertices[i].co.y+p[i*3+2])<.001 and abs(o.data.vertices[i].co.z-p[i*3+1]*12)<.001 for i in range(len(o.data.vertices))))
check('All 16 mine records and 5 destinations exist',all(f['name'] in bpy.data.objects for f in a['mines']+a['destinations']))
check('Sources and limitations are embedded in the Blender file',len(bpy.data.texts['READ ME — atlas evidence and controls'].as_string())>3000)
check('Each tour chapter has a timeline marker',len(scene.timeline_markers)==5)
positions=[]
for fr in [1,451,901,1350,1800]:scene.frame_set(fr);positions.append(list(scene.camera.location))
check('Camera moves north from Illawarra to Hunter',positions[-1][1]>positions[0][1])
check('Every chapter has a nonempty rendered evidence image',all((R/'evidence'/('blender-'+n+'.png')).stat().st_size>10000 for n in ['illawarra','sydney','lake-macquarie','newcastle','hunter']))
lt=json.loads((R/'dist/data/illawarra-terrain.json').read_text())
local=bpy.data.objects['Illawarra detailed terrain · GSNSW surface geology']
check('Detailed local terrain preserves all browser elevation samples',len(local.data.vertices)==lt['nx']*lt['ny'] and all(abs(v.co.z-max(0,lt['elevations'][i])/1000*12)<.001 for i,v in enumerate(local.data.vertices)))
check('Published geological map is packed in the editable file',any(i.packed_file and i.name.startswith('illawarra-surface') for i in bpy.data.images))
check('Surface fault traces preserve source provenance and remain distinct from seam models',bpy.data.objects['GSNSW Illawarra fault traces · surface only']['source_records']==1884 and bpy.data.collections['05 Published surface fault traces'].hide_render)
check('Published feature metadata is embedded',len(json.loads(bpy.data.texts['GSNSW surface mapping metadata.json'].as_string())['units'])==2004)
pick_data=json.loads(bpy.data.texts['ABSUC regional borehole evidence.json'].as_string())
lookup=json.loads(bpy.data.texts['ABSUC pick marker lookup.json'].as_string());marker=bpy.data.objects['ABSUC reported coal tops · inspect metadata before use']
check('Compiled coal evidence retains original IDs and matching marker centres with explicit limitations',len(pick_data['bores'])==569 and len(lookup)==marker['count'] and bpy.data.collections['75 Compiled coal top picks · uncorrected'].hide_render and all(abs(sum(marker.data.vertices[i*6+j].co.z for j in range(6))/6-r['position'][2])<.001 for i,r in enumerate(lookup)))
(R/'evidence/blender-tests.json').write_text(json.dumps({'date':a['date'],'version':bpy.app.version_string,'objects':len(bpy.data.objects),'checks':checks,'cameraPositions':positions,'blendSHA256':hashlib.sha256((R/'blender/NSW-Coal-Atlas.blend').read_bytes()).hexdigest()},indent=2))
print('BLENDER_CHECKS_PASSED',len(checks))
