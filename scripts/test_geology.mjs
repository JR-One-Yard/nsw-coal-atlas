import assert from 'node:assert/strict';
import fs from 'node:fs';
import {meshHeight,terrainHeight,sampleSection,mappedUnitAt,TRANSECTS,matchesStratigraphy,faultCrossings} from '../dist/geology-model.js';
const read=name=>JSON.parse(fs.readFileSync('dist/data/'+name));
const a=read('atlas.json'),terrain=read('terrain.json'),local=read('illawarra-terrain.json'),surface=read('surface-geology.json'),industry=read('industry.json');
const bytes=fs.readFileSync('dist/data/illawarra-surface-index.bin'),index=Uint16Array.from({length:bytes.length/2},(_,i)=>bytes.readUInt16LE(i*2));
const checks=[];
function check(name,fn){fn();checks.push({name,passed:true});console.log('PASS',name);}
check('Triangle interpolation returns the known planar height and preserves outside gaps',()=>{
 const mesh={positions:[0,0,0, 2,2,0, 0,4,2],indices:[0,1,2]};
 assert.equal(meshHeight(mesh,.5,.5),1500);assert.equal(meshHeight(mesh,0,0),0);assert.equal(meshHeight(mesh,2,2),null);
});
check('Terrain sampling uses metres, correct north/south orientation, and explicit no coverage',()=>{
 const t={bounds:[0,0,1,1],nx:2,ny:2,elevations:[0,100,200,300]};assert.equal(terrainHeight(t,.5,.5),150);assert.equal(terrainHeight(t,1,0),300);assert.equal(terrainHeight(t,0,1),0);assert.equal(terrainHeight(t,2,1),null);
});
check('Mapped feature index matches dimensions and every nonzero ID exists',()=>{
 assert.equal(index.length,surface.width*surface.height);assert(index.every(i=>i<=surface.units.length));assert(index.some(i=>i>0));assert.equal(new Set(surface.units.map(u=>u.id)).size,surface.units.length);
});
check('Mapped lookup respects bounds and exposes source unit attributes',()=>{
 assert.equal(mappedUnitAt(surface,index,149,-30),null);
 let unit;for(let lat=-34.5;lat<-34.05&&!unit;lat+=.02)unit=mappedUnitAt(surface,index,150.8,lat);
 assert(unit?.unit_name);assert(unit?.feature_id);assert(unit?.age_range);
});
check('Each preset produces finite increasing distances without filling missing seam coverage',()=>{
 for(const t of TRANSECTS){const s=sampleSection(a,terrain,local,t.a,t.b,61);assert(s.length>10);assert(s.samples.every((p,i)=>Number.isFinite(p.ground)&&(i===0||p.km>s.samples[i-1].km)));assert(s.samples.some(p=>Object.values(p.seams).some(v=>v===null)));}
});
check('Section southern seam elevations retain the shared model order',()=>{
 const s=sampleSection(a,terrain,local,TRANSECTS[0].a,TRANSECTS[0].b,61);
 const inside=s.samples.filter(p=>p.seams.bulli!==null&&p.seams.balgownie!==null&&p.seams.wongawilli!==null);assert(inside.length>20);assert(inside.every(p=>p.seams.bulli>p.seams.balgownie&&p.seams.balgownie>p.seams.wongawilli));
});
check('Fine terrain spans exactly the mapped geology extent and has complete finite heights',()=>{assert.deepEqual(local.bounds,surface.bounds);assert.equal(local.elevations.length,local.nx*local.ny);assert(local.elevations.every(Number.isFinite));});
check('Every downloaded coal registry record appears once in the industry inventory',()=>{
 const raw=read('nsw-operating-mines.geojson').features.filter(f=>f.properties.comm_type==='COAL');assert.deepEqual(industry.records.map(r=>r.registryId).sort(),raw.map(f=>f.properties.occurrence_id).sort());assert.equal(new Set(industry.records.map(r=>r.id)).size,industry.records.length);
});
check('Industry links and metrics retain resolvable citations, periods and aggregation basis',()=>{
 const ids=new Set(industry.sources.map(s=>s.id));
 for(const r of industry.records){assert(r.sources.length);assert(r.sources.every(id=>ids.has(id)));assert(r.reviewedAt);assert.equal(Object.hasOwn(r,'saleableMt'),false);if(r.complexId)assert(industry.complexes[r.complexId]);}
 for(const c of Object.values(industry.complexes)){assert(c.period&&c.basis&&ids.has(c.source));assert(c.saleableMt>0);}
});
check('Stratigraphic exposure matching uses published parentage and keeps missing units explicit',()=>{
 assert(matchesStratigraphy({unit_name:'Ashfield Shale',all_stratigraphy:'/Wianamatta Group/Ashfield Shale/'},'wianamatta'));
 assert(matchesStratigraphy({unit_name:'Hawkesbury Sandstone - mudstone'},'hawkesbury'));
 assert(!matchesStratigraphy({unit_name:'Bulli-like sandstone'},'bulli'));
 assert(!matchesStratigraphy({unit_name:'Illawarra Coal Measures'},'lower'));
 assert(surface.units.some(u=>matchesStratigraphy(u,'wongawilli')));
});
check('Fault intersections retain source evidence, direction and distinct crossings without vertex duplicates',()=>{
 const f={id:'f1',properties:{descriptn:'Normal fault, inferred'},geometry:{type:'LineString',coordinates:[[151,-34.1],[151,-34],[151,-33.9]]}};
 const s={bounds:[150,-35,152,-33],faults:[f]},a=[150.9,-34],b=[151.1,-34],h=faultCrossings(s,a,b);
 assert.equal(h.length,1);assert(Math.abs(h[0].lon-151)<1e-8);assert.equal(h[0].descriptn,'Normal fault, inferred');
 const reverse=faultCrossings(s,b,a);assert(Math.abs(h[0].km-reverse[0].km)<1e-6);
 assert.equal(faultCrossings(s,[150.8,-34.1],[150.8,-33.9]).length,0);
 assert.equal(faultCrossings(s,a,a).length,0);
});
fs.writeFileSync('evidence/geology-model-tests.json',JSON.stringify({date:new Date().toISOString(),checks},null,2));
