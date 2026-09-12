import {depthQuality,markDirectionalFamilies} from './bore-quality.js';
import {openPanel,closePanels} from './navigation.js';
import {initBoreholes} from './boreholes.js';
import {TRANSECTS,STRATIGRAPHY,GEOLOGY_SOURCES,terrainHeight,sampleSection,mappedUnitAt,within,matchesStratigraphy,faultCrossings} from './geology-model.js';

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const links=()=>GEOLOGY_SOURCES.map(s=>`<li><a href="${s.url}" target="_blank" rel="noopener">${s.title}</a></li>`).join('');

export async function initGeology(api) {
  const {THREE,scene,camera,controls,renderer,data,terrain,terrainMesh,clipPlane,seamObjects,geo,select,pause,update,getState,getSelected}=api;
  const [surface,localTerrain,indexBuffer,texture]=await Promise.all([
    fetch('./data/surface-geology.json').then(checkJSON),fetch('./data/illawarra-terrain.json').then(checkJSON),
    fetch('./data/illawarra-surface-index.bin').then(r=>{if(!r.ok)throw Error('Surface index unavailable');return r.arrayBuffer();}),
    new THREE.TextureLoader().loadAsync('./data/illawarra-surface.png')
  ]);
  const dv=new DataView(indexBuffer),index=Uint16Array.from({length:indexBuffer.byteLength/2},(_,i)=>dv.getUint16(i*2,true));
  texture.colorSpace=THREE.SRGBColorSpace;
  const gs={surface:true,faults:false,open:false,transect:0,inspect:false};
  let section,lastSectionKey='',lastSyncKey='',selectedUnit=null,curtain=null,sectionLine=null,cursorMarker=null,surfaceFocus=null,crossings=[],boreholes=null,boreMarker=null,boreLocations=null,boreDepths=null;

  // Replace the coarse surface inside the local tile, so the two meshes do not overlap.
  const [w,s,e,n]=localTerrain.bounds,low=geo(w,n),high=geo(e,s);
  terrainMesh.material.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 atlasLocal;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\natlasLocal=position;');
    shader.fragmentShader='varying vec3 atlasLocal;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>\nif(atlasLocal.x>${low[0]}&&atlasLocal.x<${high[0]}&&atlasLocal.z>${low[2]}&&atlasLocal.z<${high[2]})discard;`);
  };
  terrainMesh.material.needsUpdate=true;
  const positions=[],colors=[],uv=[],indices=[];
  for(let j=0;j<localTerrain.ny;j++)for(let i=0;i<localTerrain.nx;i++){
    const h=localTerrain.elevations[j*localTerrain.nx+i];
    positions.push(...geo(w+(e-w)*i/(localTerrain.nx-1),n-(n-s)*j/(localTerrain.ny-1),Math.max(0,h)));
    const c=new THREE.Color(h<=0?'#143d53':h<20?'#73897a':h<150?'#648278':h<400?'#59776c':'#81${W-R}3');
    colors.push(c.r,c.g,c.b);uv.push(i/(localTerrain.nx-1),1-j/(localTerrain.ny-1));
  }
  for(let j=0;j<localTerrain.ny-1;j++)for(let i=0;i<localTerrain.nx-1;i++){
    const a=j*localTerrain.nx+i;indices.push(a,a+localTerrain.nx,a+1,a+1,a+localTerrain.nx,a+localTerrain.nx+1);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  const geologyUniform={value:1},focusUniform={value:0};
  const focusPixels=new Uint8Array(index.length),focusTexture=new THREE.DataTexture(focusPixels,surface.width,surface.height,THREE.RedFormat);focusTexture.needsUpdate=true;
  const displayedIds=new Set(index);
  const material=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:1,transparent:true,opacity:.35,depthWrite:false,clippingPlanes:[clipPlane]});
  material.onBeforeCompile=shader=>{
    shader.uniforms.atlasFocus={value:focusTexture};shader.uniforms.atlasFocused=focusUniform;shader.uniforms.atlasMap={value:texture};shader.uniforms.atlasMapped=geologyUniform;
    shader.vertexShader='varying vec2 atlasUV;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\natlasUV=uv;');
    shader.fragmentShader='uniform sampler2D atlasMap;uniform sampler2D atlasFocus;uniform float atlasFocused;uniform float atlasMapped;varying vec2 atlasUV;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nvec4 atlasRock=texture2D(atlasMap,atlasUV);diffuseColor.rgb=mix(diffuseColor.rgb,atlasRock.rgb,atlasRock.a*atlasMapped);diffuseColor.rgb*=mix(1.0,mix(0.18,1.0,texture2D(atlasFocus,atlasUV).r),atlasFocused*atlasMapped);');
  };
  const localMesh=new THREE.Mesh(geometry,material);localMesh.renderOrder=3;scene.add(localMesh);

  // Published surface traces only: no fabricated fault planes or displacements.
  const faultPositions=[];
  for(const f of surface.faults){
    const lines=f.geometry.type==='LineString'?[f.geometry.coordinates]:f.geometry.coordinates;
    for(const line of lines)for(let i=1;i<line.length;i++){
      if(!within(localTerrain.bounds,...line[i-1])||!within(localTerrain.bounds,...line[i]))continue;
      for(const point of [line[i-1],line[i]])faultPositions.push(...geo(point[0],point[1],Math.max(0,terrainHeight(localTerrain,point[0],point[1]))+5));
    }
  }
  const fg=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(faultPositions,3));
  const faultMesh=new THREE.LineSegments(fg,new THREE.LineBasicMaterial({color:'#fb6477',transparent:true,opacity:.9,clippingPlanes:[clipPlane]}));scene.add(faultMesh);

  $('stage').insertAdjacentHTML('beforeend',`<section id="sectionPanel" hidden aria-label="Linked geological cross-section"><div class="section-heading"><div><h2 id="sectionTitle">Plateau to coast</h2></div><button id="closeSection" aria-label="Close cross-section">×</button></div><div class="section-tools"><label class="sr-only" for="transect">Cross-section location</label><select id="transect">${TRANSECTS.map((t,i)=>`<option value="${i}">${t.name}</option>`).join('')}<option value="custom">Custom line</option></select><button id="sectionScale" aria-pressed="false">True scale</button><button id="exportSection">Export SVG</button></div><details id="sectionCoordinates"><summary>Set endpoints by coordinates</summary><div>${['aLon','aLat','bLon','bLat'].map((id,i)=>`<label>${['A longitude','A latitude','B longitude','B latitude'][i]}<input id="${id}" type="number" step="0.001" value="${[150.66,-34.30,151.02,-34.30][i]}"></label>`).join('')}<button id="applySection">Apply</button></div></details><p id="sectionMessage" class="micro" aria-live="polite"></p><div id="sectionChart" tabindex="0" role="region" aria-label="Cross-section chart, scroll horizontally on small screens"></div><details id="sectionFaults" hidden><summary id="sectionFaultCount"></summary><div id="sectionFaultList"></div></details><p id="sectionReadout" class="micro" aria-live="off"></p></section>`);
  $('sourceBody').insertAdjacentHTML('afterbegin',`<div class="geology-source-note"><h3>Illawarra geological mapping</h3><p>${surface.units.length.toLocaleString()} rock-unit polygons and ${surface.faults.length.toLocaleString()} fault segments from GSNSW Seamless Geology, downloaded ${surface.date}. CC BY 4.0, Geological Survey of New South Wales. Local elevation uses Mapzen Terrarium z11 at 257 × 257 samples.</p><p>Mapped geology is a published interpretation. Fault traces are draped on the terrain; their underground dip and throw have not been inferred. The linked sections intersect the actual illustrative seam meshes. Published borehole picks are available in the evidence viewer and section overlay. They have not been used to fit the illustrative seams.</p><ul>${links()}</ul><a href="./data/surface-geology.json" download>Download mapped unit metadata and fault traces</a></div>`);

  $('stage').insertAdjacentHTML('beforeend','<div id="inspectHint" hidden role="status">Select a surface rock in Illawarra. <button id="stopInspect">Done</button></div>');
  $('sectionPanel').insertAdjacentHTML('beforeend','<details id="sectionOptions"><summary>Section options</summary><div id="sectionOptionsBody"></div></details>');
  $('sectionOptionsBody').append($('sectionCoordinates'),$('sectionFaults'));
  $('sectionChart').before($('sectionOptions'));
  let trueScale=false,custom=null;
  function showStrata(show=true){
    $('strataPanel').hidden=!show;$('detailBody').hidden=show;$('detailHeading').textContent=show?'Rock sequence':'Details';openPanel('details');
    if(!show)return;
    const id=surfaceFocus?.strataId||getSelected();
    const regional=gs.transect===2||gs.transect===3;
    const entries=regional?data.seams.filter(s=>gs.transect===2?['wallarah','greatnorthern','fassifern'].includes(s.id):s.id==='hunter').map(s=>({id:s.id,name:s.name,age:'Permian',color:s.color,lithology:s.kind==='formation'?'Composite coal-bearing succession':'Coal in the Newcastle Coal Measures',note:s.description})):STRATIGRAPHY;
    $('strataPanel').innerHTML=`<span class="eyebrow">${regional?'SELECTED REGIONAL UNITS':'SOUTHERN / SYDNEY BASIN'}</span><h2>Younger to older</h2><p class="micro">Simplified order. Row heights do not represent thickness or duration. Intervening units are omitted.</p><div class="strata-stack">${entries.map(u=>`<button class="strata-unit ${u.id===id?'active':''}" data-unit="${u.id}" style="--rock:${u.color}"><span class="rock-chip"></span><span><b>${esc(u.name)}</b><small>${esc(u.age)} · ${esc(u.lithology)}</small></span></button>`).join('')}</div><div id="strataNote"><p>Select a unit to explore its evidence.</p></div><details><summary>Stratigraphic sources</summary><ul>${links()}</ul></details>`;
    $('strataPanel').querySelectorAll('[data-unit]').forEach(el=>el.onclick=()=>{
      const unit=entries.find(u=>u.id===el.dataset.unit);
      if(data.seams.some(s=>s.id===unit.id)){select(unit.id);showStrata(true);}
      $('strataPanel').querySelectorAll('[data-unit]').forEach(b=>b.classList.toggle('active',b.dataset.unit===unit.id));
      focusSurface(u=>matchesStratigraphy(u,unit.id),unit.name,unit.id);
      $('strataNote').innerHTML=`<h3>${esc(unit.name)}</h3><p>${esc(unit.note)}</p>${!data.seams.some(s=>s.id===unit.id)?'<p class="micro">Matching surface exposures are highlighted where the published map identifies them. Local depth is not reconstructed.</p>':''}`;
    });
  }
  function setSection(open){
    gs.open=open;$('sectionPanel').hidden=!open;document.body.classList.toggle('section-open',open);
    if(open){closePanels();buildSection();}
    if(sectionLine)sectionLine.visible=open;if(curtain)curtain.visible=open;
    $('openSection').setAttribute('aria-expanded',String(open));
    if(!open)$('openSection').focus();
    requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
  }
  function chosen(){return custom&&$('transect').value==='custom'?custom:TRANSECTS[gs.transect];}
  function buildSection(){
    const t=chosen(),key=JSON.stringify([t.a,t.b]);
    if(key!==lastSectionKey){section=sampleSection(data,terrain,localTerrain,t.a,t.b);lastSectionKey=key;crossings=faultCrossings(surface,t.a,t.b);rebuildCurtain();}
    $('sectionTitle').textContent='Cross-section';
    [t.a[0],t.a[1],t.b[0],t.b[1]].forEach((v,i)=>$( ['aLon','aLat','bLon','bLat'][i]).value=v.toFixed(4));
    renderSection();
  }
  function rebuildCurtain(){
    for(const object of [curtain,sectionLine])if(object){scene.remove(object);object.geometry.dispose();object.material.dispose();}
    const linePoints=section.samples.map(p=>new THREE.Vector3(...geo(p.lon,p.lat,p.ground+12)));
    sectionLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePoints),new THREE.LineBasicMaterial({color:'#ffffff',depthTest:false}));sectionLine.renderOrder=8;
    const p=[],ix=[];
    for(const s of section.samples)p.push(...geo(s.lon,s.lat,s.ground),...geo(s.lon,s.lat,-1600));
    for(let i=0;i<section.samples.length-1;i++){const a=i*2;ix.push(a,a+1,a+2,a+2,a+1,a+3);}
    const g=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();
    curtain=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:'#b8e2ec',transparent:true,opacity:.075,side:THREE.DoubleSide,depthWrite:false}));
    scene.add(sectionLine,curtain);sectionLine.visible=curtain.visible=gs.open;sectionLine.scale.y=curtain.scale.y=getState().exaggeration;
  }
  function renderSection(){
    if(!section)return;
    const state=getState(),selected=getSelected(),W=1000,H=234,L=88,R=48,top=28,bottom=194;
    const active=data.seams.filter(s=>state[s.tags[0]]||s.tags.some(t=>state[t])).filter(s=>state.seam==='all'||state.seam===s.id);
    const picks=(boreholes?.getSectionPicks(chosen().a,chosen().b)||[]).filter(p=>active.some(s=>s.id===p.seamId));
    const values=[...picks.map(p=>p.pick.topAHD),...section.samples.flatMap(s=>[s.ground,...active.map(f=>s.seams[f.id]).filter(v=>v!==null)])];
    const min=Math.floor((Math.min(...values)-100)/200)*200,max=Math.ceil((Math.max(...values)+100)/200)*200;
    const xScale=(W-L-R)/section.length,ve=trueScale?1:(bottom-top)/((max-min)/1000*xScale);
    const px=km=>L+km*xScale,py=h=>top+(max-h)/1000*xScale*ve;
    const path=values=>{let pen=false;return values.map((h,i)=>{if(h===null){pen=false;return '';}const command=pen?'L':'M';pen=true;return `${command}${px(section.samples[i].km).toFixed(2)},${py(h).toFixed(2)}`;}).join(' ');};
    let content=`<rect width="${W}" height="${H}" fill="#0d202a"/><text x="${L}" y="18" fill="#9ab4c1" font-size="16">A · ${esc(chosen().labels?.[0]||'Start')}</text><text x="${W-R}" y="18" text-anchor="end" fill="#9ab4c1" font-size="16">${esc(chosen().labels?.[1]||'End')} · B</text>`;
    for(let i=0;i<=4;i++){
      const h=min+(max-min)*i/4,y=py(h);
      if(!trueScale||i===0||i===4)content+=`<path d="M${L},${y}H${W-R}" stroke="#29404b" stroke-width=".6"/><text x="${L-10}" y="${y+3}" text-anchor="end" fill="#9ab4c1" font-size="16">${Math.round(h)} m</text>`;
    }
    content+=`<path d="${path(section.samples.map(s=>s.ground))} L${W-R},${py(min)} L${L},${py(min)} Z" fill="#667b722b"/><path d="M${L},${py(0)}H${W-R}" stroke="#547f91" stroke-dasharray="4 4"/>`;
    section.samples.slice(0,-1).forEach((p,i)=>{
      const unit=mappedUnitAt(surface,index,p.lon,p.lat);
      if(unit)content+=`<path d="M${px(p.km)},${py(p.ground)} L${px(section.samples[i+1].km)},${py(section.samples[i+1].ground)}" stroke="${esc(unit.colour_rgb)}" stroke-width="5"/>`;
    });
    content+=`<path d="${path(section.samples.map(s=>s.ground))}" fill="none" stroke="#c5d8cf" stroke-width="1.2"/>`;
    if(gs.faults)for(const f of crossings){
      const ground=terrainHeight(localTerrain,f.lon,f.lat)??0,x=px(f.km),y=py(Math.max(0,ground));
      content+=`<g data-fault="${esc(f.id)}" role="button" tabindex="0" aria-label="Inspect mapped fault crossing"><title>${esc(f.structure_name||f.descriptn)} · surface trace only</title><path d="M${x},${y-16}v16" stroke="#fb6477" stroke-width="2"/><path d="M${x-4},${y-6}l4,6 4,-6" fill="none" stroke="#fb6477"/></g>`;
    }
    for(const seam of active){
      const d=path(section.samples.map(p=>p.seams[seam.id]));if(!d.trim())continue;
      const color=seam.color;
      content+=`<g data-seam="${seam.id}" role="button" tabindex="0" aria-label="Select ${esc(seam.name)}"><title>${esc(seam.name)} · illustrative geometry</title><path d="${d}" fill="none" stroke="transparent" stroke-width="15"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${seam.id===selected?3.5:2}" ${seam.id===selected?'':'stroke-dasharray="5 2"'}/></g>`;
    }
    for(const p of picks){const x=px(p.km),y=py(p.pick.topAHD),color=data.seams.find(s=>s.id===p.seamId).color;
      content+=`<g data-pick="${esc(p.pick.id)}" role="button" tabindex="0" aria-label="Inspect ${esc(p.bore.name)} reported ${esc(p.pick.unit)} top"><title>${esc(p.bore.name)} · ${esc(p.pick.unit)} · ${p.pick.topAHD.toFixed(1)} m AHD · ${p.offsetKm.toFixed(2)} km off section; not deviation-corrected</title><path d="M${x},${y-5}l5,5 -5,5 -5,-5Z" fill="#0d202a" stroke="${color}" stroke-width="2"/></g>`;
    }

    for(let i=0;i<=4;i++){const km=section.length*i/4;content+=`<text x="${px(km)}" y="214" text-anchor="middle" fill="#9ab4c1" font-size="16">${km.toFixed(1)} km</text>`;}
    content+=`<text x="${L}" y="230" fill="#9ab4c1" font-size="14">ASL · ${trueScale?'True scale 1:1':ve.toFixed(1)+'× vertical scale'} · Coal lines are illustrative</text><path id="sectionCursor" stroke="#fff" stroke-width="1" stroke-dasharray="3 3" d=""/>`;
    $('sectionChart').innerHTML=`<svg id="sectionSvg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(chosen().name)}: sampled terrain and illustrative coal surfaces"><title>${esc(chosen().name)}</title><desc>Section of the browser model. Terrain sampled from Mapzen; surface colours from GSNSW mapping; coal seam geometry illustrative. Diamonds are ABSUC 2024 v2 preferred top picks projected from within 1 km, not corrected for borehole deviation. Known horizontal/deviated boreholes excluded. Model vertical references have not been reconciled to AHD. Pick source: https://doi.org/10.26186/149324 . Exported ${surface.date}. Vertical exaggeration ${ve.toFixed(2)}. Sources: ${GEOLOGY_SOURCES.map(s=>s.url).join(' ; ')}</desc>${content}</svg>`;
    $('sectionSvg').querySelectorAll('[data-pick]').forEach(el=>{const action=()=>boreholes.open(picks.find(p=>p.pick.id===el.dataset.pick).bore.id);el.onclick=action;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action();}};});
    $('sectionFaults').hidden=!gs.faults;
    $('sectionFaultCount').textContent=`${crossings.length} mapped fault crossing${crossings.length===1?'':'s'} · surface only`;
    $('sectionFaultList').innerHTML=crossings.length?crossings.map((f,i)=>`<button data-crossing="${i}">${f.km.toFixed(2)} km · ${esc(f.structure_name||f.descriptn)}</button>`).join(''):'<p class="micro">No intersections with the available Illawarra surface traces. This does not establish an absence of faults underground.</p>';
    $('sectionFaultList').querySelectorAll('[data-crossing]').forEach(el=>el.onclick=()=>showFault(crossings[+el.dataset.crossing]));
    $('sectionSvg').querySelectorAll('[data-fault]').forEach(el=>{const action=()=>showFault(crossings.find(f=>f.id===el.dataset.fault));el.onclick=action;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action();}};});
    $('sectionSvg').querySelectorAll('[data-seam]').forEach(el=>{const action=()=>{select(el.dataset.seam);showStrata(true);};el.onclick=action;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action();}};});
    $('sectionSvg').onpointermove=event=>{
      const rect=$('sectionSvg').getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width*W;
      const i=Math.max(0,Math.min(section.samples.length-1,Math.round((x-L)/(W-L-R)*(section.samples.length-1))));
      const p=section.samples[i],unit=mappedUnitAt(surface,index,p.lon,p.lat),h=p.seams[selected];
      $('sectionCursor').setAttribute('d',`M${px(p.km)},24V${bottom}`);
      $('sectionReadout').textContent=`${p.km.toFixed(1)} km · Ground ${Math.round(p.ground)} m ASL${unit?' · Mapped: '+unit.unit_name:''}${h!=null?' · Selected model surface '+Math.round(h)+' m ASL; '+Math.round(p.ground-h)+' m below ground':''}`;
      if(!cursorMarker){cursorMarker=new THREE.Mesh(new THREE.SphereGeometry(.25,10,8),new THREE.MeshBasicMaterial({color:'#fff',depthTest:false}));cursorMarker.renderOrder=10;scene.add(cursorMarker);}
      cursorMarker.position.set(...geo(p.lon,p.lat,(p.ground+15)*getState().exaggeration));cursorMarker.visible=gs.open;
    };
  }
  function setTransect(i,focus=true){
    gs.transect=i;custom=null;$('sectionMessage').textContent='';$('sectionPanel').scrollTop=0;$('transect').value=String(i);lastSectionKey='';buildSection();
    if(focus){pause();const t=TRANSECTS[i],target=new THREE.Vector3(...geo((t.a[0]+t.b[0])/2,(t.a[1]+t.b[1])/2,-100));api.setCamera(target,new THREE.Vector3(24,28,30));}
    if(!$('details').hidden&&!$('strataPanel').hidden)showStrata(true);
  }
  function focusSurface(predicate,label,strataId=null){
    const ids=new Set(surface.units.flatMap((u,i)=>predicate(u)&&displayedIds.has(i+1)?[i+1]:[]));
    if(ids.size){
      for(let y=0;y<surface.height;y++)for(let x=0;x<surface.width;x++)focusPixels[(surface.height-1-y)*surface.width+x]=ids.has(index[y*surface.width+x])?255:0;
      focusTexture.needsUpdate=true;focusUniform.value=1;surfaceFocus={label,strataId,count:ids.size};
      gs.surface=$('surfaceMap').checked=true;$('opacity').value=95;
    }else{focusUniform.value=0;surfaceFocus=null;}
    $('surfaceFocus').hidden=false;$('surfaceFocusText').textContent=ids.size?`${label}: ${ids.size} mapped features highlighted. Other surface rocks are dimmed.`:`No matching mapped exposures of ${label} in this tile. The full surface map remains visible.`;
    update();
  }
  function clearSurfaceFocus(){focusUniform.value=0;surfaceFocus=null;$('surfaceFocus').hidden=true;}
  function showFault(f){
    showStrata(false);$('detailBody').innerHTML=`<span class="evidence-badge mapped">PUBLISHED SURFACE FAULT TRACE</span><h2>${esc(f.structure_name||'Unnamed mapped fault')}</h2><dl><dt>Crossing</dt><dd>${f.km.toFixed(2)} km from A</dd><dt>Map description</dt><dd>${esc(f.descriptn)}</dd><dt>Exposure</dt><dd>${esc(f.exposure||'Not specified')}</dd></dl><p>${esc(f.reference||f.source_dataset)}</p><p class="notice">The arrow marks where this section meets the mapped surface trace. It supplies no underground fault dip, throw or seam displacement.</p><p class="micro">GSNSW feature ${esc(f.feature_id)} · ${esc(f.id)} · CC BY 4.0</p><ul>${links()}</ul>`;
  }
  function showUnit(unit,lon,lat){
    selectedUnit=unit.id;focusSurface(u=>u.nsw_code===unit.nsw_code,unit.unit_name);showStrata(false);openPanel('details');
    $('detailBody').innerHTML=`<span class="evidence-badge mapped">PUBLISHED GEOLOGICAL MAPPING</span><h2>${esc(unit.unit_name)}</h2><p>${esc(unit.descriptn)}</p><dl><dt>Rock type</dt><dd>${esc(unit.dominant_lithology)}</dd><dt>Age</dt><dd>${esc(unit.age_range)}</dd><dt>Depositional setting</dt><dd>${esc(unit.depositional_environment||'Not specified')}</dd><dt>Unit code</dt><dd>${esc(unit.nsw_code)}</dd><dt>Location</dt><dd>${lat.toFixed(4)}°, ${lon.toFixed(4)}°</dd></dl><p class="micro">${esc(unit.all_stratigraphy?.split('/').filter(Boolean).join(' → '))}</p><p class="notice">This is the published interpretation of the surface rock unit. It does not establish an underground coal seam or its depth.</p><details open><summary>Source evidence</summary><p class="micro">GSNSW NSW Seamless Geology · feature ${esc(unit.feature_id)} · snapshot ${surface.date} · CC BY 4.0.</p><ul>${links()}</ul></details>`;
  }
  function handleSceneClick(event,ray){
    if(!gs.inspect){
      if(boreLocations?.visible){ray.params.Points.threshold=.35;ray.params.Line.threshold=.3;const collar=ray.intersectObject(boreLocations)[0],trace=ray.intersectObject(boreDepths)[0];if(collar||trace){boreholes.open(collar?boreholes.data.bores[collar.index].id:boreDepths.userData.ids[Math.floor(trace.index/2)]);return true;}}
      return false;
    }
    const hit=ray.intersectObjects([localMesh,terrainMesh]).find(h=>h.point.x<=clipPlane.constant&&!(h.object===terrainMesh&&h.point.x>low[0]&&h.point.x<high[0]&&h.point.z>low[2]&&h.point.z<high[2]));
    if(!hit)return true;
    const lon=hit.point.x/(111.32*Math.cos(-33.55*Math.PI/180))+151.15,lat=-33.55-hit.point.z/111.32;
    const unit=mappedUnitAt(surface,index,lon,lat);
    if(unit)showUnit(unit,lon,lat);else{showStrata(false);$('detailBody').innerHTML='<h2>No mapped unit here</h2><p>The detailed surface map covers Illawarra. An empty result is not a geological classification.</p>';}
    return true;
  }

  $('clearSurfaceFocus').onclick=()=>{clearSurfaceFocus();update();};
  $('surfaceMap').onchange=()=>{gs.surface=$('surfaceMap').checked;update();};$('mappedFaults').onchange=()=>{gs.faults=$('mappedFaults').checked;update();};
  $('openSection').onclick=()=>setSection(!gs.open);$('closeSection').onclick=()=>setSection(false);
  $('openStrata').onclick=()=>showStrata(true);
  $('inspectSurface').onclick=()=>{gs.inspect=!gs.inspect;$('inspectSurface').setAttribute('aria-pressed',String(gs.inspect));$('inspectSurface').textContent=gs.inspect?'Stop inspecting':'Inspect surface rock';$('inspectHint').hidden=!gs.inspect;if(gs.inspect){$('opacity').value=100;gs.surface=$('surfaceMap').checked=true;closePanels();update();}};
  $('stopInspect').onclick=()=>{gs.inspect=false;$('inspectSurface').setAttribute('aria-pressed','false');$('inspectSurface').textContent='Inspect surface rock';$('inspectHint').hidden=true;};
  $('transect').onchange=()=>{if($('transect').value==='custom'){if(!custom){$('sectionOptions').open=true;$('sectionCoordinates').open=true;$('sectionMessage').textContent='Enter the start and end coordinates in Section options.';}else buildSection();}else setTransect(+$('transect').value);};
  $('sectionScale').onclick=()=>{trueScale=!trueScale;$('sectionScale').setAttribute('aria-pressed',String(trueScale));$('sectionScale').textContent=trueScale?'Fit vertically':'True scale';renderSection();};
  $('applySection').onclick=()=>{
    const values=['aLon','aLat','bLon','bLat'].map(id=>$(id).value.trim()===''?NaN:Number($(id).value));const a=values.slice(0,2),b=values.slice(2);
    if(values.some(v=>!Number.isFinite(v))||!within(terrain.bounds,...a)||!within(terrain.bounds,...b)||Math.hypot(a[0]-b[0],a[1]-b[1])<.001){$('sectionMessage').textContent='Use two distinct points inside the regional model: 150.45–152.05°E, 34.65–32.45°S.';return;}
    custom={a,b,name:'Custom geological section',labels:['A','B']};$('transect').value='custom';lastSectionKey='';buildSection();$('sectionMessage').textContent='Custom section applied. Underground gaps are preserved.';
  };
  $('exportSection').onclick=()=>{const blob=new Blob([$('sectionSvg').outerHTML],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='NSW-geological-section.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};


  function sync(state,selected){
    if(boreLocations){boreLocations.scale.y=state.exaggeration;boreLocations.visible=$('showBoreLogs').checked;boreDepths.scale.y=state.exaggeration;boreDepths.visible=boreLocations.visible;}
    if(boreMarker){const b=boreMarker.userData;boreMarker.position.set(...geo(b.lon,b.lat,(b.height+10)*state.exaggeration));}
    localMesh.scale.y=faultMesh.scale.y=state.exaggeration;localMesh.visible=state.opacity>0;material.opacity=state.opacity/100;material.depthWrite=state.opacity>=98;geologyUniform.value=gs.surface?1:0;faultMesh.visible=gs.faults;
    if(curtain)curtain.scale.y=state.exaggeration;if(sectionLine)sectionLine.scale.y=state.exaggeration;if(cursorMarker&&!gs.open)cursorMarker.visible=false;
    const key=JSON.stringify([state.met,state.thermal,state.unknown,state.seam,selected,gs.faults]);
    if(gs.open&&key!==lastSyncKey){lastSyncKey=key;renderSection();}
    const legend=data.seams.filter(s=>seamObjects.get(s.id).mesh.visible).map(s=>[s.color,s.name.replace(' Coal Seam','').replace(' Coal Measures',' CM')]);
    $('legend').innerHTML=legend.map(([color,name])=>`<span><i class="swatch" style="background:${color}"></i>${esc(name)}</span>`).join('');
  }
  function animate(){
    // The north indicator follows camera azimuth rather than always pointing up.
    const angle=Math.atan2(camera.position.x-controls.target.x,camera.position.z-controls.target.z)*180/Math.PI;
    const north=document.querySelector('.north');if(north){north.textContent='N ↑';north.style.transform=`rotate(${angle}deg)`;}
  }
  function reset(){$('showBoreLogs').checked=true;trueScale=false;$('sectionScale').textContent='True scale';$('sectionScale').setAttribute('aria-pressed','false');$('sectionOptions').open=false;$('sectionCoordinates').open=false;boreholes?.reset();if(boreMarker)boreMarker.visible=false;clearSurfaceFocus();gs.surface=true;gs.faults=false;gs.inspect=false;$('surfaceMap').checked=true;$('mappedFaults').checked=false;$('inspectSurface').setAttribute('aria-pressed','false');$('inspectSurface').textContent='Inspect surface rock';$('inspectHint').hidden=true;setSection(false);closePanels();}
  function onChapter(i){$('stopInspect').click();clearSurfaceFocus();const n=TRANSECTS.findIndex(t=>t.chapter===i||(i===3&&t.chapter===2));if(n>=0)setTransect(n,false);}
  window.coalGeology={getState:()=>({...gs,ready:true,boreDepthTraces:boreDepths?.visible?boreDepths.userData.ids.length:0,boreLocations:boreLocations?.visible?boreholes.data.bores.length:0,selectedUnit,surfaceFocus,crossings:crossings.map(f=>({id:f.id,km:f.km})),surfaceUnits:surface.units.length,faultSegments:surface.faults.length,localVertices:positions.length/3,sectionLength:section?.length,trueScale}),sampleSection:(a,b)=>sampleSection(data,terrain,localTerrain,a,b),mappedUnitAt:(lon,lat)=>mappedUnitAt(surface,index,lon,lat)};
  boreholes=await initBoreholes({seams:data.seams,showPanel:()=>showStrata(false),renderSection,locate:b=>{
    pause();closePanels();const height=Math.max(0,terrainHeight(localTerrain,b.lon,b.lat)??terrainHeight(terrain,b.lon,b.lat)??0),target=new THREE.Vector3(...geo(b.lon,b.lat,(height+10)*getState().exaggeration));
    if(!boreMarker){boreMarker=new THREE.Mesh(new THREE.SphereGeometry(.4,16,12),new THREE.MeshBasicMaterial({color:'#ffffff',depthTest:false}));boreMarker.renderOrder=12;scene.add(boreMarker);}
    boreMarker.userData={lon:b.lon,lat:b.lat,height};boreMarker.position.copy(target);boreMarker.visible=true;api.setCamera(target,new THREE.Vector3(12,15,18));
  }});
  const locations=boreholes.data.bores.flatMap(b=>geo(b.lon,b.lat,Math.max(0,terrainHeight(localTerrain,b.lon,b.lat)??terrainHeight(terrain,b.lon,b.lat)??0)+12));
  const locationGeometry=new THREE.BufferGeometry();locationGeometry.setAttribute('position',new THREE.Float32BufferAttribute(locations,3));
  boreLocations=new THREE.Points(locationGeometry,new THREE.PointsMaterial({color:'#95b6d0',size:2,sizeAttenuation:false,depthTest:true,depthWrite:false,transparent:true,opacity:.25}));scene.add(boreLocations);
  markDirectionalFamilies(boreholes.data.bores);const depths=[],ids=[];for(let i=0;i<boreholes.data.bores.length;i++){const b=boreholes.data.bores[i];if(!depthQuality(b).eligible)continue;const p=locations.slice(i*3,i*3+3);p[1]-=.012;depths.push(...p,p[0],p[1]-b.totalMD/1000,p[2]);ids.push(b.id);}
  const depthGeometry=new THREE.BufferGeometry();depthGeometry.setAttribute('position',new THREE.Float32BufferAttribute(depths,3));boreDepths=new THREE.LineSegments(depthGeometry,new THREE.LineBasicMaterial({color:'#95b6d0',transparent:true,opacity:.3,depthWrite:false,clippingPlanes:[clipPlane]}));boreDepths.userData.ids=ids;scene.add(boreDepths);
  $('showBoreLogs').onchange=()=>update();
  return {sync,animate,reset,onChapter,handleSceneClick,boreholes};
}

async function checkJSON(response){if(!response.ok)throw Error('Geological dataset unavailable');return response.json();}
