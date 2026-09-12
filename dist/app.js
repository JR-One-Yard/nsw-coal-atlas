import {geologicalProfile} from './mine-geology.js';
import {depthQuality} from './bore-quality.js';
import * as THREE from 'three';
import {initGeology} from './geology.js';
import {openPanel,closePanels,showPage} from './navigation.js';
import {terrainHeight} from './geology-model.js';
import {initIndustry} from './industry.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {DEFAULTS,DURATION,matchesTags,visibleSeams,visibleMines,visibleRoutes,chapterAt,formatTime,colourFor,geo,stateFromControls} from './model.js';
const $=id=>document.getElementById(id);
let data,terrain,renderer,scene,camera,controls,state={...DEFAULTS},selected=null,playing=false,progress=0,currentChapter=-1,narration=false,last=performance.now(),frameCount=0;
let geology,industry,inventory,depositRegister,lastRouteScale=null;
let terrainMesh,sea,boreGroup,clipPlane,transition=null,tourCamera,tourTarget;
const seamObjects=new Map(),featureObjects=new Map(),routeObjects=new Map(),mapLabels=[],clickables=[];
const stage=$('stage'),view=$('viewport');
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const srcLinks=ids=>ids.map(id=>{const s=data.sources.find(x=>x.id===id);return s?`<li><a href="${escape(s.url)}" target="_blank" rel="noopener">${escape(s.title)}</a></li>`:''}).join('');
function makeGeo(positions,indices){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));if(indices)g.setIndex(indices);g.computeVertexNormals();return g;}
function boundaryGeometry(g){const edges=new Map(),ix=g.index.array,p=g.attributes.position.array;for(let i=0;i<ix.length;i+=3){for(const [a,b]of [[ix[i],ix[i+1]],[ix[i+1],ix[i+2]],[ix[i+2],ix[i]]]){const key=a<b?a+','+b:b+','+a;edges.set(key,(edges.get(key)||0)+1);}}const out=[];for(const [key,count]of edges)if(count===1)for(const i of key.split(',').map(Number))out.push(p[i*3],p[i*3+1],p[i*3+2]);return new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(out,3));}
function initScene(){
 scene=new THREE.Scene();scene.background=new THREE.Color('#0b1e2a');scene.fog=new THREE.FogExp2('#0b1e2a',.00035);
 camera=new THREE.PerspectiveCamera(43,1,.1,4000);
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setClearColor('#0b1e2a');renderer.localClippingEnabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;view.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','3D terrain, coal seams and mine markers. The feature selector provides an alternative to clicking the scene.');
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=!matchMedia('(prefers-reduced-motion: reduce)').matches;controls.dampingFactor=.08;controls.minDistance=5;controls.maxDistance=1800;controls.maxPolarAngle=Math.PI*.78;controls.addEventListener('start',()=>{pause();transition=null;});
 scene.add(new THREE.HemisphereLight('#d5edff','#475366',1.25));const key=new THREE.DirectionalLight('#fff1d2',2);key.position.set(80,130,-80);scene.add(key);const fill=new THREE.DirectionalLight('#66bdde',1);fill.position.set(-60,35,90);scene.add(fill);
 clipPlane=new THREE.Plane(new THREE.Vector3(-1,0,0),1000);
 const [w,s,e,n]=terrain.bounds,nx=terrain.nx,ny=terrain.ny,positions=[],colours=[],indices=[];
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
  const h=terrain.elevations[j*nx+i],p=geo(w+(e-w)*i/(nx-1),n-(n-s)*j/(ny-1),Math.max(0,h));positions.push(...p);
  const c=new THREE.Color(h<=0?'#143d53':h<20?'#657b70':h<150?'#4c7169':h<400?'#44695e':h<700?'#618071':'#a5ad91');
  if(h>0){const nxh=terrain.elevations[j*nx+Math.min(nx-1,i+1)]-h;c.multiplyScalar(THREE.MathUtils.clamp(1-nxh/500,.7,1.25));}colours.push(c.r,c.g,c.b);
 }
 for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){const a=j*nx+i;indices.push(a,a+nx,a+1,a+1,a+nx,a+nx+1);}
 const tg=makeGeo(positions,indices);tg.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));terrainMesh=new THREE.Mesh(tg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false,clippingPlanes:[clipPlane]}));terrainMesh.renderOrder=3;scene.add(terrainMesh);
 const a=geo(w,s),b=geo(e,n);sea=new THREE.Mesh(new THREE.PlaneGeometry(b[0]-a[0],a[2]-b[2]),new THREE.MeshBasicMaterial({color:'#2b6581',transparent:true,opacity:.055,side:THREE.DoubleSide,depthWrite:false}));sea.rotation.x=-Math.PI/2;sea.position.set((a[0]+b[0])/2,-.03,(a[2]+b[2])/2);scene.add(sea);
 const grid=new THREE.GridHelper(320,32,'#305368','#24414e');grid.position.y=-21;grid.material.transparent=true;grid.material.opacity=.14;scene.add(grid);
 for(const s of data.seams){
  const g=makeGeo(s.mesh.positions,s.mesh.indices),mat=new THREE.MeshStandardMaterial({color:s.color,emissive:s.color,emissiveIntensity:.16,roughness:.7,metalness:.12,side:THREE.DoubleSide,transparent:true,opacity:.84,clippingPlanes:[clipPlane]});const mesh=new THREE.Mesh(g,mat);mesh.userData={kind:'seam',id:s.id};mesh.renderOrder=1;scene.add(mesh);clickables.push(mesh);
  const edges=new THREE.LineSegments(boundaryGeometry(g),new THREE.LineBasicMaterial({color:s.color,transparent:true,opacity:.6,clippingPlanes:[clipPlane]}));scene.add(edges);
  // Sparse grid over each sheet reveals dip; same elevation model, no invented faults.
  const wire=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:s.color,wireframe:true,transparent:true,opacity:.022,clippingPlanes:[clipPlane]}));scene.add(wire);
  seamObjects.set(s.id,{mesh,edges,wire,data:s});
 }
 const sphere=new THREE.SphereGeometry(.55,14,10),diamond=new THREE.OctahedronGeometry(.8),ringGeo=new THREE.RingGeometry(.9,1.06,32);
 for(const f of [...data.mines,...data.destinations]){
  const col=colourFor(f.tags),g=new THREE.Group();const mesh=new THREE.Mesh(f.kind==='mine'||f.kind==='historic'?sphere:diamond,new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:.65,roughness:.5,fog:false}));mesh.userData={kind:'feature',id:f.id};g.add(mesh);clickables.push(mesh);
  const ring=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:col,side:THREE.DoubleSide,transparent:true,opacity:.6,fog:false}));ring.rotation.x=-Math.PI/2;ring.position.y=-.3;g.add(ring);scene.add(g);
  featureObjects.set(f.id,{group:g,mesh,ring,data:f});
 }
 for(const r of data.routes){const group=new THREE.Group();scene.add(group);routeObjects.set(r.id,{group,data:r,curve:null,dot:null});}
 const borePositions=[],boreIds=[];for(const b of data.bores){if(!depthQuality(b).eligible)continue;const p=b.position;borePositions.push(...p,p[0],p[1]-b.depth/1000,p[2]);boreIds.push(b.id);}
 boreGroup=new THREE.LineSegments(makeGeo(borePositions),new THREE.LineBasicMaterial({color:'#95b6d0',transparent:true,opacity:.22,depthWrite:false,clippingPlanes:[clipPlane]}));boreGroup.userData.ids=boreIds;scene.add(boreGroup);
 for(const p of [...data.places,...['Western','Gunnedah'].map(region=>{const records=inventory.records.filter(r=>r.region===region);return {name:region+' mines',major:true,position:geo(records.reduce((sum,r)=>sum+r.lon,0)/records.length,records.reduce((sum,r)=>sum+r.lat,0)/records.length),regionLabel:true};}),...data.mines.map(m=>({...m,mine:true}))]){const el=document.createElement('span');el.className='map-label'+(p.major?' city':'');el.textContent=p.name;$('labels').append(el);mapLabels.push({el,data:p});}
 new ResizeObserver(resize).observe(view);resize();
 let down=null;renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const rect=renderer.domElement.getBoundingClientRect(),pointer=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects(clickables).filter(h=>h.object.visible&&h.object.parent.visible&&h.point.x<=clipPlane.constant);if(geology?.handleSceneClick(e,ray))return;if(hits.length){select(hits[0].object.userData.id);focusFeature(hits[0].object.userData.id);return;}if(boreGroup.visible){ray.params.Line.threshold=.25;const hit=ray.intersectObject(boreGroup).find(h=>h.point.x<=clipPlane.constant);if(hit)inspectRegistryBore(boreGroup.userData.ids[Math.floor(hit.index/2)]);}});
 const targets=data.chapters.map(c=>new THREE.Vector3(...geo(c.lon,c.lat,-150)));const cameras=data.chapters.map((c,i)=>targets[i].clone().add(new THREE.Vector3(c.distance*.75,c.elevation,c.distance*.6)));tourCamera=new THREE.CatmullRomCurve3(cameras,false,'centripetal');tourTarget=new THREE.CatmullRomCurve3(targets,false,'centripetal');
}
function resize(){if(!renderer)return;const w=view.clientWidth,h=view.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
function rebuildRoutes(){if(lastRouteScale===state.exaggeration)return;lastRouteScale=state.exaggeration;for(const {group,data:r} of routeObjects.values()){while(group.children.length){const c=group.children[0];group.remove(c);c.geometry?.dispose();c.material?.dispose();}const a=featureObjects.get(r.fromId).group.position.clone(),b=featureObjects.get(r.toId).group.position.clone(),m=a.clone().lerp(b,.5);m.y+=Math.min(14,a.distanceTo(b)*.16+2);const curve=new THREE.QuadraticBezierCurve3(a,m,b),line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(60)),new THREE.LineDashedMaterial({color:colourFor(r.tags),transparent:true,opacity:.8,dashSize:1,gapSize:.55,clippingPlanes:[clipPlane]}));line.computeLineDistances();group.add(line);const dot=new THREE.Mesh(new THREE.SphereGeometry(.25,8,8),new THREE.MeshBasicMaterial({color:colourFor(r.tags),clippingPlanes:[clipPlane]}));group.add(dot);Object.assign(routeObjects.get(r.id),{curve,dot});}}
function update(){
 state=stateFromControls(document);terrainMesh.scale.y=state.exaggeration;terrainMesh.material.opacity=state.opacity/100;terrainMesh.material.depthWrite=state.opacity>=98;terrainMesh.visible=state.opacity>0;
 const [w,,e]=terrain.bounds;clipPlane.constant=state.slice===100?1000:geo(w+(e-w)*state.slice/100,-33.55)[0];
 const ss=new Set(visibleSeams(data,state).map(s=>s.id)),ms=new Set(visibleMines(data,state).map(s=>s.id)),rs=new Set(visibleRoutes(data,state).map(s=>s.id));
 for(const [id,o]of seamObjects){for(const key of ['mesh','edges','wire']){o[key].scale.y=state.exaggeration;o[key].visible=key!=='wire'&&ss.has(id);}o.mesh.material.emissiveIntensity=selected===id?.42:.16;o.mesh.material.opacity=selected&&selected!==id?.65:.84;}
 for(const [id,o]of featureObjects){const f=o.data;o.group.position.set(f.position[0],f.position[1]*state.exaggeration+.8,f.position[2]);o.group.visible=state.showMines&&matchesTags(f.tags,state)&&(f.kind==='mine'||f.kind==='historic'?ms.has(id):state.seam==='all'||data.routes.some(r=>r.toId===id&&rs.has(r.id)));o.group.visible=o.group.visible&&o.group.position.x<=clipPlane.constant;o.mesh.scale.setScalar(selected===id?1.65:1);}
 boreGroup.scale.y=state.exaggeration;boreGroup.visible=state.showBores;
 rebuildRoutes();for(const [id,r]of routeObjects){r.group.visible=state.showMines&&rs.has(id);}
 $('opacityValue').textContent=`${state.opacity}%`;$('exaggerationValue').textContent=`${state.exaggeration}×`;$('empty').hidden=ss.size>0;

 geology?.sync(state,selected);
}
function inspectRegistryBore(id){const b=data.bores.find(b=>b.id===id);if(!b)return;const q=depthQuality(b);$('strataPanel').hidden=true;$('detailBody').hidden=false;$('detailHeading').textContent='Borehole evidence';$('detailBody').innerHTML=`<h2>${escape(b.name)}</h2><p>${escape(b.program)} · ${escape(b.id)}</p><dl><dt>Reported drilling depth</dt><dd>${escape(b.depth??'Not supplied')} m</dd><dt>Quality</dt><dd>${escape(q.status)}</dd><dt>Drilling datum / trajectory</dt><dd>${escape(b.datum)} / ${escape(b.trajectory)}</dd></dl><p class="notice">${escape(q.reason)}</p><p>GSNSW coal drilling WFS · ${escape(b.sourceFeature)} · CC BY 4.0. Terrain is the display reference only.</p><p><a href="./data/borehole-quality.json">Correction ledger and original evidence</a> · <a href="https://minview.geoscience.nsw.gov.au/" target="_blank" rel="noopener">GSNSW MinView</a></p>`;openPanel('details');}
function select(id,open=true){const f=[...data.seams,...data.mines,...data.destinations].find(x=>x.id===id);if(!f)return false;if(open){$('strataPanel').hidden=true;$('detailBody').hidden=false;$('detailHeading').textContent='Details';if(state.seam!=='all'&&f.id!==state.seam&&!f.seams?.includes(state.seam))$('seamSelect').value='all';if(!f.mesh)$('showMines').checked=true;}selected=id;if(open)openPanel('details');$('featureSelect').value=id;
 const isSeam=!!f.mesh;let detail=`<h2>${escape(f.name)}</h2><div>${f.tags.map(t=>`<span class="tag">${t==='met'?'METALLURGICAL':t==='thermal'?'THERMAL':'UNCLASSIFIED'}</span>`).join('')}</div><p>${escape(f.description)}</p>`;
 if(isSeam){detail+=`<dl>${Object.entries(f.reference).map(([k,v])=>`<dt>${escape(k)}</dt><dd>${escape(v)}</dd>`).join('')}</dl><p class="notice"><strong>${escape(f.confidence)}</strong><br>${escape(f.geometryNote)}<br><br>${escape(f.classification)}</p>`;const mines=data.mines.filter(m=>m.seams.includes(id));if(mines.length)detail+='<h3>Connected mines</h3>'+mines.map(m=>`<button data-feature="${m.id}">${escape(m.name)} ↗</button>`).join(' ');}
 else{detail+=`<dl><dt>Location</dt><dd>${f.lat.toFixed(4)}°, ${f.lon.toFixed(4)}°</dd><dt>Evidence</dt><dd>${escape(f.confidence)}</dd>${f.method?`<dt>Method</dt><dd>${escape(f.method)}</dd>`:''}</dl>${f.coverage?`<p class="micro">${escape(f.coverage)}</p>`:''}${f.status?`<p class="micro">${escape(f.status)}</p>`:''}`;const routes=data.routes.filter(r=>r.fromId===id||r.toId===id);if(routes.length){detail+='<h3>Where the coal goes</h3>'+routes.map(r=>{const a=data.mines.find(m=>m.id===r.fromId),b=data.destinations.find(d=>d.id===r.toId);return `<p class="micro">${escape(a.name)} → ${escape(b.name)}<br>${escape(r.mode)}</p>`;}).join('')+'<p class="micro">Schematic connections.</p>' ;}}
 detail+=geologicalProfile(depositRegister.records.find(r=>r.id===id));
 const neighbours=data.mines.filter(m=>m.id!==id&&m.lon===f.lon&&m.lat===f.lat);if(neighbours.length)detail+='<h3>At the same registry location</h3>'+neighbours.map(m=>`<button data-feature="${m.id}">${escape(m.name)}</button>`).join('');
 if(inventory.records.some(r=>r.id===id))detail+='<button id="fullMineProfile" class="primary">Full mine profile ↗</button>';
 detail+=`<details><summary>Source evidence</summary><ul>${srcLinks(f.sources)}</ul></details>`;$('detailBody').innerHTML=detail;if($('fullMineProfile'))$('fullMineProfile').onclick=()=>industry.show(id);$('detailBody').querySelectorAll('[data-feature]').forEach(b=>b.onclick=()=>select(b.dataset.feature));update();return true;}
function chapter(index,move=true){
 if(!Number.isInteger(index)||index<0||index>=data.chapters.length)return;
 const c=data.chapters[index];currentChapter=index;$('regionSelect').value=String(index);
 if(move){pause();const target=new THREE.Vector3(...geo(c.lon,c.lat,-150)),fit=Math.max(1,Math.min(2.2,1.4/camera.aspect));transition={start:performance.now(),from:camera.position.clone(),to:target.clone().add(new THREE.Vector3(c.distance*.75,c.elevation,c.distance*.6).multiplyScalar(fit)),targetFrom:controls.target.clone(),targetTo:target};}
 closePanels();select(c.seam,false);geology?.onChapter(index);closePanels(false);
}
const regionCopy=[
 'The Bulli and Wongawilli seams lie beneath the Illawarra escarpment. Southern mines supply coal for steelmaking.',
 'Coal-bearing rocks lie beneath Sydney’s sandstone. At Birchgrove, a historical shaft reached 880 metres. The pale sheet is an illustrative formation envelope, not a mapped seam.',
 'Wallarah, Great Northern and Fassifern form the sequence shown at Myuna. Select Myuna to read about its documented connection to Eraring power station.',
 'The Newcastle Coal Measures extend beneath the coastal coalfield. Borehole logs retain reported formation depths and their sources; the coloured surfaces remain illustrative.',
 'Mount Thorley Warkworth produces thermal and metallurgical coal. The Hunter surface represents a composite coal-bearing horizon, not a mine resource model.'
];
function regionNotes(){if($('regionSelect').value==='all'){$('strataPanel').hidden=true;$('detailBody').hidden=false;$('detailHeading').textContent='Sydney Basin';$('detailBody').innerHTML='<h3>All NSW mine locations</h3><p>All 35 registry mines are mapped, plus historical Birchgrove. The five coalfield tour views cover the coastal terrain model; Western and Gunnedah mine locations extend beyond it.</p><p>The underground surfaces are illustrative. They do not form a continuous, verified seam model.</p>';openPanel('details');return;}const c=data.chapters[currentChapter];$('strataPanel').hidden=true;$('detailBody').hidden=false;$('detailHeading').textContent=c.name;$('detailBody').innerHTML=`<h3>${escape(c.title)}</h3><p>${escape(regionCopy[currentChapter])}</p><button id="regionSeam">Read about ${escape(data.seams.find(s=>s.id===c.seam).name)}</button>`;$('regionSeam').onclick=()=>select(c.seam);openPanel('details');}
function setCamera(target,offset){pause();transition=null;controls.target.copy(target);camera.position.copy(target.clone().add(offset));controls.update();}
function focusFeature(id){const f=[...data.seams,...data.mines,...data.destinations].find(x=>x.id===id);if(!f)return;pause();const p=f.center||f.position,target=new THREE.Vector3(p[0],p[1]*state.exaggeration,p[2]),d=f.mesh?52:25;transition={start:performance.now(),from:camera.position.clone(),to:target.clone().add(new THREE.Vector3(d*.75,d*.55,d*.6)),targetFrom:controls.target.clone(),targetTo:target};}
function overview(){pause();closePanels();$('regionSelect').value='all';$('seamSelect').value='all';$('showMines').checked=true;update();
 const points=data.mines.map(f=>new THREE.Vector3(f.position[0],f.position[1]*state.exaggeration,f.position[2])),box=new THREE.Box3().setFromPoints(points),target=box.getCenter(new THREE.Vector3());
 const direction=new THREE.Vector3(.2,.9,.5).normalize(),right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right),tanY=Math.tan(camera.fov*Math.PI/360),tanX=tanY*camera.aspect;
 const distance=Math.max(...points.map(p=>{const v=p.clone().sub(target);return v.dot(direction)+Math.max(Math.abs(v.dot(right))/tanX,Math.abs(v.dot(up))/tanY)*1.2;}))+25;
 transition={start:performance.now(),from:camera.position.clone(),to:target.clone().add(direction.multiplyScalar(distance)),targetFrom:controls.target.clone(),targetTo:target};currentChapter=-1;selected=null;update();}

function pause(){playing=false;}
function seek(v){pause();transition=null;progress=Math.max(0,Math.min(1,v));camera.position.copy(tourCamera.getPoint(progress));controls.target.copy(tourTarget.getPoint(progress));chapter(Math.min(4,Math.round(progress*4)),false);}
function reset(){geology?.reset();for(const [k,v]of Object.entries(DEFAULTS)){const e=$(k==='seam'?'seamSelect':k);if(e){if(typeof v==='boolean')e.checked=v;else e.value=v;}}selected=null;update();overview();}
function setupUI(){
 $('regionSelect').innerHTML=data.chapters.map((c,i)=>`<option value="${i}">${escape(c.name)}</option>`).join('')+'<option value="all">All NSW mines</option>';$('regionSelect').onchange=e=>e.target.value==='all'?overview():chapter(+e.target.value);
 $('seamSelect').innerHTML='<option value="all">All layers</option>'+data.seams.map(s=>`<option value="${s.id}">${escape(s.name)}</option>`).join('');$('featureSelect').innerHTML='<option value="">Choose a seam or mine…</option>'+[...data.seams,...data.mines,...data.destinations].map(f=>`<option value="${f.id}">${escape(f.name)}</option>`).join('');$('featureSelect').onchange=e=>{if(select(e.target.value))focusFeature(e.target.value);};
 for(const id of Object.keys(DEFAULTS)){const e=$(id==='seam'?'seamSelect':id);if(e)e.addEventListener('input',update);}
 $('reset').onclick=reset;$('regionInfo').onclick=regionNotes;
 $('toggleControls').onclick=()=>$('controls').hidden?openPanel('controls'):closePanels();
 $('closeControls').onclick=$('closeDetails').onclick=()=>closePanels();
 $('mapTab').onclick=()=>{industry?.open(false);showPage('map');};
 $('sources').onclick=()=>{industry?.open(false);showPage('about');};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('controls').hidden||!$('details').hidden)closePanels();else if(document.body.classList.contains('section-open'))$('closeSection').click();}});
 $('sourceBody').innerHTML=`<p>This atlas connects the underground geology with mines and coal uses along the NSW coast. It is an educational reconstruction, not a survey or resource model.</p><h3>What is measured, and what is reconstructed?</h3><ul><li><strong>Terrain:</strong> sampled public elevation data. Horizontal dimensions are kilometres; height and depth use the same selectable vertical exaggeration.</li><li><strong>Mine markers:</strong> GSNSW point locations for all 35 downloaded statewide coal records, plus an approximate historical Birchgrove location. Registry coverage is not a complete inventory of all current and historical mines.</li><li><strong>Underground layers:</strong> smooth conceptual sheets using published seam order and regional/site depth references. Footprints and dip are illustrative. Sydney and Hunter sheets represent formations, not individual mapped seams. No faults or mined-out volumes have been invented.</li><li><strong>Boreholes:</strong> Thin translucent lines show recorded drilling depth below the displayed ground. Select a trace to inspect its source and depth quality. Known directional and branched wells have no vertical trace; suspect depths are withheld. Other lines show schematic drilling distance, not verified vertical penetration. Display heights follow terrain rather than the drilling datum. <a href="./data/borehole-quality.json">Quality ledger and withheld records</a>. The logs have not been used to fit the seams.</li><li><strong>Coal use:</strong> classifications describe documented uses near example mines. Quality and use can vary within a seam.</li><li><strong>Transport:</strong> schematic supply links. Links do not represent actual routes, tonnage or current shipments.</li></ul><h3>Scale and gaps</h3><p>The full corridor is regional in scale. Thin seams would be nearly invisible at true scale, so the display uses coloured surfaces and selectable vertical exaggeration. Sheet edges are model windows, not resource boundaries. The Central Coast gap is left without an invented seam connection. No continuous, verified seam-level 3D model was obtained.</p><h3>Downloads</h3><p><a href="./downloads/NSW-Coal-Atlas.blend" download>Download the editable Blender scene</a>. This earlier export predates the statewide terrain and depth-quality corrections. The full 150-second camera tour and source notes are embedded in the file. Toggle coal-use collections in Blender; mixed-use belongs under either filter.</p><p><a href="./downloads/NSW-Coal-Flythrough.mp4" download>Download the recorded flythrough (MP4)</a> · Silent recording of the complete 150-second interactive tour, including setup.</p><h3>Sources · snapshot 11 September 2026</h3><ol>${data.sources.map(s=>`<li><a href="${escape(s.url)}" target="_blank" rel="noopener">${escape(s.title)}</a><br>${escape(s.note)}</li>`).join('')}</ol><p><a href="./data/atlas.json" download>Download the model and provenance (JSON)</a> · <a href="./data/terrain-wide.json" download>Download statewide terrain samples</a> · <a href="./data/terrain.json" download>Download original corridor samples</a> · <a href="./data/terrain-corrections.json" download>Reviewed terrain corrections and sources</a></p>`;

}
function animate(t){if($('mapPage').hidden||document.hidden){last=t;requestAnimationFrame(animate);return;}const dt=Math.min(.1,(t-last)/1000);last=t;frameCount++;

 if(transition){const p=matchMedia('(prefers-reduced-motion: reduce)').matches?1:Math.min(1,(t-transition.start)/1600),q=p*p*(3-2*p);camera.position.lerpVectors(transition.from,transition.to,q);controls.target.lerpVectors(transition.targetFrom,transition.targetTo,q);if(p===1)transition=null;}
 controls.update();
 for(const [id,o]of featureObjects){const size=Math.max(1,Math.min(6,camera.position.distanceTo(o.group.position)/100));o.mesh.scale.setScalar(size*(selected===id?1.65:1));o.ring.scale.setScalar(size);}
 for(const p of mapLabels){const v=new THREE.Vector3(p.data.position[0],p.data.position[1]*state.exaggeration+1.3,p.data.position[2]);const dist=camera.position.distanceTo(v);v.project(camera);const show=(!p.data.regionLabel||$('regionSelect').value==='all')&&state.showLabels&&v.z<1&&v.z>-1&&Math.abs(v.x)<.96&&Math.abs(v.y)<.92&&(p.data.major||dist<105||selected===p.data.id)&&(!p.data.mine||featureObjects.get(p.data.id).group.visible)&&p.data.position[0]<=clipPlane.constant;p.el.hidden=!show;if(show){p.el.style.left=(v.x*.5+.5)*view.clientWidth+'px';p.el.style.top=((-v.y*.5+.5)*view.clientHeight+(p.data.mine?-15:p.data.regionLabel?-25:0))+'px';}}
 for(const r of routeObjects.values())if(r.group.visible&&r.curve&&r.dot)r.dot.position.copy(r.curve.getPoint((t/6500)%1));
 geology?.animate(t);
 renderer.render(scene,camera);requestAnimationFrame(animate);
}
function registerTools(){
 // Exposed read-only status and explicit UI actions are also used by the functional checks.
 window.coalAtlas={inspectRegistryBore,focusFeature,pause,getState:()=>({ready:true,state:{...state},selected,playing,progress,chapter:currentChapter,visibleSeams:visibleSeams(data,state).map(s=>s.id),visibleMines:visibleMines(data,state).map(s=>s.id),visibleRoutes:visibleRoutes(data,state).map(s=>s.id),frameCount,camera:camera.position.toArray(),target:controls.target.toArray(),triangles:renderer.info.render.triangles,projectedMines:[...featureObjects].filter(([id,o])=>o.data.kind==='mine').map(([id,o])=>({id,position:o.group.position.clone().project(camera).toArray()})),renderedSeams:[...seamObjects].filter(([id,o])=>o.mesh.visible).map(([id])=>id),renderedMines:[...featureObjects].filter(([id,o])=>o.group.visible).map(([id])=>id),renderedRoutes:[...routeObjects].filter(([id,o])=>o.group.visible).map(([id])=>id),boreVisible:boreGroup.visible,groundOpacity:terrainMesh.material.opacity,clipX:clipPlane.constant}),select,seek,chapter,overview,reset};
 const context=document.modelContext||navigator.modelContext;
 if(context?.registerTool){
  const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  const register=tool=>{try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(e=>console.warn('Optional WebMCP registration unavailable',e));}catch(e){console.warn('Optional WebMCP registration unavailable',e);}};
  register({name:'coal_atlas_status',title:'Read atlas state',description:'Read coal filters, selected feature and flythrough position.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:async()=>window.coalAtlas.getState()});
  register({name:'coal_atlas_select',title:'Select a coal feature',description:'Select a documented seam, mine or destination by ID and show its evidence panel.',inputSchema:{type:'object',properties:{id:{type:'string'}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async(input)=>{if(!input||typeof input.id!=='string'||!select(input.id))throw new Error('Unknown feature ID');return {selected:input.id};}});
 }

}
try{
 const responses=await Promise.all([fetch('./data/atlas.json'),fetch('./data/terrain-wide.json'),fetch('./data/industry.json'),fetch('./data/mine-geology.json')]);if(responses.some(r=>!r.ok))throw new Error('The local dataset could not be loaded.');[data,terrain,inventory,depositRegister]=await Promise.all(responses.map(r=>r.json()));
 for(const source of inventory.sources)if(!data.sources.some(s=>s.id===source.id))data.sources.push(source);
 for(const record of inventory.records){
  const existing=data.mines.find(m=>m.id===record.id),height=terrainHeight(terrain,record.lon,record.lat),coverage=height===null?'Outside the terrain and underground model coverage. Marker shows registry coordinates only; elevation is not modelled.':'Registry location on sampled terrain; no mine workings are modelled.';
  if(height===null)throw new Error(`Missing terrain for ${record.name}`);
  if(existing){existing.position=geo(record.lon,record.lat,Math.max(0,height));existing.coverage=coverage;continue;}
  data.mines.push({...record,kind:'mine',position:geo(record.lon,record.lat,Math.max(0,height??0)),confidence:'GSNSW point location',status:record.registryStatus,coverage,description:record.description||`${record.name} is a ${record.method?.toLowerCase()||'coal'} operation in the ${record.region} coalfield.`});
 }

 initScene();setupUI();update();overview();registerTools();requestAnimationFrame(animate);
 geology=await initGeology({THREE,scene,camera,controls,renderer,data,terrain,terrainMesh,clipPlane,seamObjects,geo,select,focusFeature,setCamera,pause,update,getState:()=>state,getSelected:()=>selected});
 industry=await initIndustry({data,depositRegister,industry:inventory,boreholes:geology.boreholes,select,focusFeature,pause});
 geology.sync(state,selected);$('loading').remove();document.body.dataset.ready='true';
}catch(error){console.error(error);$('loading').innerHTML=`<h2>The landscape could not start</h2><p>${escape(error.message)}</p><p>Open through the supplied local server or hosted site, and use a browser with WebGL enabled.</p><button onclick="location.reload()">Try again</button><p><a href="./data/atlas.json">Open the source dataset</a></p>`;}
